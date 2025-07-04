import { references, tags, type Reference, type InsertReference, type Tag, type SearchParams } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, like, sql, desc } from "drizzle-orm";
import { normalizeUrl } from "./utils";

export interface IStorage {
  // Reference CRUD operations
  getReference(id: number): Promise<Reference | undefined>;
  createReference(reference: InsertReference): Promise<Reference>;
  updateReference(id: number, reference: Partial<InsertReference>): Promise<Reference | undefined>;
  deleteReference(id: number): Promise<boolean>;
  
  // Search and filtering
  searchReferences(params: SearchParams): Promise<{ references: Reference[], total: number }>;
  
  // Tag operations
  getAllTags(): Promise<Tag[]>;
  createTag(name: string): Promise<Tag>;
  incrementTagCount(name: string): Promise<void>;
  
  // Bulk operations for scraping
  createReferences(references: InsertReference[]): Promise<Reference[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeTags();
  }

  private async initializeTags() {
    // Initialize with default tags
    const defaultTags = ['ミニマル', 'コーポレート', 'プロダクト', 'モダン', 'ポートフォリオ', 'クリエイティブ', 'コミュニティ', 'デザイン', 'SaaS', '決済', 'フィンテック', 'グラデーション'];
    
    for (const tagName of defaultTags) {
      try {
        await this.createTag(tagName);
      } catch (error) {
        // Tag might already exist, ignore error
      }
    }
  }

  async getReference(id: number): Promise<Reference | undefined> {
    const [reference] = await db.select().from(references).where(eq(references.id, id));
    return reference || undefined;
  }

  async createReference(insertReference: InsertReference & { userId?: number }): Promise<Reference> {
    // 既存URLチェック（正規化して比較、かつuserIdで分離）
    const normalizedUrl = normalizeUrl(insertReference.url);
    const whereClause = insertReference.userId != null
      ? and(eq(references.url, normalizedUrl), eq(references.userId, insertReference.userId as number))
      : eq(references.url, normalizedUrl);
    const existing = await db.select().from(references).where(whereClause);
    if (existing && existing.length > 0) {
      // 統合: タグ・説明・AI分析情報をマージ/更新
      const old = existing[0];
      const oldTags: string[] = Array.isArray(old.tags) ? Array.from(old.tags).map(String) : [];
      const newTags: string[] = Array.isArray(insertReference.tags) ? Array.from(insertReference.tags).map(String) : [];
      const mergedTags: string[] = Array.from(new Set([...oldTags, ...newTags]));
      const mergedDescription = insertReference.description || old.description;
      const mergedAI = insertReference.aiAnalyzed || old.aiAnalyzed;
      const mergedSource = insertReference.source || old.source;
      const mergedImageUrl = insertReference.imageUrl || old.imageUrl;
      const [updated] = await db
        .update(references)
        .set({
          title: insertReference.title || old.title,
          description: mergedDescription,
          tags: mergedTags as any,
          aiAnalyzed: mergedAI,
          source: mergedSource,
          imageUrl: mergedImageUrl,
        })
        .where(eq(references.id, old.id))
        .returning();
      return updated;
    }
    // 新規追加
    const [reference] = await db
      .insert(references)
      .values([{ ...insertReference, url: normalizedUrl, userId: insertReference.userId ?? undefined }])
      .returning();
    return reference;
  }

  async updateReference(id: number, updateData: Partial<InsertReference>): Promise<Reference | undefined> {
    const [reference] = await db
      .update(references)
      .set({...updateData})
      .where(eq(references.id, id))
      .returning();
    return reference || undefined;
  }

  async deleteReference(id: number): Promise<boolean> {
    const result = await db
      .delete(references)
      .where(eq(references.id, id));
    
    return (result as any).rowCount > 0;
  }

  async searchReferences(params: SearchParams & { userId?: number }): Promise<{ references: Reference[], total: number }> {
    try {
      // Build SQL conditions using raw PostgreSQL
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Build search conditions
      if (params.query) {
        const searchTerm = `%${params.query.toLowerCase()}%`;
        whereConditions.push(`(
          LOWER(title) LIKE $${paramIndex} OR 
          LOWER(description) LIKE $${paramIndex + 1} OR 
          EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(tags) AS tag
            WHERE LOWER(tag) LIKE $${paramIndex + 2}
          )
        )`);
        queryParams.push(searchTerm, searchTerm, searchTerm);
        paramIndex += 3;
      }
      
      // Filter by tags
      if (params.tags && params.tags.length > 0) {
        const tagConditions = params.tags.map(tag => {
          const condition = `tags::jsonb ? $${paramIndex}`;
          queryParams.push(tag);
          paramIndex++;
          return condition;
        });
        whereConditions.push(`(${tagConditions.join(' OR ')})`);
      }
      
      // Filter by source
      if (params.source) {
        whereConditions.push(`source = $${paramIndex}`);
        queryParams.push(params.source);
        paramIndex++;
      }

      // userId条件追加
      if (params.userId) {
        whereConditions.push(`userId = $${paramIndex}`);
        queryParams.push(params.userId);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM "references" ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results with proper column mapping
      const selectQuery = `
        SELECT 
          id, 
          title, 
          description, 
          url, 
          image_url as "imageUrl", 
          tags, 
          source, 
          ai_analyzed as "aiAnalyzed", 
          created_at as "createdAt"
        FROM "references" 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(params.limit, params.offset);
      
      const result = await pool.query(selectQuery, queryParams);

      return {
        references: result.rows,
        total
      };
    } catch (error) {
      console.error('Error searching references:', error);
      throw error;
    }
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(desc(tags.count));
  }

  async createTag(name: string): Promise<Tag> {
    try {
      const [tag] = await db
        .insert(tags)
        .values({ name, count: 0 })
        .returning();
      return tag;
    } catch (error) {
      // Tag might already exist, try to get it
      const [existingTag] = await db.select().from(tags).where(eq(tags.name, name));
      if (existingTag) {
        return existingTag;
      }
      throw error;
    }
  }

  async incrementTagCount(name: string): Promise<void> {
    await db
      .update(tags)
      .set({ count: sql`${tags.count} + 1` })
      .where(eq(tags.name, name));
  }

  async createReferences(insertReferences: (InsertReference & { userId?: number })[]): Promise<Reference[]> {
    // URL重複を統合（正規化して処理、userIdで分離）
    const results: Reference[] = [];
    for (const ref of insertReferences) {
      const created = await this.createReference({ ...ref, url: normalizeUrl(ref.url), userId: ref.userId ?? undefined });
      results.push(created);
    }
    return results;
  }
}

export const storage = new DatabaseStorage();
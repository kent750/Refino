import { references, tags, type Reference, type InsertReference, type Tag, type SearchParams } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, like, sql, desc } from "drizzle-orm";

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

  async createReference(insertReference: InsertReference): Promise<Reference> {
    const [reference] = await db
      .insert(references)
      .values([insertReference])
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

  async searchReferences(params: SearchParams): Promise<{ references: Reference[], total: number }> {
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

  async createReferences(insertReferences: InsertReference[]): Promise<Reference[]> {
    if (insertReferences.length === 0) return [];
    
    const createdReferences = await db
      .insert(references)
      .values(insertReferences)
      .returning();
    
    // Update tag counts
    const allTags = insertReferences.flatMap(ref => ref.tags || []);
    const uniqueTags = [...new Set(allTags)];
    
    for (const tagName of uniqueTags) {
      const tagCount = allTags.filter(t => t === tagName).length;
      try {
        await this.createTag(tagName);
        for (let i = 0; i < tagCount; i++) {
          await this.incrementTagCount(tagName);
        }
      } catch (error) {
        console.error(`Error updating tag count for ${tagName}:`, error);
      }
    }
    
    return createdReferences;
  }
}

export const storage = new DatabaseStorage();
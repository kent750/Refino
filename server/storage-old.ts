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
    // Initialize with common tags if they don't exist
    this.initializeTags();
  }

  private async initializeTags() {
    const commonTags = [
      "ミニマル", "グリッドレイアウト", "採用LP", "3D要素", "ダークモード",
      "E-commerce", "ポートフォリオ", "コーポレート", "SaaS", "モバイル",
      "クリエイティブ", "ファッション", "テック", "スタートアップ"
    ];
    
    try {
      for (const tagName of commonTags) {
        await this.createTag(tagName);
      }
    } catch (error) {
      // Tags may already exist, ignore errors
      console.log('Common tags already initialized');
    }
  }

  async getReference(id: number): Promise<Reference | undefined> {
    const [reference] = await db.select().from(references).where(eq(references.id, id));
    return reference || undefined;
  }

  async createReference(insertReference: InsertReference): Promise<Reference> {
    const [reference] = await db
      .insert(references)
      .values(insertReference)
      .returning();
    
    // Update tag counts
    if (reference.tags && Array.isArray(reference.tags)) {
      for (const tagName of reference.tags) {
        await this.incrementTagCount(tagName);
      }
    }
    
    return reference;
  }

  async updateReference(id: number, updateData: Partial<InsertReference>): Promise<Reference | undefined> {
    const [updated] = await db
      .update(references)
      .set(updateData)
      .where(eq(references.id, id))
      .returning();
    
    return updated || undefined;
  }

  async deleteReference(id: number): Promise<boolean> {
    const result = await db
      .delete(references)
      .where(eq(references.id, id));
    
    return result.rowCount > 0;
  }

  async searchReferences(params: SearchParams): Promise<{ references: Reference[], total: number }> {
    // Use raw SQL for better JSONB handling
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

    // Get paginated results
    const selectQuery = `
      SELECT id, title, description, url, image_url, tags, source, ai_analyzed, created_at, updated_at
      FROM "references" 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(params.limit, params.offset);
    
    const result = await pool.query(selectQuery, queryParams);

    // Convert snake_case to camelCase for frontend compatibility
    const references = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      imageUrl: row.image_url,
      tags: row.tags,
      source: row.source,
      aiAnalyzed: row.ai_analyzed,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return {
      references,
      total
    };
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(desc(tags.count));
  }

  async createTag(name: string): Promise<Tag> {
    try {
      const [tag] = await db
        .insert(tags)
        .values({ name })
        .returning();
      return tag;
    } catch (error) {
      // Tag might already exist, get it
      const [existing] = await db.select().from(tags).where(eq(tags.name, name));
      if (existing) return existing;
      throw error;
    }
  }

  async incrementTagCount(name: string): Promise<void> {
    try {
      await db
        .update(tags)
        .set({ count: sql`${tags.count} + 1` })
        .where(eq(tags.name, name));
    } catch (error) {
      // Tag might not exist, create it first
      await this.createTag(name);
      await this.incrementTagCount(name);
    }
  }

  async createReferences(insertReferences: InsertReference[]): Promise<Reference[]> {
    if (insertReferences.length === 0) return [];
    
    const created = await db
      .insert(references)
      .values(insertReferences)
      .returning();
    
    // Update tag counts for all references
    for (const reference of created) {
      if (reference.tags && Array.isArray(reference.tags)) {
        for (const tagName of reference.tags) {
          await this.incrementTagCount(tagName);
        }
      }
    }
    
    return created;
  }
}

export const storage = new DatabaseStorage();

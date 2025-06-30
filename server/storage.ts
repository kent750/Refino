import { references, tags, type Reference, type InsertReference, type Tag, type SearchParams } from "@shared/schema";
import { db } from "./db";
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
    const conditions = [];
    
    // Build search conditions
    if (params.query) {
      const searchTerm = `%${params.query.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${references.title})`, searchTerm),
          like(sql`LOWER(${references.description})`, searchTerm),
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(${references.tags}) AS tag
            WHERE LOWER(tag) LIKE ${searchTerm}
          )`
        )
      );
    }
    
    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      const tagConditions = params.tags.map(tag => 
        sql`${references.tags} ? ${tag}`
      );
      conditions.push(or(...tagConditions));
    }
    
    // Filter by source
    if (params.source) {
      conditions.push(eq(references.source, params.source));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(references)
      .where(whereClause);

    // Get paginated results
    const referenceResults = await db
      .select()
      .from(references)
      .where(whereClause)
      .orderBy(desc(references.createdAt))
      .limit(params.limit)
      .offset(params.offset);

    return { 
      references: referenceResults, 
      total: Number(count) 
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

import { references, tags, type Reference, type InsertReference, type Tag, type SearchParams } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private references: Map<number, Reference>;
  private tags: Map<string, Tag>;
  private currentReferenceId: number;
  private currentTagId: number;

  constructor() {
    this.references = new Map();
    this.tags = new Map();
    this.currentReferenceId = 1;
    this.currentTagId = 1;
    
    // Initialize with some common tags
    this.initializeTags();
  }

  private initializeTags() {
    const commonTags = [
      "ミニマル", "グリッドレイアウト", "採用LP", "3D要素", "ダークモード",
      "E-commerce", "ポートフォリオ", "コーポレート", "SaaS", "モバイル",
      "クリエイティブ", "ファッション", "テック", "スタートアップ"
    ];
    
    commonTags.forEach(tagName => {
      const tag: Tag = {
        id: this.currentTagId++,
        name: tagName,
        count: 0
      };
      this.tags.set(tagName, tag);
    });
  }

  async getReference(id: number): Promise<Reference | undefined> {
    return this.references.get(id);
  }

  async createReference(insertReference: InsertReference): Promise<Reference> {
    const id = this.currentReferenceId++;
    const reference: Reference = {
      ...insertReference,
      id,
      createdAt: new Date(),
    };
    
    this.references.set(id, reference);
    
    // Update tag counts
    reference.tags.forEach(tagName => {
      this.incrementTagCount(tagName);
    });
    
    return reference;
  }

  async updateReference(id: number, updateData: Partial<InsertReference>): Promise<Reference | undefined> {
    const existing = this.references.get(id);
    if (!existing) return undefined;
    
    const updated: Reference = {
      ...existing,
      ...updateData,
    };
    
    this.references.set(id, updated);
    return updated;
  }

  async deleteReference(id: number): Promise<boolean> {
    return this.references.delete(id);
  }

  async searchReferences(params: SearchParams): Promise<{ references: Reference[], total: number }> {
    let allReferences = Array.from(this.references.values());
    
    // Filter by query (search in title and description)
    if (params.query) {
      const query = params.query.toLowerCase();
      allReferences = allReferences.filter(ref => 
        ref.title.toLowerCase().includes(query) ||
        (ref.description && ref.description.toLowerCase().includes(query)) ||
        ref.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      allReferences = allReferences.filter(ref =>
        params.tags!.some(tag => ref.tags.includes(tag))
      );
    }
    
    // Filter by source
    if (params.source) {
      allReferences = allReferences.filter(ref => ref.source === params.source);
    }
    
    // Sort by creation date (newest first)
    allReferences.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = allReferences.length;
    const references = allReferences.slice(params.offset, params.offset + params.limit);
    
    return { references, total };
  }

  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values()).sort((a, b) => b.count - a.count);
  }

  async createTag(name: string): Promise<Tag> {
    const existing = this.tags.get(name);
    if (existing) return existing;
    
    const tag: Tag = {
      id: this.currentTagId++,
      name,
      count: 0
    };
    
    this.tags.set(name, tag);
    return tag;
  }

  async incrementTagCount(name: string): Promise<void> {
    let tag = this.tags.get(name);
    if (!tag) {
      tag = await this.createTag(name);
    }
    
    tag.count++;
    this.tags.set(name, tag);
  }

  async createReferences(insertReferences: InsertReference[]): Promise<Reference[]> {
    const created: Reference[] = [];
    
    for (const insertRef of insertReferences) {
      const reference = await this.createReference(insertRef);
      created.push(reference);
    }
    
    return created;
  }
}

export const storage = new MemStorage();

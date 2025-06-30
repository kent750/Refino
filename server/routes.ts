import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { aiAnalyzer } from "./services/aiAnalyzer";
import { searchSchema, insertReferenceSchema } from "@shared/schema";
import { z } from "zod";
import { db, users } from "./db";
import { hashPassword, comparePassword, signJwt, verifyJwt } from "./services/auth";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all references with search and filtering
  app.get("/api/references", requireAuth, async (req, res) => {
    try {
      const params = searchSchema.parse({
        query: req.query.query as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        source: req.query.source as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      });

      // Debug: log the parsed parameters
      console.log('Search params:', params);

      const result = await storage.searchReferences({ ...params, userId: (req as any).user.id });
      res.json(result);
    } catch (error) {
      console.error('Error searching references:', error);
      res.status(400).json({ 
        message: "Invalid search parameters",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get single reference by ID
  app.get("/api/references/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reference = await storage.getReference(id);
      
      if (reference?.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "権限がありません" });
      }
      
      if (!reference) {
        return res.status(404).json({ message: "Reference not found" });
      }
      
      res.json(reference);
    } catch (error) {
      console.error('Error getting reference:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new reference manually with AI analysis
  app.post("/api/references", requireAuth, async (req, res) => {
    try {
      // Remove old Zod validation line that was causing errors
      const { url, title, description, useAI = true } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Basic reference data
      let referenceData = {
        title: title || "新しいリファレンス",
        description: description || null,
        url,
        imageUrl: null,
        tags: [],
        source: "手動追加",
        aiAnalyzed: false,
        userId: (req as any).user.id,
      };

      // AI analysis if requested and available
      if (useAI) {
        try {
          const analysis = await aiAnalyzer.analyzeReference(referenceData);
          referenceData.tags = analysis.tags;
          referenceData.description = analysis.enhancedDescription || referenceData.description;
          referenceData.aiAnalyzed = true;
        } catch (aiError) {
          console.log('AI analysis failed, proceeding without enhanced analysis:', aiError.message);
          referenceData.tags = ["未分類"];
        }
      } else {
        // Manual entry without AI
        referenceData.tags = req.body.tags || ["未分類"];
      }

      const reference = await storage.createReference(referenceData);
      res.status(201).json(reference);
    } catch (error) {
      console.error('Error creating reference:', error);
      res.status(500).json({ message: "Failed to create reference", error: error.message });
    }
  });

  // Start automatic scraping and AI analysis
  app.post("/api/scrape", requireAuth, async (req, res) => {
    try {
      const { source, limit } = req.body;
      const limitPerSite = limit || 10;
      
      let scrapedReferences;
      
      if (source === 'all' || !source) {
        scrapedReferences = await scraper.scrapeAll(limitPerSite);
      } else if (source === 'landbook') {
        scrapedReferences = await scraper.scrapeLandBook(limitPerSite);
      } else if (source === 'muzli') {
        scrapedReferences = await scraper.scrapeMuzli(limitPerSite);
      } else if (source === 'awwwards') {
        scrapedReferences = await scraper.scrapeAwwwards(limitPerSite);
      } else {
        return res.status(400).json({ message: "Invalid source specified" });
      }

      if (scrapedReferences.length === 0) {
        return res.json({ 
          message: "No references found or scraping failed", 
          count: 0 
        });
      }

      // Analyze with AI and create references
      const analysisResults = await aiAnalyzer.batchAnalyzeReferences(scrapedReferences);
      
      const referencesToCreate = scrapedReferences.map((scraped, index) => {
        const analysis = analysisResults[index];
        return {
          title: scraped.title,
          description: analysis.enhancedDescription || scraped.description || '',
          url: scraped.url,
          imageUrl: scraped.imageUrl || '',
          source: scraped.source,
          tags: analysis.tags,
          aiAnalyzed: true,
          userId: (req as any).user.id,
        };
      });

      const createdReferences = await storage.createReferences(referencesToCreate);
      
      res.json({
        message: "Scraping and AI analysis completed successfully",
        count: createdReferences.length,
        references: createdReferences
      });
    } catch (error) {
      console.error('Error in scraping:', error);
      res.status(500).json({ 
        message: "Scraping failed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get all available tags
  app.get("/api/tags", requireAuth, async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error('Error getting tags:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete reference
  app.delete("/api/references/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reference = await storage.getReference(id);
      
      if (reference?.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "権限がありません" });
      }
      
      const success = await storage.deleteReference(id);
      
      if (!success) {
        return res.status(404).json({ message: "Reference not found" });
      }
      
      res.json({ message: "Reference deleted successfully" });
    } catch (error) {
      console.error("Error deleting reference:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Copy reference to clipboard (returns formatted text)
  app.post("/api/references/:id/copy", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reference = await storage.getReference(id);
      
      if (reference?.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "権限がありません" });
      }
      
      if (!reference) {
        return res.status(404).json({ message: "Reference not found" });
      }
      
      const clipboardText = `${reference.title}
${reference.description || ''}
URL: ${reference.url}
Tags: ${reference.tags.join(', ')}
Source: ${reference.source}`;
      
      res.json({ 
        text: clipboardText,
        reference 
      });
    } catch (error) {
      console.error('Error preparing clipboard content:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Trigger AI re-analysis for a specific reference
  app.post("/api/references/:id/analyze", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reference = await storage.getReference(id);
      
      if (reference?.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "権限がありません" });
      }
      
      if (!reference) {
        return res.status(404).json({ message: "Reference not found" });
      }
      
      const analysis = await aiAnalyzer.analyzeReference({
        title: reference.title,
        description: reference.description || '',
        url: reference.url,
        imageUrl: reference.imageUrl || '',
        source: reference.source
      });
      
      const updatedReference = await storage.updateReference(id, {
        tags: analysis.tags,
        description: analysis.enhancedDescription || reference.description,
        aiAnalyzed: true
      });
      
      res.json({
        message: "AI analysis completed",
        reference: updatedReference
      });
    } catch (error) {
      console.error('Error in AI analysis:', error);
      res.status(500).json({ 
        message: "AI analysis failed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // JWT認証ミドルウェア
  function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ message: '無効なトークンです' });
    }
    req.user = payload;
    next();
  }

  // サインアップ
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Signup attempt:', { email, password: '***' });
      
      if (!email || !password) {
        return res.status(400).json({ message: "メールアドレスとパスワードは必須です" });
      }
      
      // 既存ユーザー確認
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        return res.status(409).json({ message: "このメールアドレスは既に登録されています" });
      }
      
      const passwordHash = await hashPassword(password);
      const [user] = await db.insert(users).values({ 
        email, 
        passwordHash 
      }).returning();
      
      const token = signJwt({ id: user.id, email: user.email });
      res.status(201).json({ token, user: { id: user.id, email: user.email } });
    } catch (e) {
      console.error('Signup error:', e);
      res.status(500).json({ 
        message: "サインアップに失敗しました",
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }
  });

  // ログイン
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "メールアドレスとパスワードは必須です" });
      }
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length === 0) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが違います" });
      }
      const user = existing[0];
      const ok = await comparePassword(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが違います" });
      }
      const token = signJwt({ id: user.id, email: user.email });
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (e) {
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });

  // ログアウト（クライアント側でトークン破棄するだけなのでAPIはダミー）
  app.post("/api/logout", requireAuth, (req, res) => {
    res.json({ message: "ログアウトしました" });
  });

  const httpServer = createServer(app);
  return httpServer;
}

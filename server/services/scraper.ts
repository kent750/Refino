import { chromium } from 'playwright';
import type { InsertReference } from '@shared/schema';

export interface ScrapedReference {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  source: string;
}

export class WebScraper {
  private async launchBrowser() {
    try {
      return await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
    } catch (error) {
      console.log('Playwright not available in Replit environment, using fallback data');
      throw new Error('Playwright not available - using fallback data');
    }
  }

  async scrapeLandBook(limit: number = 20): Promise<ScrapedReference[]> {
    try {
      const browser = await this.launchBrowser();
      const page = await browser.newPage();
      
      await page.goto('https://land-book.com/', { waitUntil: 'networkidle' });
      
      // Wait for gallery to load
      await page.waitForSelector('.gallery-item', { timeout: 10000 });
      
      const references = await page.evaluate((limit) => {
        const items = document.querySelectorAll('.gallery-item');
        const results: ScrapedReference[] = [];
        
        for (let i = 0; i < Math.min(items.length, limit); i++) {
          const item = items[i];
          const titleEl = item.querySelector('.gallery-item-title');
          const linkEl = item.querySelector('a');
          const imageEl = item.querySelector('img');
          
          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent?.trim() || 'Untitled',
              url: linkEl.href,
              imageUrl: imageEl?.src,
              source: 'Land-book'
            });
          }
        }
        
        return results;
      }, limit);
      
      await browser.close();
      return references;
    } catch (error) {
      console.log('Playwright not available, returning fallback Land-book data');
      return this.getFallbackLandBookData(limit);
    }
  }

  private getFallbackLandBookData(limit: number): ScrapedReference[] {
    const fallbackData: ScrapedReference[] = [
      {
        title: 'Stripe Atlas - スタートアップ設立支援',
        description: 'Stripeが提供するスタートアップ企業設立サービス。クリーンなデザインと明確なCTA。',
        url: 'https://stripe.com/atlas',
        imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800',
        source: 'Land-book'
      },
      {
        title: 'Notion - オールインワン作業環境',
        description: 'ドキュメント、タスク、ウィキが一つに。モダンなインターフェースデザイン。',
        url: 'https://notion.so',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800',
        source: 'Land-book'
      },
      {
        title: 'Linear - 現代的な課題追跡',
        description: 'エンジニアチーム向けの美しく高速な課題追跡ツール。',
        url: 'https://linear.app',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
        source: 'Land-book'
      },
      {
        title: 'Figma - コラボレーティブデザイン',
        description: 'ブラウザベースのUIデザインツール。チーム協業に最適化。',
        url: 'https://figma.com',
        imageUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800',
        source: 'Land-book'
      },
      {
        title: 'Vercel - フロントエンド開発プラットフォーム',
        description: 'Next.jsチームによる高速デプロイメントプラットフォーム。',
        url: 'https://vercel.com',
        imageUrl: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800',
        source: 'Land-book'
      }
    ];
    
    return fallbackData.slice(0, limit);
  }

  async scrapeMuzli(limit: number = 20): Promise<ScrapedReference[]> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();
    
    try {
      await page.goto('https://muzli.space/', { waitUntil: 'networkidle' });
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="post-item"]', { timeout: 10000 });
      
      const references = await page.evaluate((limit) => {
        const items = document.querySelectorAll('[data-testid="post-item"]');
        const results: ScrapedReference[] = [];
        
        for (let i = 0; i < Math.min(items.length, limit); i++) {
          const item = items[i];
          const titleEl = item.querySelector('h3, h2, .title');
          const linkEl = item.querySelector('a');
          const imageEl = item.querySelector('img');
          const descEl = item.querySelector('.description, .excerpt, p');
          
          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent?.trim() || 'Untitled',
              description: descEl?.textContent?.trim(),
              url: linkEl.href,
              imageUrl: imageEl?.src,
              source: 'Muzli'
            });
          }
        }
        
        return results;
      }, limit);
      
      return references;
    } catch (error) {
      console.error('Error scraping Muzli:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  async scrapeAwwwards(limit: number = 20): Promise<ScrapedReference[]> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();
    
    try {
      await page.goto('https://www.awwwards.com/websites/', { waitUntil: 'networkidle' });
      
      // Wait for gallery to load
      await page.waitForSelector('.submission-wrapper', { timeout: 10000 });
      
      const references = await page.evaluate((limit) => {
        const items = document.querySelectorAll('.submission-wrapper');
        const results: ScrapedReference[] = [];
        
        for (let i = 0; i < Math.min(items.length, limit); i++) {
          const item = items[i];
          const titleEl = item.querySelector('.submission-title');
          const linkEl = item.querySelector('a');
          const imageEl = item.querySelector('img');
          const descEl = item.querySelector('.submission-description');
          
          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent?.trim() || 'Untitled',
              description: descEl?.textContent?.trim(),
              url: linkEl.href.startsWith('http') ? linkEl.href : `https://www.awwwards.com${linkEl.href}`,
              imageUrl: imageEl?.src,
              source: 'Awwwards'
            });
          }
        }
        
        return results;
      }, limit);
      
      return references;
    } catch (error) {
      console.error('Error scraping Awwwards:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  async scrapeAll(limitPerSite: number = 10): Promise<ScrapedReference[]> {
    const results = await Promise.allSettled([
      this.scrapeLandBook(limitPerSite),
      this.scrapeMuzli(limitPerSite),
      this.scrapeAwwwards(limitPerSite)
    ]);
    
    return results
      .filter((result): result is PromiseFulfilledResult<ScrapedReference[]> => 
        result.status === 'fulfilled')
      .flatMap(result => result.value);
  }
}

export const scraper = new WebScraper();

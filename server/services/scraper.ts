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
    return await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  }

  async scrapeLandBook(limit: number = 20): Promise<ScrapedReference[]> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();
    
    try {
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
      
      return references;
    } catch (error) {
      console.error('Error scraping Land-book:', error);
      return [];
    } finally {
      await browser.close();
    }
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

import OpenAI from "openai";
import type { ScrapedReference } from "./scraper";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AIAnalysisResult {
  tags: string[];
  enhancedDescription?: string;
  category?: string;
}

export class AIAnalyzer {
  async analyzeReference(reference: ScrapedReference): Promise<AIAnalysisResult> {
    try {
      // Analyze based on title, description, and potentially image
      const prompt = this.buildAnalysisPrompt(reference);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a design expert specializing in UI/UX analysis. Analyze web design references and provide relevant tags in Japanese. Focus on design patterns, visual elements, industry, and style characteristics."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        tags: Array.isArray(result.tags) ? result.tags : [],
        enhancedDescription: result.enhancedDescription,
        category: result.category
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      // Return fallback tags based on simple keyword matching
      return this.getFallbackTags(reference);
    }
  }

  async analyzeImageAndContent(reference: ScrapedReference, imageBase64?: string): Promise<AIAnalysisResult> {
    if (!imageBase64) {
      return this.analyzeReference(reference);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a design expert. Analyze this website design image and provide relevant tags in Japanese. Focus on visual elements, layout patterns, color schemes, typography, and design style. Respond with JSON containing 'tags' array, 'enhancedDescription', and 'category'."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Website Title: ${reference.title}\nDescription: ${reference.description || 'No description'}\nSource: ${reference.source}\n\nAnalyze this design and provide relevant Japanese tags:`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        tags: Array.isArray(result.tags) ? result.tags : [],
        enhancedDescription: result.enhancedDescription || reference.description,
        category: result.category
      };
    } catch (error) {
      console.error('Error in AI image analysis:', error);
      return this.getFallbackTags(reference);
    }
  }

  private buildAnalysisPrompt(reference: ScrapedReference): string {
    return `Analyze this web design reference and provide relevant tags in Japanese:

Title: ${reference.title}
Description: ${reference.description || 'No description provided'}
Source: ${reference.source}
URL: ${reference.url}

Please provide a JSON response with:
- "tags": array of relevant Japanese design tags (e.g., ["ミニマル", "コーポレート", "グリッドレイアウト"])
- "enhancedDescription": improved description if original is lacking
- "category": main category (e.g., "E-commerce", "ポートフォリオ", "SaaS")

Focus on:
- Design style (ミニマル, モダン, クリエイティブ, etc.)
- Layout patterns (グリッド, カード, フルスクリーン, etc.)
- Industry/purpose (コーポレート, E-commerce, ポートフォリオ, etc.)
- Visual elements (3D要素, アニメーション, ダークモード, etc.)
- Typography and color usage`;
  }

  private getFallbackTags(reference: ScrapedReference): AIAnalysisResult {
    const tags: string[] = [];
    const title = reference.title.toLowerCase();
    const description = (reference.description || '').toLowerCase();
    const content = `${title} ${description}`;

    // Simple keyword matching for fallback
    const keywordMap = {
      'ミニマル': ['minimal', 'clean', 'simple'],
      'モダン': ['modern', 'contemporary'],
      'E-commerce': ['shop', 'store', 'ecommerce', 'commerce'],
      'ポートフォリオ': ['portfolio', 'showcase'],
      'コーポレート': ['corporate', 'business', 'company'],
      'SaaS': ['saas', 'software', 'platform'],
      'クリエイティブ': ['creative', 'agency', 'design'],
      'ダークモード': ['dark', 'black'],
      'グリッドレイアウト': ['grid', 'gallery'],
      '3D要素': ['3d', 'three'],
    };

    Object.entries(keywordMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    });

    // Add source-based tags
    if (reference.source === 'Land-book') tags.push('ランディングページ');
    if (reference.source === 'Awwwards') tags.push('アワード受賞');

    return {
      tags: tags.length > 0 ? tags : ['ウェブデザイン'],
      enhancedDescription: reference.description,
    };
  }

  async batchAnalyzeReferences(references: ScrapedReference[]): Promise<AIAnalysisResult[]> {
    const results: AIAnalysisResult[] = [];
    
    // Process in smaller batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < references.length; i += batchSize) {
      const batch = references.slice(i, i + batchSize);
      const batchPromises = batch.map(ref => this.analyzeReference(ref));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < references.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
        // Add fallback results for failed batch
        results.push(...batch.map(ref => this.getFallbackTags(ref)));
      }
    }
    
    return results;
  }
}

export const aiAnalyzer = new AIAnalyzer();

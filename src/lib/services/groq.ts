import Groq from "groq-sdk";

export interface Product {
  title: string;
  price: string;
  rating?: number;
  reviews?: number;
  source?: string;
  snippet?: string;
}

export interface AIInsights {
  summary: string;
  bestChoice: string | { title: string; price: string; features?: string[] };
  pros: string[];
  cons: string[];
  recommendation: string;
  recommendations?: string[];
  comparison?: string | object;
}

export class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async analyzeProducts(
    products: Product[],
    query: string
  ): Promise<AIInsights> {
    console.log("[GroqService] Starting analysis...");

    if (!products || products.length === 0) {
      return {
        summary: "No products available for analysis",
        bestChoice: "",
        pros: [],
        cons: [],
        recommendation: "",
        recommendations: [],
        comparison: "",
      };
    }

    const simplifiedProducts = products.slice(0, 10).map(p => ({
      title: this.escapeJsonString(p.title),
      price: this.escapeJsonString(p.price),
      rating: p.rating,
      reviews: p.reviews,
      source: p.source,
    }));

    const prompt = `
Analyze these products for "${this.escapeJsonString(query)}"

Products:
${JSON.stringify(simplifiedProducts, null, 2)}

Return ONLY JSON in this exact format:
{
  "summary": "Brief overview of the products and key findings",
  "bestChoice": {
    "title": "Product title",
    "price": "Price with currency",
    "features": ["feature1", "feature2"]
  },
  "pros": ["advantage 1", "advantage 2", "advantage 3"],
  "cons": ["disadvantage 1", "disadvantage 2", "disadvantage 3"],
  "recommendation": "Final recommendation with actionable advice",
  "comparison": {
    "product1": {"title": "...", "price": "...", "rating": ...},
    "product2": {"title": "...", "price": "...", "rating": ...},
    "comparisonPoints": [{"feature": "...", "product1": "...", "product2": "..."}]
  }
}
`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: "You are a product research expert. Return ONLY valid JSON. No markdown, no code blocks, no extra text. Ensure all strings are properly escaped and contain no unescaped control characters (like newlines or tabs). Use \\n for newlines and \\t for tabs within strings.",
          },
          { role: "user", content: prompt },
        ],
      });

      let content = completion.choices[0]?.message?.content || "{}";
      console.log("[GroqService] Raw content received");

      // Clean and parse the JSON
      const parsed = this.safeJsonParse(content);
      console.log("[GroqService] Parsed AI insights:", parsed);

      return {
        summary: parsed.summary || `Here are the best ${query} products available.`,
        bestChoice: parsed.bestChoice || products[0]?.title || "No clear best choice",
        pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 5) : ["Quality products available", "Competitive pricing"],
        cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 5) : ["Limited stock", "Premium pricing"],
        recommendation: parsed.recommendation || "Compare prices across different retailers before purchasing.",
        recommendations: parsed.recommendations || ["Check warranty", "Read reviews", "Compare prices"],
        comparison: parsed.comparison || this.createFallbackComparison(products),
      };
    } catch (apiError: any) {
      console.error("Groq API Error:", apiError?.message);
      return this.createFallbackAnalysis(products, query);
    }
  }

  private safeJsonParse(content: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.log("[GroqService] Direct parse failed, attempting cleanup...");

      let cleaned = content;
      cleaned = cleaned.replace(/```json\s*/g, "");
      cleaned = cleaned.replace(/```\s*/g, "");

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
        if (match === '\n') return '\\n';
        if (match === '\r') return '\\r';
        if (match === '\t') return '\\t';
        return '';
      });

      cleaned = cleaned.replace(/("(?:(?:\\"|[^"])*?)")/gs, (match) => {
        if (match.match(/"[^"]*"\s*:/)) return match;
        return match.replace(/(?<!\\)"/g, '\\"');
      });

      try {
        return JSON.parse(cleaned);
      } catch (secondError) {
        console.error("[GroqService] Cleaned parse failed:", secondError);
        return this.extractFieldsWithRegex(cleaned);
      }
    }
  }

  private extractFieldsWithRegex(content: string): any {
    const result: any = {};

    const summaryMatch = content.match(/"summary"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (summaryMatch) {
      result.summary = this.unescapeString(summaryMatch[1]);
    }

    const bestChoiceMatch = content.match(/"bestChoice"\s*:\s*({[^}]+}|"[^"]*")/);
    if (bestChoiceMatch) {
      const bestChoiceStr = bestChoiceMatch[1];
      if (bestChoiceStr.startsWith('{')) {
        try {
          result.bestChoice = JSON.parse(bestChoiceStr);
        } catch {
          result.bestChoice = bestChoiceStr;
        }
      } else {
        result.bestChoice = this.unescapeString(bestChoiceStr.replace(/^"|"$/g, ''));
      }
    }

    const prosMatch = content.match(/"pros"\s*:\s*\[(.*?)\]/s);
    if (prosMatch) {
      try {
        result.pros = JSON.parse(`[${prosMatch[1]}]`);
      } catch {
        result.pros = [];
      }
    }

    const consMatch = content.match(/"cons"\s*:\s*\[(.*?)\]/s);
    if (consMatch) {
      try {
        result.cons = JSON.parse(`[${consMatch[1]}]`);
      } catch {
        result.cons = [];
      }
    }

    const recommendationMatch = content.match(/"recommendation"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (recommendationMatch) {
      result.recommendation = this.unescapeString(recommendationMatch[1]);
    }

    const comparisonMatch = content.match(/"comparison"\s*:\s*({[\s\S]*?})(?=,|\}|$)/);
    if (comparisonMatch) {
      try {
        result.comparison = JSON.parse(comparisonMatch[1]);
      } catch {
        result.comparison = comparisonMatch[1];
      }
    }

    return result;
  }

  private escapeJsonString(str: string): string {
    if (!str) return "";
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f');
  }

  private unescapeString(str: string): string {
    if (!str) return "";
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  private createFallbackAnalysis(products: Product[], query: string): AIInsights {
    const bestProduct = products[0];

    return {
      summary: `Found ${products.length} products for "${query}". ${bestProduct?.title} is a notable option.`,
      bestChoice: bestProduct?.title || "No products available",
      pros: [
        `${products.length} products available to choose from`,
        "Multiple sources and price points",
        "AI-powered product discovery"
      ],
      cons: [
        "Limited detailed specifications",
        "Manual review recommended for best choice"
      ],
      recommendation: `Compare the top products carefully. ${bestProduct?.title} at ${bestProduct?.price} is a good starting point for your search.`,
      recommendations: [
        "Check product specifications",
        "Read user reviews",
        "Compare prices across sources"
      ],
      comparison: this.createFallbackComparison(products),
    };
  }

  private createFallbackComparison(products: Product[]): object {
    if (products.length < 2) {
      return { message: "More products needed for comparison" };
    }

    const product1 = products[0];
    const product2 = products[1];

    return {
      product1: {
        title: product1.title,
        price: product1.price,
        rating: product1.rating || null
      },
      product2: {
        title: product2.title,
        price: product2.price,
        rating: product2.rating || null
      },
      comparisonPoints: [
        {
          feature: "Price",
          product1: product1.price,
          product2: product2.price
        },
        {
          feature: "Rating",
          product1: product1.rating || "N/A",
          product2: product2.rating || "N/A"
        },
        {
          feature: "Source",
          product1: product1.source || "N/A",
          product2: product2.source || "N/A"
        }
      ]
    };
  }
}
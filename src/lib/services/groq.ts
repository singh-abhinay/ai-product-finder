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
  bestChoice: string;
  pros: string[];
  cons: string[];
  recommendation: string;
  recommendations?: string[];
  comparison?: string;
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
      title: p.title,
      price: p.price,
      rating: p.rating,
      reviews: p.reviews,
      source: p.source,
    }));

    const prompt = `
Analyze these products for "${query}"

Products:
${JSON.stringify(simplifiedProducts, null, 2)}

Return ONLY JSON in this exact format:
{
  "summary": "Brief overview of the products and key findings",
  "bestChoice": "Which product is best and why (include price and features)",
  "pros": ["advantage 1", "advantage 2", "advantage 3"],
  "cons": ["disadvantage 1", "disadvantage 2", "disadvantage 3"],
  "recommendation": "Final recommendation with actionable advice",
  "comparison": "Compare the top 2 products in detail"
}
`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: "You are a product research expert. Return ONLY valid JSON. No markdown, no code blocks, no extra text.",
          },
          { role: "user", content: prompt },
        ],
      });

      let content = completion.choices[0]?.message?.content || "{}";
      content = content.replace(/```json|```/g, "").trim();

      try {
        const parsed = JSON.parse(content);
        console.log("[GroqService] Parsed AI insights:", parsed);
        return {
          summary: parsed.summary || `Here are the best ${query} products available.`,
          bestChoice: parsed.bestChoice || products[0]?.title || "No clear best choice",
          pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 5) : ["Quality products available", "Competitive pricing"],
          cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 5) : ["Limited stock", "Premium pricing"],
          recommendation: parsed.recommendation || "Compare prices across different retailers before purchasing.",
          recommendations: parsed.recommendations || ["Check warranty", "Read reviews", "Compare prices"],
          comparison: parsed.comparison || `${products[0]?.title} vs ${products[1]?.title || "other options"} - compare features.`,
        };
      } catch (parseError) {
        console.error("JSON parse failed:", parseError);
        
        return {
          summary: `Found ${products.length} products for "${query}"`,
          bestChoice: products[0]?.title || "",
          pros: ["Multiple options available", "Various price points"],
          cons: ["Manual comparison needed"],
          recommendation: "Review product details carefully before purchasing",
          recommendations: ["Check specifications", "Compare prices", "Read reviews"],
          comparison: `${products[0]?.title} (${products[0]?.price}) - good value option.`,
        };
      }
    } catch (apiError: any) {
      console.error("Groq API Error:", apiError?.message);
      
      return {
        summary: `Found ${products.length} products for "${query}"`,
        bestChoice: products[0]?.title || "",
        pros: ["Products available from trusted sources"],
        cons: ["Limited analysis available"],
        recommendation: "Please review product details manually",
        recommendations: ["Check specifications", "Compare prices"],
        comparison: "Manual comparison recommended",
      };
    }
  }
}
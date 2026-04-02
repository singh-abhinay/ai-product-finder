import { NextResponse } from "next/server";
import { SerpAPIService } from "@/lib/services/serpapi";
import { GroqService } from "@/lib/services/groq";
import { prisma } from "@/lib/prisma";
import countryToCurrency from "country-to-currency";

export async function POST(req: Request) {
  try {
    const { query, userId, country } = await req.json();

    console.log("Received search query:", query, "User ID:", userId, "Country:", country);

    if (!query) {
      return NextResponse.json(
        { message: "Query required" },
        { status: 400 }
      );
    }

    const normalizedCountry =
      country?.toLowerCase() ||
      req.headers.get("x-vercel-ip-country")?.toLowerCase() ||
      "us";

    const currency = countryToCurrency[normalizedCountry.toUpperCase()] || "USD";

    const existingSearch = await prisma.searchHistory.findFirst({
      where: {
        query,
        country: normalizedCountry,
      },
      include: {
        products: true,
        aiAnalysis: true,
      },
    });

    if (existingSearch) {
      console.log("Found Search ID:", existingSearch.id);

      return NextResponse.json({
        searchId: existingSearch.id,
        products: existingSearch.products,
        aiInsights: existingSearch.aiAnalysis,
        searchData: existingSearch,
        currency: existingSearch.currency,
      });
    }

    const serpapi = new SerpAPIService();
    const products = await serpapi.searchProducts(
      query,
      normalizedCountry,
      currency
    );

    if (!products.length) {
      return NextResponse.json(
        { message: "No products found" },
        { status: 404 }
      );
    }

    const groq = new GroqService();
    const aiInsights = await groq.analyzeProducts(products, query);

    const searchHistory = await prisma.searchHistory.create({
      data: {
        query,
        country: normalizedCountry,
        currency: currency,
        userId: userId || null,
        totalProducts: products.length,
        status: "COMPLETED",
      },
    });

    // Save products
    await prisma.product.createMany({
      data: products.map((p: any) => ({
        searchId: searchHistory.id,
        title: p.title || "Unknown Product",
        price:
          p.extracted_price ||
          parseFloat(p.price?.replace(/[^0-9.-]/g, "")) ||
          null,
        originalPrice: p.original_price
          ? parseFloat(p.original_price.replace(/[^0-9.-]/g, ""))
          : null,
        rating: p.rating || null,
        reviewsCount: p.reviews || null,
        imageUrl: p.thumbnail || p.serpapi_thumbnail || null,
        productUrl: p.link || p.product_link || null,
        source: p.source || "unknown",
        summary: p.snippet || null,
        pros: [],
        cons: [],
        sentimentScore: null,
      })),
    });

    // Save AI analysis with string conversion for objects
    await prisma.aIAnalysis.create({
      data: {
        searchId: searchHistory.id,
        summary:
          aiInsights.summary ||
          `Analysis of ${products.length} products for "${query}"`,
        bestPick: (() => {
          if (!aiInsights.bestChoice) return products[0]?.title || null;
          if (typeof aiInsights.bestChoice === 'string') return aiInsights.bestChoice;
          if (typeof aiInsights.bestChoice === 'object') {
            if (aiInsights.bestChoice.title) return aiInsights.bestChoice.title;
            return JSON.stringify(aiInsights.bestChoice);
          }
          return products[0]?.title || null;
        })(),
        pros: aiInsights.pros || [],
        cons: aiInsights.cons || [],
        priceAnalysis: (() => {
          if (!aiInsights.comparison) return null;
          if (typeof aiInsights.comparison === 'string') return aiInsights.comparison;
          if (typeof aiInsights.comparison === 'object') {
            return JSON.stringify(aiInsights.comparison);
          }
          return null;
        })(),
        buyingAdvice:
          aiInsights.recommendation ||
          (aiInsights.recommendations && aiInsights.recommendations.join("\n")) ||
          null,
        model: "llama-3.1-8b-instant",
        tokensUsed: 0,
        processingTime: null,
      },
    });

    const completeSearch = await prisma.searchHistory.findUnique({
      where: { id: searchHistory.id },
      include: {
        products: true,
        aiAnalysis: true,
      },
    });

    return NextResponse.json({
      products,
      aiInsights,
      searchId: searchHistory.id,
      searchData: completeSearch,
      currency,
    });

  } catch (error) {
    console.error("Search API error:", error);

    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
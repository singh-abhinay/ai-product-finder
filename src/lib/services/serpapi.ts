export interface Product {
  id?: string;
  title: string;
  price: string;
  extracted_price?: number;
  original_price?: number;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  serpapi_thumbnail?: string;
  link?: string;
  product_link?: string;
  source?: string;
  source_icon?: string;
  snippet?: string;
  delivery?: string;
  position?: number;
  imageUrl?: string;
  productUrl?: string;
}

export class SerpAPIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY || "";
  }

  async searchProducts(
    query: string,
    country: string = "us",
    currency: string = "USD"
  ): Promise<Product[]> {
    try {
      const gl = country?.toLowerCase() || "us";

      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google_shopping&api_key=${this.apiKey}&num=20&gl=${gl}&hl=en&currency=${currency}`
      );

      const data = await response.json();

      if (!data.shopping_results) {
        console.log("No shopping results found");
        return [];
      }

      console.log(`Found ${data.shopping_results.length} products`);

      return data.shopping_results.map((item: any, index: number) => ({
        position: item.position || index + 1,
        title: item.title || "Unknown Product",
        price: item.price || "Price not available",
        extracted_price: item.extracted_price || null,
        original_price: item.original_price || null,
        rating: item.rating || null,
        reviews: item.reviews || null,
        thumbnail: item.thumbnail || null,
        serpapi_thumbnail: item.serpapi_thumbnail || null,
        link: item.link || item.product_link || null,
        product_link: item.product_link || null,
        source: item.source || "Unknown",
        source_icon: item.source_icon || null,
        snippet: item.snippet || null,
        delivery: item.delivery || null,
      }));
    } catch (error) {
      console.error("SerpAPI error:", error);
      return [];
    }
  }
}
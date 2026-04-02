"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/common/ProductCard";
import ProductFilters from "@/components/common/ProductFilters";
import Pagination from "@/components/common/Pagination";
import Cookies from "js-cookie";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  title: string;
  price: number | null;
  originalPrice: number | null;
  imageUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  source: string | null;
  summary: string | null;
  currency: string;
  productUrl: string | null;
  viewedAt?: string;
}

interface Filters {
  search: string;
  category: string;
  price: string;
  sort: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  const itemsPerPage = 12;

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    price: searchParams.get("price") || "",
    sort: searchParams.get("sort") || "",
  });

  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.price) params.set("price", filters.price);
    if (filters.sort) params.set("sort", filters.sort);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    router.replace(newUrl, { scroll: false });
  }, [filters, currentPage, router]);

  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchWatchlist = useCallback(async () => {
    try {
      const response = await fetch("/api/watchlist", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlistIds(new Set(data.ids || []));
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      toast({
        title: "Error",
        description: "Failed to load watchlist",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
    fetchWatchlist();
  }, [fetchWatchlist]);

  const fetchProducts = async () => {
    try {
      const userInfoCookie = Cookies.get("userInfo");
      if (!userInfoCookie) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/products/allproduct");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAllProducts(data.data);
      } else {
        setError(data.message || "Failed to load products");
        toast({
          title: "Error",
          description: data.message || "Failed to load products",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load products";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = useCallback((productId: string, isNowWatchlisted: boolean) => {
    setWatchlistIds(prev => {
      const newSet = new Set(prev);
      if (isNowWatchlisted) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    try {
      const formatter = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
      });
      const parts = formatter.formatToParts(1);
      const symbol = parts.find(part => part.type === 'currency')?.value;
      return symbol || currencyCode;
    } catch {
      const symbols: Record<string, string> = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
        'CNY': '¥', 'INR': '₹', 'AUD': 'A$', 'CAD': 'C$',
        'CHF': 'CHF', 'SGD': 'S$', 'HKD': 'HK$', 'NZD': 'NZ$',
        'KRW': '₩', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R'
      };
      return symbols[currencyCode] || currencyCode;
    }
  }, []);

  const formatPrice = useCallback((price: number | null, currency: string): string => {
    if (!price) return "N/A";
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  }, [getCurrencySymbol]);

  const categories = useMemo(() => {
    const cats = new Set(
      allProducts
        .map(p => p.source || "Other")
        .filter(c => c !== "Other")
    );
    return Array.from(cats);
  }, [allProducts]);

  // Calculate price stats for dynamic ranges
  const priceStats = useMemo(() => {
    const validPrices = allProducts
      .map(p => p.price)
      .filter((price): price is number => price !== null && price > 0);

    if (validPrices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...validPrices),
      max: Math.max(...validPrices)
    };
  }, [allProducts]);

  // Dynamic price ranges based on actual product prices
  const dynamicPriceRanges = useMemo(() => {
    const { min, max } = priceStats;
    if (min === 0 && max === 0) return [];

    const ranges: { value: string; label: string; condition: (price: number) => boolean }[] = [];

    const formatPriceForLabel = (price: number) => {
      const symbol = getCurrencySymbol(allProducts[0]?.currency || "USD");
      if (price >= 1000000) return `${symbol}${(price / 1000000).toFixed(1)}M`;
      if (price >= 1000) return `${symbol}${(price / 1000).toFixed(0)}K`;
      return `${symbol}${Math.round(price)}`;
    };

    // Create dynamic ranges based on the price spread
    if (max <= 100) {
      ranges.push({
        value: "low",
        label: `Under ${formatPriceForLabel(max * 0.3)}`,
        condition: (price) => price < max * 0.3
      });
      ranges.push({
        value: "medium",
        label: `${formatPriceForLabel(max * 0.3)} - ${formatPriceForLabel(max * 0.7)}`,
        condition: (price) => price >= max * 0.3 && price <= max * 0.7
      });
      ranges.push({
        value: "high",
        label: `Over ${formatPriceForLabel(max * 0.7)}`,
        condition: (price) => price > max * 0.7
      });
    }
    else if (max <= 500) {
      ranges.push({
        value: "low",
        label: `Under ${formatPriceForLabel(max * 0.2)}`,
        condition: (price) => price < max * 0.2
      });
      ranges.push({
        value: "low-medium",
        label: `${formatPriceForLabel(max * 0.2)} - ${formatPriceForLabel(max * 0.5)}`,
        condition: (price) => price >= max * 0.2 && price <= max * 0.5
      });
      ranges.push({
        value: "medium-high",
        label: `${formatPriceForLabel(max * 0.5)} - ${formatPriceForLabel(max * 0.8)}`,
        condition: (price) => price >= max * 0.5 && price <= max * 0.8
      });
      ranges.push({
        value: "high",
        label: `Over ${formatPriceForLabel(max * 0.8)}`,
        condition: (price) => price > max * 0.8
      });
    }
    else {
      // For larger price ranges, create 4 equal segments
      const step = Math.ceil(max / 4);
      const thresholds = [step, step * 2, step * 3];

      ranges.push({
        value: "budget",
        label: `Under ${formatPriceForLabel(thresholds[0])}`,
        condition: (price) => price < thresholds[0]
      });
      ranges.push({
        value: "economy",
        label: `${formatPriceForLabel(thresholds[0])} - ${formatPriceForLabel(thresholds[1])}`,
        condition: (price) => price >= thresholds[0] && price < thresholds[1]
      });
      ranges.push({
        value: "standard",
        label: `${formatPriceForLabel(thresholds[1])} - ${formatPriceForLabel(thresholds[2])}`,
        condition: (price) => price >= thresholds[1] && price < thresholds[2]
      });
      ranges.push({
        value: "premium",
        label: `Over ${formatPriceForLabel(thresholds[2])}`,
        condition: (price) => price >= thresholds[2]
      });
    }

    return ranges;
  }, [priceStats, allProducts, getCurrencySymbol]);

  const filteredProducts = useMemo(() => {
    let data = [...allProducts];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      data = data.filter((p) =>
        p.title.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      data = data.filter((p) => p.source === filters.category);
    }

    // Dynamic price filtering
    if (filters.price && data.length > 0) {
      const selectedRange = dynamicPriceRanges.find(range => range.value === filters.price);
      if (selectedRange) {
        data = data.filter(p => {
          const price = p.price;
          if (price === null) return false;
          return selectedRange.condition(price);
        });
      }
    }

    // Sorting
    if (filters.sort === "lowToHigh") {
      data.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (filters.sort === "highToLow") {
      data.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (filters.sort === "rating") {
      data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sort === "newest") {
      data.sort((a, b) => {
        const dateA = a.viewedAt ? new Date(a.viewedAt).getTime() : 0;
        const dateB = b.viewedAt ? new Date(b.viewedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    return data;
  }, [allProducts, filters, dynamicPriceRanges]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      category: "",
      price: "",
      sort: "",
    });
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const primaryCurrency = allProducts[0]?.currency || "USD";

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Products
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {allProducts.length} total products • {filteredProducts.length} filtered
        </p>
      </div>

      <ProductFilters
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        products={allProducts}
        filteredProducts={filteredProducts}
        onClearFilters={handleClearFilters}
        dynamicPriceRanges={dynamicPriceRanges}
        primaryCurrency={primaryCurrency}
        getCurrencySymbol={getCurrencySymbol}
        formatPrice={formatPrice}
      />

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.title,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  image: product.imageUrl,
                  rating: product.rating,
                  reviewsCount: product.reviewsCount,
                  source: product.source,
                  summary: product.summary,
                  productUrl: product.productUrl,
                }}
                currencySymbol={getCurrencySymbol(product.currency)}
                formatPrice={(price) => formatPrice(price, product.currency)}
                watchlist={true}
                isWatchlisted={watchlistIds.has(product.id)}
                onWatchlistToggle={handleWatchlistToggle}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
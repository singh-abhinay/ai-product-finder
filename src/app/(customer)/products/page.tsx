"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/common/ProductCard";
import ProductFilters from "@/components/common/ProductFilters";
import Pagination from "@/components/common/Pagination";
import Cookies from "js-cookie";

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

  // State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 12;

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    price: searchParams.get("price") || "",
    sort: searchParams.get("sort") || "",
  });

  // Update URL when filters or page changes
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

  // Sync page from URL on mount and when URL changes
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
  }, [searchParams]);

  // Update URL when filters or page changes
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

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
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'symbol'
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

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = new Set(
      allProducts
        .map(p => p.source || "Other")
        .filter(c => c !== "Other")
    );
    return Array.from(cats);
  }, [allProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let data = [...allProducts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      data = data.filter((p) =>
        p.title.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      data = data.filter((p) => p.source === filters.category);
    }

    // Price filter
    if (filters.price && data.length > 0) {
      const validPrices = data
        .map(p => p.price)
        .filter((price): price is number => price !== null && price > 0);

      if (validPrices.length > 0) {
        const minPrice = Math.min(...validPrices);
        const maxPrice = Math.max(...validPrices);
        const priceRange = maxPrice - minPrice;

        if (filters.price === "low") {
          const threshold = validPrices.length >= 3
            ? minPrice + (priceRange / 3)
            : minPrice + (priceRange / 2);
          data = data.filter((p) => (p.price || 0) <= threshold);
        } else if (filters.price === "medium" && validPrices.length >= 3) {
          const lowThreshold = minPrice + (priceRange / 3);
          const highThreshold = minPrice + (priceRange / 3) * 2;
          data = data.filter((p) =>
            (p.price || 0) > lowThreshold && (p.price || 0) <= highThreshold
          );
        } else if (filters.price === "high") {
          const threshold = validPrices.length >= 3
            ? minPrice + (priceRange / 3) * 2
            : minPrice + (priceRange / 2);
          data = data.filter((p) => (p.price || 0) > threshold);
        }
      }
    }

    // Sort
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
  }, [allProducts, filters]);

  // Pagination
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

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-5">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

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
        onClearFilters={handleClearFilters}
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
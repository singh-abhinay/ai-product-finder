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

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

      const response = await fetch("/api/admin/products");

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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load products";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    try {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: "symbol",
      });
      const parts = formatter.formatToParts(1);
      return parts.find((part) => part.type === "currency")?.value || currencyCode;
    } catch {
      const symbols: Record<string, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        INR: "₹",
      };
      return symbols[currencyCode] || currencyCode;
    }
  }, []);

  const formatPrice = useCallback(
    (price: number | null, currency: string): string => {
      if (!price) return "N/A";
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${price.toLocaleString("en-US")}`;
    },
    [getCurrencySymbol]
  );

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        allProducts
          .map((p) => p.source || "Other")
          .filter((c) => c !== "Other")
      )
    );
  }, [allProducts]);

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

    if (filters.sort === "lowToHigh") {
      data.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (filters.sort === "highToLow") {
      data.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return data;
  }, [allProducts, filters]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
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
    return <div className="text-center py-20">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-5">{error}</div>;
  }

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Products</h1>

      <ProductFilters
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        products={allProducts}
        filteredProducts={filteredProducts}
        onClearFilters={handleClearFilters}
      />

      {filteredProducts.length === 0 ? (
        <div className="text-center py-10">
          No products found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                formatPrice={(price) =>
                  formatPrice(price, product.currency)
                }
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
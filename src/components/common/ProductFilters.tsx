"use client";

import React, { useMemo, useCallback, useState } from "react";
import { exportToCSV, exportToPDF, exportToJSON } from "@/lib/exportUtils";

interface Product {
  id?: string;
  name?: string;
  title?: string;
  price: number | null;
  originalPrice?: number | null;
  currency: string;
  rating?: number | null;
  reviewsCount?: number | null;
  source?: string | null;
  summary?: string | null;
  productUrl?: string | null;
}

interface Filters {
  search: string;
  category: string;
  price: string;
  sort: string;
}

interface ProductFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  categories: string[];
  products: Product[];
  filteredProducts?: Product[];
  onClearFilters: () => void;
  dynamicPriceRanges?: Array<{ value: string; label: string; condition: (price: number) => boolean }>;
  primaryCurrency?: string;
  getCurrencySymbol?: (currencyCode: string) => string;
  formatPrice?: (price: number | null, currency: string) => string;
}

export default function ProductFilters({
  filters,
  setFilters,
  categories,
  products,
  filteredProducts = products,
  onClearFilters,
  dynamicPriceRanges = [],
  primaryCurrency = "USD",
  getCurrencySymbol: externalGetCurrencySymbol,
  formatPrice: externalFormatPrice
}: ProductFiltersProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.category || filters.price || filters.sort;
  }, [filters]);

  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    if (externalGetCurrencySymbol) {
      return externalGetCurrencySymbol(currencyCode);
    }

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
  }, [externalGetCurrencySymbol]);

  const formatPrice = useCallback((price: number | null, currency: string): string => {
    if (externalFormatPrice) {
      return externalFormatPrice(price, currency);
    }

    if (!price) return "N/A";
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  }, [externalFormatPrice, getCurrencySymbol]);

  const currencySymbol = useMemo(() => getCurrencySymbol(primaryCurrency), [getCurrencySymbol, primaryCurrency]);

  const sortOptions = useMemo(() => {
    const options = [
      { value: "lowToHigh", label: "Price: Low to High" },
      { value: "highToLow", label: "Price: High to Low" }
    ];

    const hasRatings = products.some(p => p.rating !== null && p.rating > 0);
    if (hasRatings) {
      options.push({ value: "rating", label: "Rating: High to Low" });
    }

    const hasDates = products.some(p => p.summary !== null);
    if (hasDates) {
      options.push({ value: "newest", label: "Newest First" });
    }

    return options;
  }, [products]);

  const handleFilterChange = useCallback((
    key: keyof Filters,
    value: string
  ) => {
    setFilters({ ...filters, [key]: value });
  }, [filters, setFilters]);

  const handleExport = async (format: "csv" | "pdf" | "json") => {
    if (filteredProducts.length === 0) {
      alert("No products to export");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportOptions = {
        products: filteredProducts,
        filters: hasActiveFilters ? filters : undefined,
        currencySymbol,
        onProgress: setExportProgress
      };

      switch (format) {
        case "csv":
          await exportToCSV(exportOptions);
          break;
        case "pdf":
          await exportToPDF(exportOptions);
          break;
        case "json":
          await exportToJSON(exportOptions);
          break;
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setShowExportMenu(false);
    }
  };

  const getPriceRangeLabel = useCallback((value: string) => {
    const range = dynamicPriceRanges.find(r => r.value === value);
    return range?.label || "";
  }, [dynamicPriceRanges]);

  return (
    <div className="p-4 mb-5 bg-white border rounded-2xl dark:bg-gray-dark dark:border-gray-800">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {/* Search */}
        <input
          type="text"
          placeholder="Search product..."
          aria-label="Search products"
          className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />

        {/* Category */}
        <select
          aria-label="Filter by category"
          className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Price Range - Dynamic based on products */}
        <select
          aria-label="Filter by price range"
          className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          value={filters.price}
          onChange={(e) => handleFilterChange("price", e.target.value)}
        >
          <option value="">All Prices ({currencySymbol})</option>
          {dynamicPriceRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          aria-label="Sort products"
          className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          value={filters.sort}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
        >
          <option value="">Sort by</option>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="w-full px-3 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {Math.round(exportProgress)}%
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </>
            )}
          </button>

          {showExportMenu && !isExporting && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
              <button
                onClick={() => handleExport("csv")}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                📊 Export as CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                📄 Export as PDF
              </button>
              <button
                onClick={() => handleExport("json")}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                🔧 Export as JSON
              </button>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            aria-label="Clear all filters"
            className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
          >
            Clear Filters ✕
          </button>
        )}
      </div>

      {/* Export Info */}
      {filteredProducts.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-right">
          {filteredProducts.length} products ready for export
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t dark:border-gray-700">
          <span className="text-xs text-gray-500">Active filters:</span>
          {filters.search && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
              Search: {filters.search}
            </span>
          )}
          {filters.category && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
              Category: {filters.category}
            </span>
          )}
          {filters.price && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
              Price: {getPriceRangeLabel(filters.price)}
            </span>
          )}
          {filters.sort === "lowToHigh" && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
              Sort: Price Low to High
            </span>
          )}
          {filters.sort === "highToLow" && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
              Sort: Price High to Low
            </span>
          )}
          {filters.sort === "rating" && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
              Sort: Top Rated
            </span>
          )}
          {filters.sort === "newest" && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
              Sort: Newest First
            </span>
          )}
        </div>
      )}

      {/* Currency Info */}
      {products.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 text-right">
          All prices shown in {primaryCurrency} ({currencySymbol})
        </div>
      )}
    </div>
  );
}
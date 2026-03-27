"use client";

import React, { useMemo, useCallback } from "react";

interface Product {
  price: number | null;
  currency: string;
  rating?: number | null;
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
  onClearFilters: () => void;
}

export default function ProductFilters({
  filters,
  setFilters,
  categories,
  products,
  onClearFilters
}: ProductFiltersProps) {
  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.category || filters.price || filters.sort;
  }, [filters]);

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

  const primaryCurrency = useMemo(() => {
    const currencies = products.map(p => p.currency).filter(Boolean);
    if (currencies.length === 0) return "USD";

    const currencyCount = currencies.reduce<Record<string, number>>((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(currencyCount).reduce((a, b) =>
      currencyCount[a] > currencyCount[b] ? a : b
    );
  }, [products]);

  const currencySymbol = useMemo(() => getCurrencySymbol(primaryCurrency), [getCurrencySymbol, primaryCurrency]);

  const priceRanges = useMemo(() => {
    const validPrices = products
      .map(p => p.price)
      .filter((price): price is number => price !== null && price > 0);

    if (validPrices.length === 0) {
      return [
        { value: "low", label: "Low Price", min: 0, max: 50000 },
        { value: "medium", label: "Medium Price", min: 50000, max: 100000 },
        { value: "high", label: "High Price", min: 100000, max: Infinity }
      ];
    }

    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);
    const priceRange = maxPrice - minPrice;

    const formatPrice = (price: number) => {
      if (price >= 1000000) return `${currencySymbol}${(price / 1000000).toFixed(1)}M`;
      if (price >= 1000) return `${currencySymbol}${(price / 1000).toFixed(0)}K`;
      return `${currencySymbol}${Math.round(price)}`;
    };

    const ranges = [];

    if (validPrices.length >= 3) {
      const segment = priceRange / 3;
      ranges.push({
        value: "low",
        label: `${formatPrice(minPrice)} - ${formatPrice(minPrice + segment)}`,
        min: minPrice,
        max: minPrice + segment
      });
      ranges.push({
        value: "medium",
        label: `${formatPrice(minPrice + segment)} - ${formatPrice(minPrice + (segment * 2))}`,
        min: minPrice + segment,
        max: minPrice + (segment * 2)
      });
      ranges.push({
        value: "high",
        label: `Above ${formatPrice(minPrice + (segment * 2))}`,
        min: minPrice + (segment * 2),
        max: Infinity
      });
    } else {
      const midPoint = minPrice + (priceRange / 2);
      ranges.push({
        value: "low",
        label: `${formatPrice(minPrice)} - ${formatPrice(midPoint)}`,
        min: minPrice,
        max: midPoint
      });
      ranges.push({
        value: "high",
        label: `Above ${formatPrice(midPoint)}`,
        min: midPoint,
        max: Infinity
      });
    }

    return ranges;
  }, [products, currencySymbol]);

  const getPriceRangeLabel = useCallback((value: string) => {
    const range = priceRanges.find(r => r.value === value);
    return range?.label || "";
  }, [priceRanges]);

  const sortOptions = useMemo(() => {
    const options = [
      { value: "lowToHigh", label: "Price: Low to High" },
      { value: "highToLow", label: "Price: High to Low" }
    ];

    const hasRatings = products.some(p => p.rating !== null && p.rating > 0);
    if (hasRatings) {
      options.push({ value: "rating", label: "Rating: High to Low" });
    }

    return options;
  }, [products]);

  const handleFilterChange = useCallback((
    key: keyof Filters,
    value: string
  ) => {
    setFilters({ ...filters, [key]: value });
  }, [filters, setFilters]);

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

        {/* Price Range */}
        <select
          aria-label="Filter by price range"
          className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          value={filters.price}
          onChange={(e) => handleFilterChange("price", e.target.value)}
        >
          <option value="">All Prices ({currencySymbol})</option>
          {priceRanges.map((range) => (
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
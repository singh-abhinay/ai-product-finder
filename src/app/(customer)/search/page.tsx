"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Cookies from "js-cookie";

interface Product {
    id: string;
    title: string;
    price: string | number;
    currency?: string;
    thumbnail?: string;
    imageUrl?: string;
    link?: string;
    source?: string;
    productUrl?: string;
    rating?: number | null;
    reviewsCount?: number | null;
    originalPrice?: string | number | null;
}

interface AIInsights {
    summary: string;
    bestChoice: string | {
        title: string;
        price: string;
        features?: string[];
    };
    pros: string[];
    cons: string[];
    recommendations?: string[];
}

interface UserInfo {
    id?: string;
    email?: string;
    name?: string;
    fname?: string;
    lname?: string;
    role?: "ADMIN" | "CUSTOMER" | "SUPPORT";
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface Filters {
    search: string;
    source: string;
    priceRange: string;
    minPrice: number | null;
    maxPrice: number | null;
    sortBy: string;
    minRating: number | null;
}

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [currency, setCurrency] = useState<string>("USD");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        search: "",
        source: "",
        priceRange: "all",
        minPrice: null,
        maxPrice: null,
        sortBy: "relevance",
        minRating: null,
    });

    // Helper function to extract numeric price from various formats
    const extractNumericPrice = (price: string | number | null | undefined): number | null => {
        if (price === null || price === undefined) return null;

        if (typeof price === 'number') {
            return isNaN(price) ? null : price;
        }

        if (typeof price === 'string') {
            const cleaned = price.replace(/[^0-9.-]/g, '');
            const numeric = parseFloat(cleaned);
            return isNaN(numeric) ? null : numeric;
        }

        return null;
    };

    // Helper function to safely render bestChoice
    const renderBestChoice = (bestChoice: string | object | undefined): string => {
        if (!bestChoice) return "No best choice available";

        if (typeof bestChoice === 'string') {
            return bestChoice;
        }

        if (typeof bestChoice === 'object') {
            if ('title' in bestChoice && bestChoice.title) {
                return bestChoice.title as string;
            }
            return JSON.stringify(bestChoice);
        }

        return String(bestChoice);
    };

    // Move getCurrencySymbol before it's used
    const getCurrencySymbol = (currencyCode: string): string => {
        try {
            const parts = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                currencyDisplay: 'symbol'
            }).formatToParts(1);
            const symbol = parts.find(part => part.type === 'currency')?.value;
            return symbol || currencyCode;
        } catch {
            const fallbackSymbols: { [key: string]: string } = {
                'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
                'CNY': '¥', 'INR': '₹', 'AUD': 'A$', 'CAD': 'C$',
                'CHF': 'CHF', 'SGD': 'S$', 'HKD': 'HK$', 'NZD': 'NZ$',
                'KRW': '₩', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R'
            };
            return fallbackSymbols[currencyCode] || currencyCode;
        }
    };

    // Format price function
    const formatPrice = (price: string | number | null | undefined, currencyCode: string): string => {
        const numericPrice = extractNumericPrice(price);
        if (numericPrice === null) return "N/A";

        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(numericPrice);
        } catch (error) {
            return `${currencyCode} ${numericPrice}`;
        }
    };

    useEffect(() => {
        const userInfoCookie = Cookies.get("userInfo");
        if (userInfoCookie) {
            try {
                const parsed = JSON.parse(userInfoCookie);
                setUserInfo(parsed);
                console.log("User info loaded:", parsed);
            } catch (error) {
                console.error("Failed to parse userInfo cookie:", error);
            }
        }
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setProducts([]);
        setAiInsights(null);
        setError(null);
        const userId = userInfo?.id || null;
        const country = userInfo?.country || null;

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    userId: userId,
                    country: country
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Search failed");
            }

            setProducts(data.products || []);
            setAiInsights(data.aiInsights);
            setCurrency(data.currency || "USD");
            setFilters({
                search: "",
                source: "",
                priceRange: "all",
                minPrice: null,
                maxPrice: null,
                sortBy: "relevance",
                minRating: null,
            });
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to search products");
        } finally {
            setLoading(false);
        }
    };

    const availableSources = useMemo(() => {
        const sources = new Set(products.map(p => p.source).filter(Boolean));
        return Array.from(sources);
    }, [products]);

    const priceStats = useMemo(() => {
        const validPrices = products
            .map(p => extractNumericPrice(p.price))
            .filter((p): p is number => p !== null && p > 0);

        if (validPrices.length === 0) return { min: 0, max: 0 };
        return {
            min: Math.min(...validPrices),
            max: Math.max(...validPrices)
        };
    }, [products]);

    // Dynamic price range options based on actual product prices
    const dynamicPriceRanges = useMemo(() => {
        const { min, max } = priceStats;
        if (min === 0 && max === 0) return [];

        const ranges = [];

        // Helper to create a range option
        const addRange = (label: string, value: string, condition: (price: number) => boolean) => {
            ranges.push({ label, value, condition });
        };

        // Create dynamic ranges based on the price spread
        if (max <= 100) {
            addRange(`Under ${getCurrencySymbol(currency)}${Math.ceil(max * 0.3)}`, "low", (price) => price < max * 0.3);
            addRange(`${getCurrencySymbol(currency)}${Math.ceil(max * 0.3)} - ${getCurrencySymbol(currency)}${Math.ceil(max * 0.7)}`, "medium", (price) => price >= max * 0.3 && price <= max * 0.7);
            addRange(`Over ${getCurrencySymbol(currency)}${Math.ceil(max * 0.7)}`, "high", (price) => price > max * 0.7);
        }
        else if (max <= 500) {
            addRange(`Under ${getCurrencySymbol(currency)}${Math.ceil(max * 0.2)}`, "low", (price) => price < max * 0.2);
            addRange(`${getCurrencySymbol(currency)}${Math.ceil(max * 0.2)} - ${getCurrencySymbol(currency)}${Math.ceil(max * 0.5)}`, "low-medium", (price) => price >= max * 0.2 && price <= max * 0.5);
            addRange(`${getCurrencySymbol(currency)}${Math.ceil(max * 0.5)} - ${getCurrencySymbol(currency)}${Math.ceil(max * 0.8)}`, "medium-high", (price) => price >= max * 0.5 && price <= max * 0.8);
            addRange(`Over ${getCurrencySymbol(currency)}${Math.ceil(max * 0.8)}`, "high", (price) => price > max * 0.8);
        }
        else {
            // For larger price ranges, create more granular options
            const step = Math.ceil(max / 4);
            const thresholds = [step, step * 2, step * 3];

            addRange(`Under ${getCurrencySymbol(currency)}${thresholds[0]}`, "budget", (price) => price < thresholds[0]);
            addRange(`${getCurrencySymbol(currency)}${thresholds[0]} - ${getCurrencySymbol(currency)}${thresholds[1]}`, "economy", (price) => price >= thresholds[0] && price < thresholds[1]);
            addRange(`${getCurrencySymbol(currency)}${thresholds[1]} - ${getCurrencySymbol(currency)}${thresholds[2]}`, "standard", (price) => price >= thresholds[1] && price < thresholds[2]);
            addRange(`Over ${getCurrencySymbol(currency)}${thresholds[2]}`, "premium", (price) => price >= thresholds[2]);
        }

        return ranges;
    }, [priceStats, currency]);

    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchLower)
            );
        }

        if (filters.source) {
            filtered = filtered.filter(p => p.source === filters.source);
        }

        if (filters.priceRange !== "all") {
            const selectedRange = dynamicPriceRanges.find(range => range.value === filters.priceRange);
            if (selectedRange) {
                filtered = filtered.filter(p => {
                    const numericPrice = extractNumericPrice(p.price);
                    if (numericPrice === null) return false;
                    return selectedRange.condition(numericPrice);
                });
            }
        }

        if (filters.minRating) {
            filtered = filtered.filter(p =>
                p.rating && p.rating >= filters.minRating
            );
        }

        if (filters.sortBy !== "relevance") {
            filtered.sort((a, b) => {
                switch (filters.sortBy) {
                    case "price_low": {
                        const priceA = extractNumericPrice(a.price) || Infinity;
                        const priceB = extractNumericPrice(b.price) || Infinity;
                        return priceA - priceB;
                    }
                    case "price_high": {
                        const priceA = extractNumericPrice(a.price) || 0;
                        const priceB = extractNumericPrice(b.price) || 0;
                        return priceB - priceA;
                    }
                    case "rating": {
                        const ratingA = a.rating || 0;
                        const ratingB = b.rating || 0;
                        return ratingB - ratingA;
                    }
                    case "reviews": {
                        const reviewsA = a.reviewsCount || 0;
                        const reviewsB = b.reviewsCount || 0;
                        return reviewsB - reviewsA;
                    }
                    default:
                        return 0;
                }
            });
        }

        return filtered;
    }, [products, filters, dynamicPriceRanges]);

    const exportData = useCallback((format: 'json' | 'csv') => {
        const exportProducts = filteredProducts.map(p => ({
            title: p.title,
            price: formatPrice(p.price, currency),
            originalPrice: p.originalPrice ? formatPrice(p.originalPrice, currency) : 'N/A',
            rating: p.rating || 'N/A',
            reviews: p.reviewsCount || 'N/A',
            source: p.source || 'N/A',
            url: p.productUrl || p.link || 'N/A'
        }));

        if (format === 'json') {
            const dataStr = JSON.stringify(exportProducts, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `search_results_${query}_${new Date().toISOString()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } else if (format === 'csv') {
            const headers = ['Title', 'Price', 'Original Price', 'Rating', 'Reviews', 'Source', 'URL'];
            const csvRows = [headers];

            exportProducts.forEach(p => {
                const row = [
                    `"${p.title.replace(/"/g, '""')}"`,
                    p.price,
                    p.originalPrice,
                    p.rating,
                    p.reviews,
                    p.source,
                    p.url
                ];
                csvRows.push(row.join(','));
            });

            const csvStr = csvRows.join('\n');
            const blob = new Blob([csvStr], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `search_results_${query}_${new Date().toISOString()}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        }
    }, [filteredProducts, currency, query]);

    const resetFilters = () => {
        setFilters({
            search: "",
            source: "",
            priceRange: "all",
            minPrice: null,
            maxPrice: null,
            sortBy: "relevance",
            minRating: null,
        });
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">AI Product Search</h1>

            <div className="flex gap-2 mb-6">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="border p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search products... (e.g., laptop, iPhone, headphones)"
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            {!loading && products.length > 0 && (
                <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-2">
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            📊 {products.length} products found
                        </div>
                        {filteredProducts.length !== products.length && (
                            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                🔍 {filteredProducts.length} filtered
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <span>🔧</span>
                            {showFilters ? "Hide Filters" : "Show Filters"}
                        </button>
                        <div className="relative group">
                            <button className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                <span>📥</span>
                                Export
                            </button>
                            <div className="absolute right-0 mt-1 hidden group-hover:block bg-white border rounded-lg shadow-lg z-10 min-w-[150px]">
                                <button
                                    onClick={() => exportData('json')}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    Export as JSON
                                </button>
                                <button
                                    onClick={() => exportData('csv')}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    Export as CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showFilters && !loading && products.length > 0 && (
                <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Filters</h3>
                        <button onClick={resetFilters} className="text-sm text-red-600 hover:text-red-700">
                            Reset All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Search in Results</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Filter by title..."
                                className="w-full border rounded-lg px-3 py-1 text-sm"
                            />
                        </div>

                        {availableSources.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Source</label>
                                <select
                                    value={filters.source}
                                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-1 text-sm"
                                >
                                    <option value="">All Sources</option>
                                    {availableSources.map(source => (
                                        <option key={source} value={source}>{source}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Price Range</label>
                            <select
                                value={filters.priceRange}
                                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                                className="w-full border rounded-lg px-3 py-1 text-sm"
                            >
                                <option value="all">All Prices</option>
                                {dynamicPriceRanges.map(range => (
                                    <option key={range.value} value={range.value}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Minimum Rating</label>
                            <select
                                value={filters.minRating || ""}
                                onChange={(e) => setFilters({ ...filters, minRating: e.target.value ? parseFloat(e.target.value) : null })}
                                className="w-full border rounded-lg px-3 py-1 text-sm"
                            >
                                <option value="">Any Rating</option>
                                <option value="4.5">4.5★ & above</option>
                                <option value="4">4★ & above</option>
                                <option value="3.5">3.5★ & above</option>
                                <option value="3">3★ & above</option>
                                <option value="2">2★ & above</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Sort By</label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                className="w-full border rounded-lg px-3 py-1 text-sm"
                            >
                                <option value="relevance">Relevance</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                                <option value="reviews">Most Reviews</option>
                            </select>
                        </div>

                        {priceStats.min > 0 && priceStats.max > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                                Price range: {formatPrice(priceStats.min, currency)} - {formatPrice(priceStats.max, currency)}
                            </div>
                        )}
                    </div>

                    {(filters.search || filters.source || filters.priceRange !== "all" || filters.minRating || filters.sortBy !== "relevance") && (
                        <div className="mt-4 pt-3 border-t">
                            <div className="text-sm text-gray-600 mb-2">Active Filters:</div>
                            <div className="flex flex-wrap gap-2">
                                {filters.search && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                        Search: {filters.search}
                                        <button onClick={() => setFilters({ ...filters, search: "" })} className="hover:text-blue-900">×</button>
                                    </span>
                                )}
                                {filters.source && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                        Source: {filters.source}
                                        <button onClick={() => setFilters({ ...filters, source: "" })} className="hover:text-green-900">×</button>
                                    </span>
                                )}
                                {filters.priceRange !== "all" && dynamicPriceRanges.find(r => r.value === filters.priceRange) && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                        Price: {dynamicPriceRanges.find(r => r.value === filters.priceRange)?.label}
                                        <button onClick={() => setFilters({ ...filters, priceRange: "all" })} className="hover:text-purple-900">×</button>
                                    </span>
                                )}
                                {filters.minRating && (
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                        Rating: {filters.minRating}★+
                                        <button onClick={() => setFilters({ ...filters, minRating: null })} className="hover:text-yellow-900">×</button>
                                    </span>
                                )}
                                {filters.sortBy !== "relevance" && (
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                        Sort: {filters.sortBy === "price_low" ? "Price ↑" : filters.sortBy === "price_high" ? "Price ↓" : filters.sortBy === "rating" ? "Rating ↓" : "Reviews ↓"}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!loading && products.length > 0 && (
                <div className="mb-4 text-right">
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                        💱 Currency: {currency} ({getCurrencySymbol(currency)})
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            )}

            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* AI Insights - Without Comparison */}
            {aiInsights && !loading && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">🤖 AI Insights</h2>

                    <div className="mb-4">
                        <p className="text-gray-700">{aiInsights.summary}</p>
                    </div>

                    <div className="mb-4">
                        <p className="font-semibold">🏆 Best Choice:</p>
                        <p className="text-gray-700">{renderBestChoice(aiInsights.bestChoice)}</p>
                        {typeof aiInsights.bestChoice === 'object' && aiInsights.bestChoice.price && (
                            <p className="text-sm text-gray-600 mt-1">Price: {aiInsights.bestChoice.price}</p>
                        )}
                    </div>

                    {aiInsights.pros && aiInsights.pros.length > 0 && (
                        <div className="mb-4">
                            <p className="font-semibold text-green-700">✅ Pros:</p>
                            <ul className="list-disc list-inside text-gray-700">
                                {aiInsights.pros.map((p: string, i: number) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {aiInsights.cons && aiInsights.cons.length > 0 && (
                        <div className="mb-4">
                            <p className="font-semibold text-red-700">❌ Cons:</p>
                            <ul className="list-disc list-inside text-gray-700">
                                {aiInsights.cons.map((c: string, i: number) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                        <div className="mb-4">
                            <p className="font-semibold">💡 Recommendations:</p>
                            <ul className="list-disc list-inside text-gray-700">
                                {aiInsights.recommendations.map((r: string, i: number) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Products Grid */}
            {!loading && filteredProducts.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            Products ({filteredProducts.length})
                        </h2>
                        {filteredProducts.length !== products.length && (
                            <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-700">
                                Clear Filters
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product, index) => (
                            <div key={product.id || index} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                                {(product.thumbnail || product.imageUrl) && (
                                    <div className="relative h-48 w-full bg-gray-100">
                                        <Image
                                            src={product.thumbnail ?? product.imageUrl ?? ''}
                                            alt={product.title}
                                            fill
                                            className="object-contain p-2"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-image.jpg';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                                    {product.price && (
                                        <div className="mb-2">
                                            <p className="text-xl font-bold text-blue-600">{formatPrice(product.price, currency)}</p>
                                            {product.originalPrice && (
                                                <p className="text-sm text-gray-500 line-through">Was: {formatPrice(product.originalPrice, currency)}</p>
                                            )}
                                        </div>
                                    )}
                                    {product.rating && (
                                        <div className="flex items-center gap-1 mb-2">
                                            <span className="text-yellow-500">★</span>
                                            <span className="text-sm font-medium">{product.rating}</span>
                                            {product.reviewsCount && (
                                                <span className="text-xs text-gray-500">({product.reviewsCount} reviews)</span>
                                            )}
                                        </div>
                                    )}
                                    {product.source && <p className="text-sm text-gray-500 mb-2">Source: {product.source}</p>}
                                    {(product.link || product.productUrl) && (
                                        <a href={product.link ?? product.productUrl ?? ''} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium">
                                            View Product →
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 text-center text-sm text-gray-500 border-t pt-4">
                        💰 All prices are shown in {currency} ({getCurrencySymbol(currency)})
                    </div>
                </div>
            )}

            {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No products match your filters</p>
                    <button onClick={resetFilters} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Clear All Filters
                    </button>
                </div>
            )}

            {!loading && !error && products.length === 0 && aiInsights === null && (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">🔍 Enter a search query to find products</p>
                    <p className="text-sm">Try: "gaming laptop", "iPhone 15", "wireless headphones"</p>
                </div>
            )}
        </div>
    );
}
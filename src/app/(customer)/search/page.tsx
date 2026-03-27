"use client";

import { useState, useEffect } from "react";
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
}

interface AIInsights {
    summary: string;
    bestChoice: string;
    pros: string[];
    cons: string[];
    recommendations?: string[];
    comparison?: string;
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

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [currency, setCurrency] = useState<string>("USD");

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
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to search products");
        } finally {
            setLoading(false);
        }
    };

    // Format price with proper currency
    const formatPrice = (price: string | number, currencyCode: string): string => {
        try {
            let numericPrice: number;
            if (typeof price === 'string') {
                const cleaned = price.replace(/[^0-9.-]/g, '');
                numericPrice = parseFloat(cleaned);
                if (isNaN(numericPrice)) return price; // Return original if parsing fails
            } else {
                numericPrice = price;
            }

            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(numericPrice);
        } catch (error) {
            console.error('Currency formatting error:', error);
            return typeof price === 'string' ? price : `${currencyCode} ${price}`;
        }
    };

    // Get currency symbol using Intl API
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
            // Fallback for unsupported currencies
            const fallbackSymbols: { [key: string]: string } = {
                'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
                'CNY': '¥', 'INR': '₹', 'AUD': 'A$', 'CAD': 'C$',
                'CHF': 'CHF', 'SGD': 'S$', 'HKD': 'HK$', 'NZD': 'NZ$',
                'KRW': '₩', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R'
            };
            return fallbackSymbols[currencyCode] || currencyCode;
        }
    };

    // Get currency name
    const getCurrencyName = (currencyCode: string): string => {
        try {
            const displayNames: { [key: string]: string } = {
                'USD': 'US Dollar', 'EUR': 'Euro', 'GBP': 'British Pound',
                'JPY': 'Japanese Yen', 'INR': 'Indian Rupee', 'CNY': 'Chinese Yuan',
                'AUD': 'Australian Dollar', 'CAD': 'Canadian Dollar', 'CHF': 'Swiss Franc',
                'SGD': 'Singapore Dollar', 'HKD': 'Hong Kong Dollar', 'NZD': 'New Zealand Dollar'
            };
            return displayNames[currencyCode] || currencyCode;
        } catch {
            return currencyCode;
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">AI Product Search</h1>

            {/* Search */}
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

            {/* Currency Display */}
            {!loading && products.length > 0 && (
                <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        📊 {products.length} products found
                    </div>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        💱 Currency: {currency} ({getCurrencySymbol(currency)}) - {getCurrencyName(currency)}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* AI Insights */}
            {aiInsights && !loading && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">🤖 AI Insights</h2>

                    <div className="mb-4">
                        <p className="text-gray-700">{aiInsights.summary}</p>
                    </div>

                    <div className="mb-4">
                        <p className="font-semibold">🏆 Best Choice:</p>
                        <p className="text-gray-700">{aiInsights.bestChoice}</p>
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

                    {aiInsights.comparison && (
                        <div className="mt-4 p-4 bg-white rounded-lg">
                            <p className="font-semibold">📊 Comparison:</p>
                            <p className="text-gray-700">{aiInsights.comparison}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Products ({products.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product, index) => (
                            <div
                                key={product.id || index}
                                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                            >
                                {/* Product Image */}
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

                                {/* Product Details */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                        {product.title}
                                    </h3>

                                    {/* Price with Currency */}
                                    {product.price && (
                                        <div className="mb-2">
                                            <p className="text-xl font-bold text-blue-600">
                                                {formatPrice(product.price, currency)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Source */}
                                    {product.source && (
                                        <p className="text-sm text-gray-500 mb-2">
                                            Source: {product.source}
                                        </p>
                                    )}

                                    {/* View Link */}
                                    {(product.link || product.productUrl) && (
                                        <a
                                            href={product.link ?? product.productUrl ?? ''}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
                                        >
                                            View Product →
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Currency Footer */}
                    <div className="mt-8 text-center text-sm text-gray-500 border-t pt-4">
                        💰 All prices are shown in <span className="font-semibold">{currency}</span> ({getCurrencySymbol(currency)}) - {getCurrencyName(currency)}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && aiInsights === null && (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">🔍 Enter a search query to find products</p>
                    <p className="text-sm">Try: "gaming laptop", "iPhone 15", "wireless headphones"</p>
                </div>
            )}
        </div>
    );
}
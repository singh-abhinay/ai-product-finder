"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface RecentSearch {
    id: string;
    query: string;
    country: string;
    currency: string;
    totalProducts: number;
    status: "COMPLETED" | "PENDING" | "FAILED";
    createdAt: string;
    responseTime?: number | null;
    productPreview: {
        id: string;
        title: string;
        imageUrl: string | null;
        price: string | null;
        source: string | null;
    } | null;
    aiSummary: string | null;
    bestPick: string | null;
}

export default function RecentSearch() {
    const [searches, setSearches] = useState<RecentSearch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchRecentSearches();
    }, []);

    const fetchRecentSearches = async () => {
        try {
            const userInfoCookie = Cookies.get("userInfo");
            if (!userInfoCookie) {
                setLoading(false);
                return;
            }

            const response = await fetch("/api/search/recent");
            const data = await response.json();

            if (data.success) {
                setSearches(data.data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error("Error fetching recent searches:", error);
            setError("Failed to load recent searches");
        } finally {
            setLoading(false);
        }
    };

    const getCurrencySymbol = (currencyCode: string): string => {
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
            const symbols: { [key: string]: string } = {
                'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
                'CNY': '¥', 'INR': '₹', 'AUD': 'A$', 'CAD': 'C$',
                'CHF': 'CHF', 'SGD': 'S$', 'HKD': 'HK$', 'NZD': 'NZ$',
                'KRW': '₩', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R'
            };
            return symbols[currencyCode] || currencyCode;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 48) return "Yesterday";
        return date.toLocaleDateString();
    };

    const formatPrice = (price: string | null, currency: string): string => {
        if (!price) return "N/A";
        try {
            const numericPrice = parseFloat(price.replace(/[^0-9.-]/g, ''));
            if (isNaN(numericPrice)) return price;

            const symbol = getCurrencySymbol(currency);
            return `${symbol}${numericPrice.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            })}`;
        } catch {
            return price;
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "success";
            case "PENDING":
                return "warning";
            case "FAILED":
                return "error";
            default:
                return "default";
        }
    };

    const handleSearchClick = (query: string) => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
            searchInput.value = query;
            const event = new Event('input', { bubbles: true });
            searchInput.dispatchEvent(event);

            const searchButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (searchButton) {
                searchButton.click();
            }
        }
    };

    if (loading) {
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="text-center py-12 text-red-500">
                    {error}
                </div>
            </div>
        );
    }

    if (searches.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Recent Search
                        </h3>
                    </div>
                </div>
                <div className="text-center py-12 text-gray-500">
                    No recent searches found
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Recent Search
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searches.length} recent searches
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchRecentSearches()}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                        <svg
                            className="stroke-current fill-white dark:fill-gray-800"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M2.29004 5.90393H17.7067"
                                stroke=""
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M17.7075 14.0961H2.29085"
                                stroke=""
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                                fill=""
                                stroke=""
                                strokeWidth="1.5"
                            />
                            <path
                                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                                fill=""
                                stroke=""
                                strokeWidth="1.5"
                            />
                        </svg>
                        Refresh
                    </button>
                    <button
                        onClick={() => router.push('/search-history')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                        See all
                    </button>
                </div>
            </div>
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Search Query
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Results
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Preview
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Date
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Status
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {searches.map((search) => (
                            <TableRow
                                key={search.id}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                onClick={() => handleSearchClick(search.query)}
                            >
                                <TableCell className="py-3">
                                    <div>
                                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                            {search.query}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {search.responseTime && (
                                                <>
                                                    <span className="text-gray-400 text-theme-xs">•</span>
                                                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                                                        {search.responseTime}ms
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    <span className="text-gray-700 text-theme-sm dark:text-gray-300 font-medium">
                                        {search.totalProducts}
                                    </span>
                                    <span className="text-gray-500 text-theme-xs ml-1">
                                        products
                                    </span>
                                    {search.bestPick && (
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                            Best: {search.bestPick}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
                                    {search.productPreview ? (
                                        <div className="flex items-center gap-2">
                                            {search.productPreview.imageUrl && (
                                                <div className="h-10 w-10 relative flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                    <Image
                                                        src={search.productPreview.imageUrl}
                                                        alt={search.productPreview.title}
                                                        fill
                                                        sizes="40px"
                                                        className="object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = "none";
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90 line-clamp-2">
                                                    {search.productPreview.title}
                                                </p>
                                                {search.productPreview.price && (
                                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                                        {formatPrice(search.productPreview.price, search.currency)}
                                                    </p>
                                                )}
                                                {search.productPreview.source && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {search.productPreview.source}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">No preview available</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
                                    <div>
                                        <p className="text-gray-700 text-theme-sm dark:text-gray-300">
                                            {formatDate(search.createdAt)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(search.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    <Badge
                                        size="sm"
                                        color={getStatusBadgeColor(search.status)}
                                    >
                                        {search.status.toLowerCase()}
                                    </Badge>
                                    {search.aiSummary && (
                                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                            {search.aiSummary}
                                        </p>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
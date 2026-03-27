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

interface RecentProduct {
    id: string;
    title: string;
    price: string | null;
    currency: string;
    imageUrl: string | null;
    source: string | null;
    rating: number | null;
    productUrl: string | null;
    searchQuery: string | null;
    viewedAt: string;
    searchId: string;
}

export default function RecentProducts() {
    const [products, setProducts] = useState<RecentProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchRecentProducts();
    }, []);

    const fetchRecentProducts = async () => {
        try {
            const userInfoCookie = Cookies.get("userInfo");
            if (!userInfoCookie) {
                setLoading(false);
                return;
            }

            const response = await fetch("/api/products/recent");
            const data = await response.json();

            if (data.success) {
                setProducts(data.data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error("Error fetching recent products:", error);
            setError("Failed to load recent products");
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

    const formatPrice = (price: string | number | null, currencyCode: string): string => {
        if (!price) return "N/A";

        try {
            let numericPrice: number;
            if (typeof price === 'string') {
                const cleaned = price.replace(/[^0-9.-]/g, '');
                numericPrice = parseFloat(cleaned);
                if (isNaN(numericPrice)) return price;
            } else {
                numericPrice = price;
            }

            const symbol = getCurrencySymbol(currencyCode);
            return `${symbol}${numericPrice.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            })}`;
        } catch {
            return typeof price === 'string' ? price : `${currencyCode} ${price}`;
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

    const handleProductClick = (searchQuery: string | null) => {
        if (searchQuery) {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) {
                searchInput.value = searchQuery;
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);

                const searchButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (searchButton) {
                    searchButton.click();
                }
            }
        }
    };

    const handleViewProduct = (e: React.MouseEvent, url: string | null) => {
        e.stopPropagation();
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const getRatingStars = (rating: number | null) => {
        if (!rating) return null;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <svg
                        key={i}
                        className={`w-3 h-3 ${i < fullStars
                            ? "text-yellow-400 fill-yellow-400"
                            : i === fullStars && hasHalfStar
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300 fill-gray-300"
                            }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
            </div>
        );
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

    if (products.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Recent Products
                        </h3>
                    </div>
                </div>
                <div className="text-center py-12 text-gray-500">
                    No products viewed yet
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Recent Products
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {products.length} recently viewed products
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchRecentProducts()}
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
                        onClick={() => router.push('/products/history')}
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
                                Product
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Price
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Rating
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Source
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Action
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Viewed
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {products.map((product) => (
                            <TableRow
                                key={product.id}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                onClick={() => handleProductClick(product.searchQuery)}
                            >
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                        {product.imageUrl && (
                                            <div className="h-[50px] w-[50px] relative flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                <Image
                                                    src={product.imageUrl || '/placeholder-image.jpg'}
                                                    alt={product.title}
                                                    fill
                                                    sizes="50px"
                                                    className="object-cover"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/placeholder-image.jpg';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 line-clamp-2">
                                                {product.title}
                                            </p>
                                            {product.searchQuery && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    From: "{product.searchQuery}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    <p className="font-semibold text-blue-600 text-theme-sm">
                                        {formatPrice(product.price, product.currency)}
                                    </p>
                                </TableCell>
                                <TableCell className="py-3">
                                    {getRatingStars(product.rating)}
                                </TableCell>
                                <TableCell className="py-3">
                                    {product.source && (
                                        <Badge size="sm" color="default">
                                            {product.source}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
                                    {product.productUrl && (
                                        <button
                                            onClick={(e) => handleViewProduct(e, product.productUrl)}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            View Product
                                        </button>
                                    )}
                                </TableCell>
                                <TableCell className="py-3">
                                    <p className="text-gray-700 text-theme-sm dark:text-gray-300">
                                        {formatDate(product.viewedAt)}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
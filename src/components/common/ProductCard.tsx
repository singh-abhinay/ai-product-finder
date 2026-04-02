import Link from "next/link";
import { useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useToast } from "@/components/ui/use-toast";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number | null;
    originalPrice: number | null;
    image: string | null;
    rating: number | null;
    reviewsCount: number | null;
    source: string | null;
    summary: string | null;
    productUrl: string | null;
  };
  currencySymbol: string;
  formatPrice: (price: number | null) => string;
  watchlist?: boolean;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (productId: string, isNowWatchlisted: boolean) => void;
}

export default function ProductCard({
  product,
  currencySymbol,
  formatPrice,
  watchlist = false,
  isWatchlisted: propIsWatchlisted = false,
  onWatchlistToggle
}: ProductCardProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(propIsWatchlisted);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsWatchlisted(propIsWatchlisted);
  }, [propIsWatchlisted]);

  const handleWatchlist = async () => {
    if (isUpdating) return;

    const newWatchlistState = !isWatchlisted;

    try {
      setIsUpdating(true);
      setIsWatchlisted(newWatchlistState);

      const response = await fetch("/api/watchlist/toggle", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          title: product.name,
          price: product.price,
          imageUrl: product.image,
          productUrl: product.productUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update watchlist");
      }

      // Show success toast
      toast({
        title: data.isWatchlisted ? "Added to Watchlist" : "Removed from Watchlist",
        description: data.isWatchlisted
          ? `${product.name} has been added to your watchlist`
          : `${product.name} has been removed from your watchlist`,
        variant: "default",
      });

      // Notify parent component
      if (onWatchlistToggle) {
        onWatchlistToggle(product.id, data.isWatchlisted);
      }
    } catch (err) {
      console.error("Error updating watchlist:", err);
      // Revert on error
      setIsWatchlisted(!newWatchlistState);

      // Show error toast
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update watchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}

        {/* Source Badge */}
        {product.source && (
          <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {product.source}
          </span>
        )}

        {/* Watchlist Button - Positioned top-left if watchlist feature is enabled */}
        {watchlist && (
          <button
            onClick={handleWatchlist}
            disabled={isUpdating}
            className={`absolute top-2 left-2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 ${isUpdating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
          >
            {isWatchlisted ? (
              <HeartIconSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price! && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-yellow-400">
              {"★".repeat(Math.floor(product.rating))}
              {"☆".repeat(5 - Math.floor(product.rating))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.reviewsCount || 0})
            </span>
          </div>
        )}

        {/* Summary */}
        {product.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {product.summary}
          </p>
        )}

        {/* View Product Button */}
        {product.productUrl && (
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Product
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
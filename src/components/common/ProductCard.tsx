import Link from "next/link";

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
}

export default function ProductCard({
  product,
  currencySymbol,
  formatPrice
}: ProductCardProps) {
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
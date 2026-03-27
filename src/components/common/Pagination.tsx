"use client";

import { useCallback, useMemo } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const getPageNumbers = useMemo(() => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push("...");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push("...");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push("...");
                pages.push(totalPages);
            }
        }
        return pages;
    }, [currentPage, totalPages]);

    const handlePageChange = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    }, [onPageChange, totalPages]);

    if (totalPages <= 1) return null;

    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm transition-colors"
            >
                Previous
            </button>

            <div className="flex items-center gap-1">
                {getPageNumbers.map((page, index) => (
                    page === "..." ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-gray-500 dark:text-gray-400"
                            aria-hidden="true"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            aria-current={currentPage === page ? "page" : undefined}
                            aria-label={`Page ${page}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                ? "bg-brand-500 text-white hover:bg-brand-600"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                }`}
                        >
                            {page}
                        </button>
                    )
                ))}
            </div>

            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm transition-colors"
            >
                Next
            </button>
        </nav>
    );
};

export default Pagination;
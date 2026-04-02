import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const userInfoCookie = request.cookies.get("userInfo");

        if (!userInfoCookie) {
            return NextResponse.json(
                { success: false, message: "User not authenticated" },
                { status: 401 }
            );
        }

        let userInfo;
        try {
            userInfo = JSON.parse(userInfoCookie.value);
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid user session" },
                { status: 400 }
            );
        }

        const userId = userInfo.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 400 }
            );
        }

        // Get all searches for the user
        const userSearches = await prisma.searchHistory.findMany({
            where: {
                status: "COMPLETED"
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                products: {
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });

        // Transform products
        const allProducts = userSearches.flatMap(search =>
            search.products.map(product => ({
                id: product.id,
                title: product.title,
                price: product.price,
                originalPrice: product.originalPrice,
                currency: search.currency,
                imageUrl: product.imageUrl,
                source: product.source,
                rating: product.rating,
                reviewsCount: product.reviewsCount,
                summary: product.summary,
                productUrl: product.productUrl,
                searchQuery: search.query,
                viewedAt: search.createdAt,
                searchId: search.id
            }))
        );

        // Optional: Get pagination parameters from URL
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limitParam = url.searchParams.get("limit");

        // If limit is provided and is a number, apply pagination
        // Otherwise, return all products
        let paginatedProducts = allProducts;
        let totalPages = 1;

        if (limitParam && !isNaN(parseInt(limitParam, 10))) {
            const limit = parseInt(limitParam, 10);
            const startIndex = (page - 1) * limit;
            paginatedProducts = allProducts.slice(startIndex, startIndex + limit);
            totalPages = Math.ceil(allProducts.length / limit);
        }

        return NextResponse.json({
            success: true,
            data: paginatedProducts,
            pagination: limitParam ? {
                total: allProducts.length,
                page,
                limit: parseInt(limitParam, 10),
                totalPages,
            } : null,
            searchesCount: userSearches.length,
            allProductsCount: allProducts.length
        });

    } catch (error) {
        console.error("Error fetching products:", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to fetch products"
            },
            { status: 500 }
        );
    }
}
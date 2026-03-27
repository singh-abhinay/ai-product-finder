import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const userInfoCookie = req.cookies.get("userInfo");

        if (!userInfoCookie) {
            return NextResponse.json(
                { success: false, message: "User not authenticated" },
                { status: 401 }
            );
        }

        const userInfo = JSON.parse(userInfoCookie.value);
        const userId = userInfo.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 400 }
            );
        }

        const recentSearches = await prisma.searchHistory.findMany({
            where: {
                userId: userId,
                status: "COMPLETED"
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 10,
            include: {
                products: {
                    take: 10,
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });

        const formattedProducts = recentSearches.flatMap(search =>
            search.products.map(product => ({
                id: product.id,
                title: product.title,
                price: product.price,
                currency: search.currency,
                imageUrl: product.imageUrl,
                source: product.source,
                rating: product.rating,
                productUrl: product.productUrl,
                searchQuery: search.query,
                viewedAt: search.createdAt,
                searchId: search.id
            }))
        ).slice(0, 10);

        return NextResponse.json({
            success: true,
            data: formattedProducts,
            count: formattedProducts.length,
            searchesCount: recentSearches.length
        });

    } catch (error) {
        console.error("Error fetching recent products:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch recent products" },
            { status: 500 }
        );
    }
}
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

        const searches = await prisma.searchHistory.findMany({
            where: {
                userId: userId,
                status: "COMPLETED"
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                products: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        price: true,
                        source: true
                    }
                },
                aiAnalysis: {
                    select: {
                        id: true,
                        summary: true,
                        bestPick: true
                    }
                }
            }
        });

        const formattedSearches = searches.map(search => ({
            id: search.id,
            query: search.query,
            country: search.country,
            currency: search.currency,
            totalProducts: search.totalProducts,
            status: search.status,
            createdAt: search.createdAt,
            responseTime: search.responseTime,
            productPreview: search.products[0] || null,
            aiSummary: search.aiAnalysis?.summary || null,
            bestPick: search.aiAnalysis?.bestPick || null
        }));

        return NextResponse.json({
            success: true,
            data: formattedSearches,
            count: formattedSearches.length
        });

    } catch (error) {
        console.error("Error fetching recent searches:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch recent searches" },
            { status: 500 }
        );
    }
}
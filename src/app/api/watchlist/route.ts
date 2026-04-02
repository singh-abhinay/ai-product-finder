import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!);
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        const userId = decoded.userId;

        const watchlist = await prisma.watchlist.findMany({
            where: { userId },
            select: {
                productId: true,
                title: true,
                price: true,
                imageUrl: true,
                productUrl: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const watchlistIds = watchlist.map((item) => item.productId);

        return NextResponse.json({
            success: true,
            ids: watchlistIds,
            items: watchlist,
            count: watchlist.length,
        });
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
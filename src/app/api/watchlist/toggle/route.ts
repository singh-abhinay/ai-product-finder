import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { productId, title, price, imageUrl, productUrl } = body;

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        const existingWatchlistItem = await prisma.watchlist.findFirst({
            where: {
                userId,
                productId,
            },
        });

        let isWatchlisted: boolean;
        let message: string;

        if (existingWatchlistItem) {
            await prisma.watchlist.delete({
                where: {
                    id: existingWatchlistItem.id,
                },
            });
            isWatchlisted = false;
            message = "Product removed from watchlist";
        } else {
            await prisma.watchlist.create({
                data: {
                    userId,
                    productId,
                    title: title || "Untitled Product",
                    price: price || null,
                    imageUrl: imageUrl || null,
                    productUrl: productUrl || null,
                },
            });
            isWatchlisted = true;
            message = "Product added to watchlist";
        }

        const updatedWatchlistCount = await prisma.watchlist.count({
            where: { userId },
        });

        return NextResponse.json({
            success: true,
            message,
            isWatchlisted,
            watchlistCount: updatedWatchlistCount,
        });
    } catch (error) {
        console.error("Error toggling watchlist:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
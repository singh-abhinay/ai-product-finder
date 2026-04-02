import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const productId = params.id;

        const watchlistItem = await prisma.watchlist.findFirst({
            where: {
                userId,
                productId,
            },
        });

        if (!watchlistItem) {
            return NextResponse.json(
                { error: "Product not found in watchlist" },
                { status: 404 }
            );
        }

        await prisma.watchlist.delete({
            where: {
                id: watchlistItem.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Product removed from watchlist",
        });
    } catch (error) {
        console.error("Error removing from watchlist:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
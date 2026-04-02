import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
    try {
        // Get token from cookie
        const token = request.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify JWT token
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
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser && existingUser.id !== userId) {
            return NextResponse.json(
                { error: "Email is already taken" },
                { status: 400 }
            );
        }

        // Update email
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { email },
            select: {
                email: true,
            },
        });

        // Update the token cookie with new email
        const newToken = jwt.sign(
            { userId, role: decoded.role },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        const response = NextResponse.json({
            success: true,
            message: "Email updated successfully",
            email: updatedUser.email,
        });

        // Update the token cookie
        response.cookies.set("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error("Error updating email:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 401 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
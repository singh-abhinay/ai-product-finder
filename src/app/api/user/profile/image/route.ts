import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
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

        // Get the form data
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No image file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "File must be an image" },
                { status: 400 }
            );
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Image size must be less than 5MB" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileExtension = file.type.split("/")[1];
        const filename = `${userId}_${Date()}.${fileExtension}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

        // Create directory if it doesn't exist
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Save image URL to database
        const imageUrl = `/uploads/profiles/${filename}`;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                profileImage: imageUrl,
            },
            select: {
                profileImage: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Profile image uploaded successfully",
            imageUrl: updatedUser.profileImage,
        });
    } catch (error) {
        console.error("Error uploading profile image:", error);
        return NextResponse.json(
            { error: "Failed to upload image" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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

        // Get current user to find the image path
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profileImage: true },
        });

        // Remove image from database
        await prisma.user.update({
            where: { id: userId },
            data: {
                profileImage: null,
            },
        });

        // Optionally delete the file from filesystem
        if (user?.profileImage) {
            const filepath = path.join(process.cwd(), "public", user.profileImage);
            try {
                const fs = await import("fs/promises");
                await fs.unlink(filepath);
            } catch (error) {
                console.error("Error deleting image file:", error);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Profile image removed successfully",
        });
    } catch (error) {
        console.error("Error removing profile image:", error);
        return NextResponse.json(
            { error: "Failed to remove image" },
            { status: 500 }
        );
    }
}
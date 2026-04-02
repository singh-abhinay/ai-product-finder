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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                fname: true,
                lname: true,
                phone: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
                profileImage: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

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
        const body = await request.json();

        const updateData: any = {};

        if (body.fname !== undefined) updateData.fname = body.fname || null;
        if (body.lname !== undefined) updateData.lname = body.lname || null;
        if (body.name !== undefined) updateData.name = body.name || null;
        if (body.phone !== undefined) updateData.phone = body.phone || null;
        if (body.addressLine1 !== undefined) updateData.addressLine1 = body.addressLine1 || null;
        if (body.addressLine2 !== undefined) updateData.addressLine2 = body.addressLine2 || null;
        if (body.city !== undefined) updateData.city = body.city || null;
        if (body.state !== undefined) updateData.state = body.state || null;
        if (body.country !== undefined) updateData.country = body.country || null;
        if (body.postalCode !== undefined) updateData.postalCode = body.postalCode || null;

        // Only update if there's something to update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                fname: true,
                lname: true,
                phone: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
                profileImage: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
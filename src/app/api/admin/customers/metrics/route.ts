import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        jwt.verify(token, process.env.JWT_SECRET!);

        const totalCustomers = await prisma.user.count({
            where: { role: "CUSTOMER" },
        });
        const totalOrders = await prisma.searchHistory.count();

        return NextResponse.json({
            customers: totalCustomers,
            orders: totalOrders,
            customerGrowth: 0,
            orderDecline: 0,
        });
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
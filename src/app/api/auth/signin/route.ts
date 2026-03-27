import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 });
    }

    console.log("User logged in:", { email: user.email, role: user.role });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const decodedCheck = jwt.decode(token);

    const userInfo = {
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.id,
      fname: user.fname,
      lname: user.lname,
      phone: user.phone,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
    };

    const response = NextResponse.json({
      success: true,
      role: user.role,
    });

    //Set httpOnly token cookie with maxAge
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Set readable userInfo cookie for client
    response.cookies.set("userInfo", JSON.stringify(userInfo), {
      httpOnly: false, // client can read
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
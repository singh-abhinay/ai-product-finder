import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Normalize Input
    const data = {
      fname: body.fname?.trim(),
      lname: body.lname?.trim(),
      email: body.email?.trim().toLowerCase(),
      password: body.password,
      phone: body.phone?.trim(),
      addressLine1: body.addressLine1?.trim(),
      addressLine2: body.addressLine2?.trim(),
      city: body.city?.trim(),
      state: body.state?.trim(),
      country: body.country?.trim(),
      postalCode: body.postalCode?.trim(),
    };

    // Required Fields
    const requiredFields = [
      { field: data.fname, name: "First name" },
      { field: data.lname, name: "Last name" },
      { field: data.email, name: "Email" },
      { field: data.password, name: "Password" },
      { field: data.phone, name: "Phone" },
      { field: data.addressLine1, name: "Address" },
      { field: data.city, name: "City" },
      { field: data.state, name: "State" },
      { field: data.country, name: "Country" },
      { field: data.postalCode, name: "Postal code" },
    ];

    const missing = requiredFields.filter((f) => !f.field);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          message: `Missing fields: ${missing.map((f) => f.name).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Email Validations
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { message: "Email is invalid" },
        { status: 400 }
      );
    }

    // Password (min 6 chars)
    if (!data.password || data.password.length < 6) {
      return NextResponse.json(
        { message: "Minimum 6 characters required" },
        { status: 400 }
      );
    }

    // Check Existing User
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        return NextResponse.json(
          { message: "Email already registered" },
          { status: 400 }
        );
      }
      if (existingUser.phone === data.phone) {
        return NextResponse.json(
          { message: "Phone already registered" },
          { status: 400 }
        );
      }
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create User
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fname: data.fname,
        lname: data.lname,
        password: hashedPassword,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        name: `${data.fname} ${data.lname}`.trim(),
        role: "CUSTOMER",
      },
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
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);

    if (error.code === "P2002") {
      const target = error.meta?.target;

      if (target?.includes("email")) {
        return NextResponse.json(
          { message: "Email already registered" },
          { status: 400 }
        );
      }

      if (target?.includes("phone")) {
        return NextResponse.json(
          { message: "Phone already registered" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "Duplicate field error" },
        { status: 400 }
      );
    }

    if (error.message?.includes("bcrypt")) {
      return NextResponse.json(
        { message: "Password processing error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
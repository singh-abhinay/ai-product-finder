// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ 
    message: "Logged out successfully",
    success: true 
  });
  
  // Clear the token cookie with multiple approaches
  response.cookies.set({
    name: "token",
    value: "",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // This should delete the cookie
    sameSite: "lax",
    expires: new Date(0), // Also set expires to past date
  });
  
  // Also clear userInfo cookie if it exists
  response.cookies.set({
    name: "userInfo",
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
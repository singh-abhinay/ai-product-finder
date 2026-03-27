import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

interface DecodedToken {
  role: string;
  userId: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log("MIDDLEWARE RUNNING - Path:", pathname);
  
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/signin" || pathname === "/signup") {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  console.log("Token present:", !!token);

  if (!token) {
    console.log("No token, redirecting to /signin");
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const decoded = payload as unknown as DecodedToken;
    
    console.log("Token verified - User ID:", decoded.userId, "Role:", decoded.role);
    
    if (pathname.startsWith("/admin")) {
      if (decoded.role !== "ADMIN") {
        console.log("Non-admin accessing admin, redirecting to /");
        return NextResponse.redirect(new URL("/", request.url));
      }
      console.log("Admin access granted to:", pathname);
    } else {
      if (decoded.role === "ADMIN") {
        console.log("Admin accessing customer route, redirecting to /admin");
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      console.log("Customer access granted to:", pathname);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
};
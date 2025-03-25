import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";

export function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get("death_set_auth_token")?.value;

  if (!token) {
    console.error("Token not found");
    return false;
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT secret not found");
      return false;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log("Token valid:", !isTokenExpired(decoded));
    return !isTokenExpired(decoded);
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}

function isTokenExpired(decoded: JwtPayload): boolean {
  if (!decoded.exp) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export function isAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

export function handleAuthRedirect(request: NextRequest): NextResponse | null {
  const authenticated = isAuthenticated(request);
  const authPath = isAuthPath(request.nextUrl.pathname);

  if (authenticated && authPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    !authenticated &&
    !authPath &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return null;
}

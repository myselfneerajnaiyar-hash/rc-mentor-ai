import { NextResponse } from "next/server";

export function middleware(request) {

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/preview") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}
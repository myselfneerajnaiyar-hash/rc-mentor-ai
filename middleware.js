import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // If user opens root domain
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/preview", request.url));
  }

  return NextResponse.next();
}
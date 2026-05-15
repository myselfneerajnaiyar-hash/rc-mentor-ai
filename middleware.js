import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const hasAuth =
    request.cookies.has("sb-access-token") ||
    request.cookies.has("supabase-auth-token");

  // Only guests should go to preview
  if (pathname === "/" && !hasAuth) {
    return NextResponse.redirect(new URL("/preview", request.url));
  }

  return NextResponse.next();
}
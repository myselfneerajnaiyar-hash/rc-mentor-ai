import { NextResponse } from "next/server";
import { getInstituteHostRedirectPath } from "./lib/tenant/instituteHostRouting.mjs";

export function middleware(request) {

  const { pathname } = request.nextUrl;
  const instituteRedirectPath = getInstituteHostRedirectPath(request.nextUrl.hostname, pathname);
  if (instituteRedirectPath) {
    const destination = request.nextUrl.clone();
    destination.pathname = instituteRedirectPath;
    return NextResponse.redirect(destination);
  }

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

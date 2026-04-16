import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isAuthPage = pathname === "/login" || pathname === "/admin/login";
  const isPublicPage =
    pathname === "/" ||
    pathname === "/register" ||
    pathname.startsWith("/verify-email") ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin" : "/expenses", req.url)
      );
    }
    return NextResponse.next();
  }

  if (isPublicPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/expenses", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const login = new URL(pathname.startsWith("/admin") ? "/admin/login" : "/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/expenses", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

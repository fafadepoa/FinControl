import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isAuthPage = pathname === "/login" || pathname === "/admin/login";
  const isPublicPage =
    pathname === "/" ||
    pathname === "/register" ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/accept-invite") ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  if (isAuthPage) {
    // Não redirecionar quando já logado: se o cliente falhar ao obter /api/auth/session (HTML/erro)
    // mas o Edge ainda vê o cookie JWT, redirecionar /login -> /admin + requireAdmin -> /login gerava loop.
    return NextResponse.next();
  }

  if (isPublicPage) {
    // Sem redirect aqui quando logado: `app/page.tsx` e outras páginas já fazem redirect
    // com `auth()` no servidor; redirecionar no Edge com JWT que o Node ainda não reflete
    // gerava loop com `/` -> `/admin` -> requireAdmin -> `/login`.
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const home = new URL("/", req.url);
    const callbackUrl = `${pathname}${req.nextUrl.search ?? ""}`;
    home.searchParams.set("reauth", "1");
    home.searchParams.set("callbackUrl", callbackUrl);
    home.searchParams.set("audience", pathname.startsWith("/admin") ? "admin" : "collaborator");
    return NextResponse.redirect(home);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/expenses", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Exclui /api do middleware: rotas Auth.js (/api/auth/session, etc.) não devem passar pelo
  // wrapper auth() do middleware — evita ClientFetchError (HTML em vez de JSON) no SessionProvider.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export function ExpensesTopNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname() ?? "";

  return (
    <header className="fc-glass sticky top-0 z-20 mx-4 mt-4 flex flex-wrap items-center justify-between gap-4 px-5 py-3 md:mx-auto md:max-w-5xl">
      <nav className="flex flex-wrap gap-1 text-sm font-medium">
        <Link
          href="/expenses"
          className={`fc-nav-link ${pathname === "/expenses" && !pathname.includes("new") ? "fc-nav-link-active" : ""}`}
        >
          Minhas despesas
        </Link>
        <Link
          href="/expenses/new"
          className={`fc-nav-link ${pathname === "/expenses/new" ? "fc-nav-link-active" : ""}`}
        >
          Nova despesa
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className={`fc-nav-link ${pathname.startsWith("/admin") ? "fc-nav-link-active" : ""}`}
          >
            Painel admin
          </Link>
        )}
      </nav>
      <LogoutButton />
    </header>
  );
}

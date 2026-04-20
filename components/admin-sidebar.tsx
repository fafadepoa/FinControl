"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { BrandLogoMark } from "@/components/brand-logo-mark";
import { LogoutButton } from "@/components/logout-button";

type NavItem = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: React.ReactNode;
};

function IconDashboard() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
function IconList() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function IconWallet() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

const mainLinks: NavItem[] = [
  { href: "/admin", label: "Dashboard", match: (p) => p === "/admin", icon: <IconDashboard /> },
  { href: "/admin/expenses", label: "Despesas", match: (p) => p.startsWith("/admin/expenses"), icon: <IconList /> },
  { href: "/expenses/new", label: "Nova despesa", match: (p) => p === "/expenses/new", icon: <IconPlus /> },
  { href: "/admin/credits", label: "Créditos", match: (p) => p.startsWith("/admin/credits"), icon: <IconWallet /> },
];

const costCenterSubmenuLinks: NavItem[] = [
  { href: "/admin/companies", label: "Cadastro da empresa", match: (p) => p.startsWith("/admin/companies"), icon: <IconBuilding /> },
  { href: "/admin/cost-centers", label: "Centros de custo", match: (p) => p.startsWith("/admin/cost-centers"), icon: <IconLink /> },
  { href: "/admin/categories", label: "Categorias", match: (p) => p.startsWith("/admin/categories"), icon: <IconTag /> },
  { href: "/admin/users", label: "Colaboradores", match: (p) => p.startsWith("/admin/users"), icon: <IconUsers /> },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const isCostCenterChildRoute = useMemo(
    () => costCenterSubmenuLinks.some((link) => link.match(pathname)),
    [pathname]
  );
  const isCostCenterParentRoute = pathname.startsWith("/admin/cost-centers");
  const isCostCenterRoute = isCostCenterParentRoute || isCostCenterChildRoute;
  const isCostCenterOpen = isCostCenterChildRoute;

  return (
    <aside className="fc-admin-sidebar m-4 flex shrink-0 flex-col rounded-2xl p-3">
      <div className="fc-sidebar-brand mb-4 flex min-h-9 items-center gap-3">
        <BrandLogoMark variant="sidebar" />
        <span className="fc-sidebar-expand bg-gradient-to-r from-fc-cyan to-fc-green bg-clip-text text-lg font-bold text-transparent">
          FinControl
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 text-sm">
        {mainLinks.map((l) => {
          const active = l.match(pathname);
          return (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              className={`fc-admin-nav-row fc-nav-link flex items-center gap-3 ${active ? "fc-nav-link-active" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">{l.icon}</span>
              <span className="fc-sidebar-expand min-w-0 truncate font-medium">{l.label}</span>
            </Link>
          );
        })}
        <div className="fc-cost-center-group mt-1">
          <button
            type="button"
            title="Empresas e centros de custo"
            aria-expanded={isCostCenterOpen}
            aria-controls="cost-center-submenu"
            className={`fc-cost-center-parent fc-admin-nav-row fc-nav-link flex w-full items-center gap-3 ${
              isCostCenterRoute ? "fc-nav-link-active" : ""
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center">
              <IconLink />
            </span>
            <span className="fc-sidebar-expand min-w-0 flex-1 truncate text-left font-medium">Empresas</span>
            <span className="fc-sidebar-expand text-xs">{isCostCenterOpen ? "▾" : "▸"}</span>
          </button>
          <div
            id="cost-center-submenu"
            data-open={isCostCenterOpen ? "true" : "false"}
            aria-hidden={!isCostCenterOpen}
            className="fc-cost-center-submenu mt-1 flex flex-col gap-0.5"
          >
            {costCenterSubmenuLinks.map((l) => {
              const active = l.match(pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  title={l.label}
                  className={`fc-cost-center-child fc-admin-nav-row fc-nav-link flex items-center gap-3 pl-3 ${
                    active ? "fc-nav-link-active" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center">{l.icon}</span>
                  <span className="fc-sidebar-expand min-w-0 truncate font-medium">{l.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <Link
          href="/expenses"
          title="Minhas despesas"
          className="fc-admin-nav-row fc-nav-link flex items-center gap-3 text-xs"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center">
            <IconHome />
          </span>
          <span className="fc-sidebar-expand min-w-0 truncate">Minhas despesas</span>
        </Link>
        <div className="fc-sidebar-logout mt-2 flex">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

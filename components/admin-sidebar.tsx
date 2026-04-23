"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  CreditCard,
  FolderKanban,
  Home,
  LayoutDashboard,
  Link2,
  PlusCircle,
  ReceiptText,
  Users,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { BrandLogoMark } from "@/components/brand-logo-mark";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/cn";
import { UITooltip } from "@/components/ui/tooltip";

/** Não há campo `nome` na base ainda — deriva uma etiqueta legível da parte antes do @. */
function sidebarDisplayName(email: string | undefined | null): string {
  if (!email?.trim()) return "";
  const local = email.split("@")[0]?.trim() ?? "";
  const readable = local.replace(/[._-]+/g, " ").trim();
  if (!readable) return email;
  return readable.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

type NavItem = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: React.ReactNode;
};

const mainLinks: NavItem[] = [
  { href: "/admin", label: "Dashboard", match: (p) => p === "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/admin/expenses", label: "Despesas", match: (p) => p.startsWith("/admin/expenses"), icon: <ReceiptText className="h-5 w-5" /> },
  { href: "/expenses/new", label: "Nova despesa", match: (p) => p === "/expenses/new", icon: <PlusCircle className="h-5 w-5" /> },
  { href: "/admin/credits", label: "Créditos", match: (p) => p.startsWith("/admin/credits"), icon: <CreditCard className="h-5 w-5" /> },
];

const costCenterSubmenuLinks: NavItem[] = [
  { href: "/admin/companies", label: "Cadastro da empresa", match: (p) => p.startsWith("/admin/companies"), icon: <Building2 className="h-5 w-5" /> },
  { href: "/admin/cost-centers", label: "Centros de custo", match: (p) => p.startsWith("/admin/cost-centers"), icon: <Link2 className="h-5 w-5" /> },
  { href: "/admin/categories", label: "Categorias", match: (p) => p.startsWith("/admin/categories"), icon: <FolderKanban className="h-5 w-5" /> },
  { href: "/admin/users", label: "Colaboradores", match: (p) => p.startsWith("/admin/users"), icon: <Users className="h-5 w-5" /> },
];

export function AdminSidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(true);
  const isCostCenterChildRoute = useMemo(
    () => costCenterSubmenuLinks.some((link) => link.match(pathname)),
    [pathname]
  );
  const isCostCenterParentRoute = pathname.startsWith("/admin/cost-centers");
  const isCostCenterRoute = isCostCenterParentRoute || isCostCenterChildRoute;
  const isCostCenterOpen = isCostCenterChildRoute || !collapsed;

  return (
    <aside
      className={cn(
        "m-3 flex shrink-0 flex-col rounded-[var(--fc-radius-xl)] border border-[var(--fc-border)] bg-[var(--fc-surface-1)] p-3 shadow-[var(--fc-shadow-md)] transition-all duration-200",
        collapsed ? "w-[4.6rem]" : "w-[16rem]",
      )}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <div className="mb-4 flex min-h-9 items-center gap-3">
        <BrandLogoMark variant="sidebar" />
        <span className={cn("truncate bg-gradient-to-r from-fc-cyan to-fc-green bg-clip-text text-lg font-bold text-transparent", collapsed && "hidden")}>
          FinControl
        </span>
        <button type="button" className={cn("ml-auto text-[var(--fc-text-subtle)]", collapsed && "hidden")}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {status !== "loading" && session?.user?.email ? (
        <div className={cn("mb-3 min-w-0 border-b border-[var(--fc-border)] pb-3", collapsed && "hidden")}>
          <p className="truncate text-sm font-semibold leading-snug text-[var(--fc-heading)]">
            {session.user.name?.trim() || sidebarDisplayName(session.user.email)}
          </p>
          <p className="mt-1 truncate text-[11px] leading-snug tracking-wide text-[var(--fc-text-subtle)]" title={session.user.email}>
            {session.user.email}
          </p>
        </div>
      ) : status === "loading" ? (
        <div className={cn("mb-3 h-11 animate-pulse rounded-lg bg-[var(--fc-surface-3)]", collapsed && "hidden")} aria-hidden />
      ) : null}

      <nav className="flex flex-1 flex-col gap-0.5 text-sm">
        <p className={cn("px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--fc-text-subtle)]", collapsed && "hidden")}>
          Operação
        </p>
        {mainLinks.map((l) => {
          const active = l.match(pathname);
          const content = (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              className={cn(
                "flex items-center gap-3 rounded-[var(--fc-radius-md)] px-2 py-2 text-[var(--fc-text-muted)] transition-all hover:bg-[var(--fc-surface-3)] hover:text-[var(--fc-text)]",
                active && "bg-[var(--fc-primary-ring)] text-[var(--fc-heading)]",
                collapsed ? "justify-center" : "justify-start",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">{l.icon}</span>
              <span className={cn("min-w-0 truncate font-medium", collapsed && "hidden")}>{l.label}</span>
            </Link>
          );
          return (
            <div key={l.href}>
              {collapsed ? <UITooltip label={l.label}>{content}</UITooltip> : content}
            </div>
          );
        })}
        <p className={cn("mt-3 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--fc-text-subtle)]", collapsed && "hidden")}>
          Administração
        </p>
        <div className="mt-1">
          <button
            type="button"
            title="Empresas e centros de custo"
            aria-expanded={isCostCenterOpen}
            aria-controls="cost-center-submenu"
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--fc-radius-md)] px-2 py-2 text-[var(--fc-text-muted)] transition-all hover:bg-[var(--fc-surface-3)] hover:text-[var(--fc-text)]",
              isCostCenterRoute && "bg-[var(--fc-primary-ring)] text-[var(--fc-heading)]",
              collapsed ? "justify-center" : "justify-start",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center">
              <Link2 className="h-5 w-5" />
            </span>
            <span className={cn("min-w-0 flex-1 truncate text-left font-medium", collapsed && "hidden")}>Empresas</span>
            <ChevronRight className={cn("h-4 w-4 transition-transform", collapsed && "hidden", isCostCenterOpen && "rotate-90")} />
          </button>
          <div
            id="cost-center-submenu"
            data-open={isCostCenterOpen ? "true" : "false"}
            aria-hidden={!isCostCenterOpen}
            className={cn("mt-1 flex max-h-0 flex-col gap-0.5 overflow-hidden opacity-0 transition-all", isCostCenterOpen && !collapsed && "max-h-[14rem] opacity-100")}
          >
            {costCenterSubmenuLinks.map((l) => {
              const active = l.match(pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  title={l.label}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--fc-radius-md)] py-2 pl-3 pr-2 text-[var(--fc-text-muted)] transition-all hover:bg-[var(--fc-surface-3)] hover:text-[var(--fc-text)]",
                    active && "bg-[var(--fc-primary-ring)] text-[var(--fc-heading)]",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center">{l.icon}</span>
                  <span className="min-w-0 truncate font-medium">{l.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mt-4 border-t border-[var(--fc-border)] pt-4">
        <Link
          href="/expenses"
          title="Minhas despesas"
          className={cn(
            "flex items-center gap-3 rounded-[var(--fc-radius-md)] px-2 py-2 text-xs text-[var(--fc-text-muted)] transition-all hover:bg-[var(--fc-surface-3)]",
            collapsed ? "justify-center" : "justify-start",
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center">
            <Home className="h-5 w-5" />
          </span>
          <span className={cn("min-w-0 truncate", collapsed && "hidden")}>Minhas despesas</span>
        </Link>
        <div className={cn("mt-2 flex", collapsed ? "justify-center" : "justify-start")}>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

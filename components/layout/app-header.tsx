"use client";

import { Bell, ChevronRight, UserCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { UIThemeToggle } from "@/components/ui/theme-toggle";

function toCrumb(part: string) {
  if (!part) return "Início";
  return part
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AppHeader() {
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.length === 0 ? ["admin"] : parts;
  const title = toCrumb(crumbs[crumbs.length - 1] ?? "Dashboard");

  return (
    <header className="fc-shell-header">
      <div>
        <p className="fc-shell-breadcrumb flex flex-wrap items-center gap-1">
          {crumbs.map((part, index) => (
            <span key={`${part}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3 w-3" /> : null}
              {index === crumbs.length - 1 ? <strong>{toCrumb(part)}</strong> : toCrumb(part)}
            </span>
          ))}
        </p>
        <h1 className="text-xl font-semibold text-[var(--fc-heading)]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-2)] text-[var(--fc-text-muted)]"
          title="Notificações"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
        </button>
        <UIThemeToggle />
        <div className="inline-flex items-center gap-2 rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-2)] px-2 py-1 text-xs text-[var(--fc-text-muted)]">
          <UserCircle2 className="h-4 w-4" />
          <span>Perfil</span>
        </div>
      </div>
    </header>
  );
}

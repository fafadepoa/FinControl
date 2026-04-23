"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function UIThemeToggle() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-2)] text-[var(--fc-text-muted)] transition-colors hover:text-[var(--fc-text)]"
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

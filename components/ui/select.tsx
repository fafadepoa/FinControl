"use client";

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function UISelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-1)] px-3 text-sm text-[var(--fc-text)] outline-none transition-colors",
        "focus:border-[var(--fc-primary)] focus:ring-2 focus:ring-[var(--fc-primary-ring)]",
        className,
      )}
      {...props}
    />
  );
}

"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function UIInput({
  className,
  icon,
  rightSlot,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  rightSlot?: ReactNode;
  error?: string | null;
}) {
  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-[var(--fc-radius-md)] border bg-[var(--fc-surface-1)] px-3 transition-colors",
          error
            ? "border-[var(--fc-danger)]"
            : "border-[var(--fc-border)] focus-within:border-[var(--fc-primary)] focus-within:ring-2 focus-within:ring-[var(--fc-primary-ring)]",
        )}
      >
        {icon ? <span className="text-[var(--fc-text-subtle)]">{icon}</span> : null}
        <input
          className={cn(
            "w-full bg-transparent text-sm text-[var(--fc-text)] outline-none placeholder:text-[var(--fc-text-subtle)]",
            className,
          )}
          {...props}
        />
        {rightSlot ? <span className="inline-flex shrink-0 items-center">{rightSlot}</span> : null}
      </div>
      {error ? <p className="text-xs text-[var(--fc-danger)]">{error}</p> : null}
    </div>
  );
}

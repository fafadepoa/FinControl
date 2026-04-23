import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function UICard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-2)] shadow-[var(--fc-shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}

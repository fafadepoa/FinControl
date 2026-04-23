import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[var(--fc-surface-3)] text-[var(--fc-text-muted)]",
  success: "bg-[var(--fc-success-soft)] text-[var(--fc-success-strong)]",
  warning: "bg-[var(--fc-warning-soft)] text-[var(--fc-warning-strong)]",
  danger: "bg-[var(--fc-danger-soft)] text-[var(--fc-danger-strong)]",
};

export function UIBadge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

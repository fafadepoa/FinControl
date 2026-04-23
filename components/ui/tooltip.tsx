import type { ReactNode } from "react";

export function UITooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-40 -translate-x-1/2 rounded-md bg-[var(--fc-heading)] px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

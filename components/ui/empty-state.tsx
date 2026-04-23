import type { ReactNode } from "react";
import { UICard } from "@/components/ui/card";

export function UIEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <UICard className="p-8 text-center">
      {icon ? <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-[var(--fc-text-subtle)]">{icon}</div> : null}
      <h3 className="text-base font-semibold text-[var(--fc-heading)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--fc-text-muted)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </UICard>
  );
}

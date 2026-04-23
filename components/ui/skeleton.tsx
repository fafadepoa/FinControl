import { cn } from "@/lib/cn";

export function UISkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[var(--fc-radius-md)] bg-[var(--fc-surface-3)]", className)} />;
}

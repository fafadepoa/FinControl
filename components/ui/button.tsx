"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(180deg,var(--fc-primary),var(--fc-primary-strong))] text-white shadow-[var(--fc-shadow-sm)] hover:brightness-105",
  secondary:
    "bg-[var(--fc-surface-2)] border border-[var(--fc-border)] text-[var(--fc-text)] hover:bg-[var(--fc-surface-3)]",
  ghost: "bg-transparent text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] hover:bg-[var(--fc-surface-2)]",
  danger:
    "bg-[linear-gradient(180deg,var(--fc-danger),var(--fc-danger-strong))] text-white shadow-[var(--fc-shadow-sm)] hover:brightness-105",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function UIButton({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--fc-radius-md)] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

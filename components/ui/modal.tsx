"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function UIModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 py-8" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[var(--fc-radius-xl)] border border-[var(--fc-border)] bg-[var(--fc-surface-1)] p-5 shadow-[var(--fc-shadow-lg)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--fc-heading)]">{title}</h2>
          <button className="fc-btn-ghost" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

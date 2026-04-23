"use client";

import { Toaster } from "sonner";

export function UIToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        style: {
          borderRadius: "12px",
          border: "1px solid var(--fc-border)",
        },
      }}
    />
  );
}

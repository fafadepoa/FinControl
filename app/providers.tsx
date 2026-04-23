"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { UIToaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = window.localStorage.getItem("fc-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <SessionProvider>
      {children}
      <UIToaster />
    </SessionProvider>
  );
}

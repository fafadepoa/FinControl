import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-10 md:px-6 md:py-12">
          <div className="fc-glass mx-auto flex w-full max-w-lg items-center justify-center rounded-2xl p-12 text-sm text-[var(--fc-text-muted)]">
            Carregando…
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

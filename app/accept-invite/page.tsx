import { Suspense } from "react";
import { AcceptInviteForm } from "./accept-invite-form";

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-10">
          <div className="fc-glass mx-auto flex w-full max-w-lg items-center justify-center rounded-2xl p-12 text-sm text-[var(--fc-text-muted)]">
            Carregando…
          </div>
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}

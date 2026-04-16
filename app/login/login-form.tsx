"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { PublicAuthShell } from "@/components/public-auth-shell";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/expenses";
  const resetOk = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // #region agent log
    fetch("http://127.0.0.1:7631/ingest/ac0e6707-932b-43bc-924d-84dab4ff09fe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d38fc4" },
      body: JSON.stringify({
        sessionId: "d38fc4",
        runId: "initial",
        hypothesisId: "H1-H4",
        location: "app/login/login-form.tsx:onSubmit:start",
        message: "collaborator login submit",
        data: {
          emailPrefix: email.trim().toLowerCase().slice(0, 2),
          callbackUrl,
          route: "/login",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      requestedRole: "USER",
      redirect: false,
      callbackUrl,
    });
    // #region agent log
    fetch("http://127.0.0.1:7631/ingest/ac0e6707-932b-43bc-924d-84dab4ff09fe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d38fc4" },
      body: JSON.stringify({
        sessionId: "d38fc4",
        runId: "initial",
        hypothesisId: "H1-H5",
        location: "app/login/login-form.tsx:onSubmit:result",
        message: "collaborator login result",
        data: {
          route: "/login",
          hasError: Boolean(res?.error),
          hasUrl: Boolean(res?.url),
          errorCode: res?.error ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    window.location.href = res?.url ?? callbackUrl;
  }

  return (
    <PublicAuthShell
      badge="Colaborador"
      title="Entre com o acesso da sua empresa"
      description="Use o e-mail e a senha enviados pela sua organizacao. Se for o primeiro acesso administrativo, utilize a entrada de administrador."
      accent="collaborator"
    >
      <form onSubmit={onSubmit} className="space-y-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-6">
        {resetOk ? <p className="fc-alert-success">Senha redefinida com sucesso. Agora voce ja pode entrar.</p> : null}
        {error && <p className="fc-alert-error">{error}</p>}
        <div>
          <label className="fc-label" htmlFor="login-email">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            className="fc-input mt-1"
            placeholder="nome@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="fc-label" htmlFor="login-password">
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            className="fc-input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="fc-btn-primary mt-2 w-full py-3">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <Link href="/forgot-password" className="fc-link">
          Esqueci minha senha
        </Link>
        <Link href="/admin/login" className="fc-link">
          Acesso admin
        </Link>
      </div>
    </PublicAuthShell>
  );
}

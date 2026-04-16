"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { PublicAuthShell } from "@/components/public-auth-shell";

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
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
        location: "app/admin/login/login-form.tsx:onSubmit:start",
        message: "admin login submit",
        data: {
          emailPrefix: email.trim().toLowerCase().slice(0, 2),
          callbackUrl,
          route: "/admin/login",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      requestedRole: "ADMIN",
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
        location: "app/admin/login/login-form.tsx:onSubmit:result",
        message: "admin login result",
        data: {
          route: "/admin/login",
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
      setError("Credenciais inválidas para acesso administrativo.");
      return;
    }
    window.location.href = res?.url ?? callbackUrl;
  }

  return (
    <PublicAuthShell
      badge="Administrador"
      title="Bem-vindo ao painel administrativo"
      description="Entre com a conta administrativa para configurar empresas, vincular colaboradores e acompanhar os reembolsos."
      accent="admin"
    >
      <form onSubmit={onSubmit} className="space-y-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-6">
        {error && <p className="fc-alert-error">{error}</p>}
        <div>
          <label className="fc-label" htmlFor="admin-login-email">
            E-mail
          </label>
          <input
            id="admin-login-email"
            type="email"
            required
            autoComplete="email"
            className="fc-input mt-1"
            placeholder="admin@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="fc-label" htmlFor="admin-login-password">
            Senha
          </label>
          <input
            id="admin-login-password"
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
        <Link href="/register" className="fc-link">
          Criar conta administrativa
        </Link>
        <Link href="/forgot-password" className="fc-link">
          Esqueci minha senha
        </Link>
        <Link href="/login" className="fc-link">
          Acesso colaborador
        </Link>
      </div>
    </PublicAuthShell>
  );
}

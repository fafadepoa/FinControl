"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicAuthShell } from "@/components/public-auth-shell";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string; resetUrl?: string | null };
      setMessage(json.message ?? "Verifique seu e-mail.");
      setResetUrl(json.resetUrl ?? null);
    } catch {
      setError("Falha ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthShell
      badge="Recuperacao"
      title="Recupere o acesso da sua conta"
      description="Informe o e-mail usado no login. Se a conta existir e estiver apta para acesso, enviaremos um link para redefinir a senha."
      accent="collaborator"
    >
      <form className="space-y-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-6" onSubmit={onSubmit}>
        {error ? <p className="fc-alert-error">{error}</p> : null}
        {message ? <p className="fc-alert-success">{message}</p> : null}
        {resetUrl ? (
          <p className="text-sm break-all text-slate-600">
            Ambiente local sem e-mail configurado.{" "}
            <a href={resetUrl} className="fc-link">
              Abrir link de redefinicao
            </a>
          </p>
        ) : null}
        <div>
          <label className="fc-label" htmlFor="forgot-email">
            E-mail
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            className="fc-input mt-1"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="fc-btn-primary w-full py-3" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <p className="text-sm text-slate-500">
        Lembrou a senha?{" "}
        <Link href="/login" className="fc-link">
          Voltar ao login
        </Link>
      </p>
    </PublicAuthShell>
  );
}

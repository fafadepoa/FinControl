"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PublicAuthShell } from "@/components/public-auth-shell";

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Link inválido. Solicite um novo convite ao administrador.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Não foi possível concluir o convite.");
        return;
      }
      router.push("/login?invited=1");
    } catch {
      setError("Falha ao concluir convite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthShell
      badge="Convite"
      title="Ative seu acesso"
      description="Defina sua senha para concluir o convite e entrar como colaborador."
      accent="collaborator"
    >
      <form className="space-y-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-6" onSubmit={onSubmit}>
        {error ? <p className="fc-alert-error">{error}</p> : null}
        <div>
          <label className="fc-label" htmlFor="invite-password">
            Nova senha
          </label>
          <input
            id="invite-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="fc-input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="fc-label" htmlFor="invite-confirm">
            Confirmar senha
          </label>
          <input
            id="invite-confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="fc-input mt-1"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" className="fc-btn-primary w-full py-3" disabled={loading}>
          {loading ? "Salvando..." : "Concluir convite"}
        </button>
      </form>

      <p className="text-sm text-slate-500">
        Já tem acesso?{" "}
        <Link href="/login" className="fc-link">
          Ir para login
        </Link>
      </p>
    </PublicAuthShell>
  );
}

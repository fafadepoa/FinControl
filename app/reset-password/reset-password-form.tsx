"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicAuthShell } from "@/components/public-auth-shell";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Link inválido. Solicite nova recuperação de senha.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Falha ao redefinir senha.");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("Falha ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthShell
      badge="Nova senha"
      title="Defina uma nova senha"
      description="Escolha uma senha forte para voltar a acessar o FinControl com seguranca."
      accent="collaborator"
    >
      <form className="space-y-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-6" onSubmit={onSubmit}>
        {error ? <p className="fc-alert-error">{error}</p> : null}
        <div>
          <label className="fc-label" htmlFor="reset-password">
            Nova senha
          </label>
          <input
            id="reset-password"
            type="password"
            required
            minLength={6}
            className="fc-input mt-1"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="fc-label" htmlFor="reset-confirm">
            Confirmar senha
          </label>
          <input
            id="reset-confirm"
            type="password"
            required
            minLength={6}
            className="fc-input mt-1"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" className="fc-btn-primary w-full py-3" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>

      <p className="text-sm text-slate-500">
        Quer voltar?{" "}
        <Link href="/login" className="fc-link">
          Ir para o login
        </Link>
      </p>
    </PublicAuthShell>
  );
}

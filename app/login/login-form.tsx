"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { PublicAuthShell } from "@/components/public-auth-shell";
import { UIInput } from "@/components/ui/input";
import { UIButton } from "@/components/ui/button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/expenses";
  const resetOk = searchParams.get("reset") === "1";
  const invitedOk = searchParams.get("invited") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      requestedRole: "USER",
      redirect: false,
      callbackUrl,
    });
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
      <form onSubmit={onSubmit} className="space-y-4 rounded-[1.5rem] border border-[var(--fc-border)] bg-[var(--fc-surface-2)] p-6">
        {resetOk ? <p className="fc-alert-success">Senha redefinida com sucesso. Agora voce ja pode entrar.</p> : null}
        {invitedOk ? <p className="fc-alert-success">Convite concluido. Agora voce ja pode entrar.</p> : null}
        {error && <p className="fc-alert-error">{error}</p>}
        <div>
          <label className="fc-label" htmlFor="login-email">
            E-mail
          </label>
          <UIInput
            id="login-email"
            type="email"
            required
            autoComplete="email"
            className="mt-1"
            placeholder="nome@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
          />
        </div>
        <div>
          <label className="fc-label" htmlFor="login-password">
            Senha
          </label>
          <UIInput
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-[var(--fc-text-subtle)] hover:text-[var(--fc-text)]"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </div>
        <UIButton type="submit" disabled={loading} className="mt-2 w-full" size="lg">
          {loading ? "Entrando..." : "Entrar"}
        </UIButton>
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

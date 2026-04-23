"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { PublicAuthShell } from "@/components/public-auth-shell";
import { UIButton } from "@/components/ui/button";
import { UIInput } from "@/components/ui/input";

function adminLoginMessage(code: string | undefined): string {
  switch (code) {
    case "email_not_verified":
      return "Confirme o e-mail pelo link enviado (ou pela pagina de registo) antes de entrar.";
    case "rate_limited":
      return "Muitas tentativas seguidas. Aguarde cerca de 15 minutos e tente de novo.";
    case "role_mismatch":
      return "Este usuario nao tem perfil administrativo. Use a entrada de colaborador se for o caso.";
    default:
      return "Credenciais inválidas para acesso administrativo.";
  }
}

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
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
      requestedRole: "ADMIN",
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError(adminLoginMessage(typeof res.code === "string" ? res.code : undefined));
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
      <form onSubmit={onSubmit} className="space-y-4 rounded-[1.5rem] border border-[var(--fc-border)] bg-[var(--fc-surface-2)] p-6">
        {error && <p className="fc-alert-error">{error}</p>}
        <div>
          <label className="fc-label" htmlFor="admin-login-email">
            E-mail
          </label>
          <UIInput
            id="admin-login-email"
            type="email"
            required
            autoComplete="email"
            className="mt-1"
            placeholder="admin@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
          />
        </div>
        <div>
          <label className="fc-label" htmlFor="admin-login-password">
            Senha
          </label>
          <UIInput
            id="admin-login-password"
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

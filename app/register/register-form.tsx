"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicAuthShell } from "@/components/public-auth-shell";

type RoleOption = "USER" | "ADMIN";

export function RegisterForm() {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<RoleOption>("ADMIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setVerifyUrl(null);
    if (role !== "ADMIN") {
      setError("O cadastro publico esta disponivel apenas para administradores.");
      return;
    }
    if (!companyName.trim()) {
      setError("Informe o nome da empresa.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role,
          companyName: companyName.trim(),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; verifyUrl?: string | null };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Falha ao criar conta.");
      } else {
        setSuccess(
          json.verifyUrl
            ? "Conta criada. Como o envio de e-mail nao esta configurado neste ambiente, use o link abaixo para ativar."
            : "Conta criada. Verifique seu e-mail para concluir a ativacao.",
        );
        setVerifyUrl(json.verifyUrl ?? null);
      }
    } catch {
      setError("Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthShell
      badge="Cadastro"
      title="Crie sua conta no FinControl"
      description="Escolha o perfil correto para o primeiro acesso. Administradores configuram a empresa; colaboradores entram apenas com o acesso enviado pela organizacao."
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Selecione o tipo de acesso:</p>
          <div className="flex flex-wrap gap-6">
            <label className="fc-public-choice">
              <input
                type="radio"
                name="role"
                value="ADMIN"
                checked={role === "ADMIN"}
                onChange={() => setRole("ADMIN")}
                className="fc-public-radio"
              />
              Administrador
            </label>
            <label className="fc-public-choice">
              <input
                type="radio"
                name="role"
                value="USER"
                checked={role === "USER"}
                onChange={() => setRole("USER")}
                className="fc-public-radio"
              />
              Colaborador
            </label>
          </div>
        </div>

        {role === "ADMIN" ? (
          <form className="space-y-4" onSubmit={onSubmit}>
            {error ? <p className="fc-alert-error">{error}</p> : null}
            {success ? <p className="fc-alert-success">{success}</p> : null}
            {verifyUrl ? (
              <p className="text-sm break-all text-slate-600">
                Ambiente local sem e-mail configurado.{" "}
                <a href={verifyUrl} className="fc-link">
                  Abrir link de verificacao
                </a>
              </p>
            ) : null}

            <div>
              <label className="fc-label" htmlFor="register-company">
                Qual o nome da sua empresa?
              </label>
              <input
                id="register-company"
                required
                className="fc-input mt-1"
                placeholder="Ex.: FinControl Labs"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="fc-label" htmlFor="register-name">
                Nome e sobrenome
              </label>
              <input
                id="register-name"
                className="fc-input mt-1"
                placeholder="Ex.: Maria da Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <p className="mt-2 text-xs text-slate-400">
                Este campo e apenas de apresentacao por enquanto e nao bloqueia o cadastro.
              </p>
            </div>

            <div>
              <label className="fc-label" htmlFor="register-email">
                Seu e-mail
              </label>
              <input
                id="register-email"
                type="email"
                required
                className="fc-input mt-1"
                autoComplete="email"
                placeholder="nome@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="fc-label" htmlFor="register-password">
                Crie uma senha
              </label>
              <input
                id="register-password"
                type="password"
                required
                minLength={6}
                className="fc-input mt-1"
                autoComplete="new-password"
                placeholder="Letras, numeros e caracteres especiais"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="fc-label" htmlFor="register-password-confirm">
                Confirmar senha
              </label>
              <input
                id="register-password-confirm"
                type="password"
                required
                minLength={6}
                className="fc-input mt-1"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button className="fc-btn-primary w-full py-3" type="submit" disabled={loading}>
              {loading ? "Criando conta..." : "Registrar gratis"}
            </button>
          </form>
        ) : (
          <div className="fc-public-note fc-public-note-warning space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Atencao</p>
              <p className="text-sm leading-6">
                Somente administradores podem efetuar o cadastro inicial da empresa no FinControl.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Voce esta acessando como colaborador?</p>
              <p className="text-sm leading-6">
                Use o login que a sua empresa enviou. Se ainda nao recebeu acesso, fale com o responsavel pelo
                ambiente da sua organizacao.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/login" className="fc-btn-primary">
                Fazer login como colaborador
              </Link>
              <Link href="/admin/login" className="fc-btn-secondary">
                Sou admin
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-slate-500">
          Voce ja tem uma conta?{" "}
          <Link href={role === "ADMIN" ? "/admin/login" : "/login"} className="fc-link">
            Fazer login
          </Link>
        </p>
      </div>
    </PublicAuthShell>
  );
}

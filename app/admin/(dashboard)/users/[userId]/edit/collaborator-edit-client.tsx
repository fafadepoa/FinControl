"use client";

import Link from "next/link";
import { useState } from "react";
import { updateCollaboratorCompaniesForm, updateCollaboratorDetailsForm } from "@/lib/actions/users";

type Company = { id: string; name: string };

export function CollaboratorEditClient(props: {
  userId: string;
  displayName: string;
  email: string;
  linkedCompanyIds: string[];
  companies: Company[];
  listHref: string;
}) {
  const [tab, setTab] = useState<"dados" | "empresas">("dados");

  return (
    <div className="fc-glass mx-auto max-w-2xl overflow-hidden rounded-2xl p-0 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-fc-heading">Editar colaborador</h1>
        <Link href={props.listHref} className="fc-link text-sm font-medium">
          Voltar à lista
        </Link>
      </div>
      <div className="flex gap-0 border-b border-slate-200/80 px-2">
        <button
          type="button"
          onClick={() => setTab("dados")}
          className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
            tab === "dados"
              ? "text-[var(--fc-cyan)] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--fc-cyan)]"
              : "text-[var(--fc-text-muted)] hover:text-fc-heading"
          }`}
        >
          Dados pessoais
        </button>
        <button
          type="button"
          onClick={() => setTab("empresas")}
          className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
            tab === "empresas"
              ? "text-[var(--fc-cyan)] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--fc-cyan)]"
              : "text-[var(--fc-text-muted)] hover:text-fc-heading"
          }`}
        >
          Empresas
        </button>
      </div>

      <div className="p-5 md:p-6">
        {tab === "dados" ? (
          <form action={updateCollaboratorDetailsForm} className="space-y-4">
            <input type="hidden" name="userId" value={props.userId} />
            <div>
              <label className="fc-label text-xs" htmlFor="edit-displayName">
                Nome *
              </label>
              <input
                id="edit-displayName"
                name="displayName"
                required
                minLength={2}
                defaultValue={props.displayName}
                className="fc-input mt-1 w-full"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="fc-label text-xs" htmlFor="edit-email">
                E-mail *
              </label>
              <input
                id="edit-email"
                name="email"
                type="email"
                required
                defaultValue={props.email}
                className="fc-input mt-1 w-full"
              />
            </div>
            <div>
              <p className="fc-label text-xs">Perfil</p>
              <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Colaborador
              </p>
            </div>
            <p className="text-xs text-[var(--fc-text-muted)]">
              Para alterar a senha, o colaborador pode usar &quot;Esqueci minha senha&quot; no login.
            </p>
            <button type="submit" className="fc-btn-primary">
              Salvar
            </button>
          </form>
        ) : (
          <form action={updateCollaboratorCompaniesForm} className="space-y-4">
            <input type="hidden" name="userId" value={props.userId} />
            <p className="text-sm text-[var(--fc-text-muted)]">
              Marque as empresas (centros de custo) às quais este colaborador pode vincular despesas.
            </p>
            {props.companies.length === 0 ? (
              <p className="text-sm text-amber-700">Cadastre uma empresa antes.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {props.companies.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-fc-heading">
                    <input
                      type="checkbox"
                      name="companyIds"
                      value={c.id}
                      defaultChecked={props.linkedCompanyIds.includes(c.id)}
                      className="fc-checkbox"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
            <button type="submit" className="fc-btn-primary" disabled={props.companies.length === 0}>
              Salvar empresas
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

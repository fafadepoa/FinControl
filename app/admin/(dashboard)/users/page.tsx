import Link from "next/link";
import {
  createUserForm,
  getCollaboratorStats,
  listUsers,
  setUserActiveForm,
  setUserCreditBalanceVisibilityForm,
} from "@/lib/actions/users";
import { listCompanies } from "@/lib/actions/companies";

function rowLabel(displayName: string | null, email: string) {
  const n = displayName?.trim();
  if (n) return n;
  return email.split("@")[0] || email;
}

function buildListQuery(sp: { email?: string; active?: string; nome?: string }) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.email?.trim()) qs.set("email", sp.email.trim());
  if (sp.active === "true" || sp.active === "false") qs.set("active", sp.active);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function buildCreateHref(sp: { email?: string; active?: string; nome?: string }) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.email?.trim()) qs.set("email", sp.email.trim());
  if (sp.active === "true" || sp.active === "false") qs.set("active", sp.active);
  qs.set("criar", "1");
  return `/admin/users?${qs.toString()}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; active?: string; criar?: string; nome?: string; created?: string; inviteUrl?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email;
  const nome = sp.nome;
  const active =
    sp.active === "true" ? true : sp.active === "false" ? false : undefined;
  const showCreateForm = sp.criar === "1" || sp.criar === "true";
  const created = sp.created === "1";
  const inviteUrl = sp.inviteUrl?.trim() || null;

  const [rows, companies, stats] = await Promise.all([
    listUsers({
      email: email || undefined,
      name: nome || undefined,
      active,
    }),
    listCompanies(),
    getCollaboratorStats(),
  ]);

  const listHref = `/admin/users${buildListQuery(sp)}`;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="fc-soft-heading text-xs uppercase tracking-[0.2em] text-[var(--fc-text-muted)]">
            Usuários
          </p>
          <h1 className="fc-page-title">Colaboradores</h1>
          <p className="fc-page-sub">
            Contas com perfil <strong>colaborador</strong> (login em /login). O administrador não aparece nesta lista.
          </p>
        </div>
        {showCreateForm ? (
          <Link href={listHref} className="fc-btn-secondary fc-btn-sm shrink-0 self-start">
            Voltar à lista
          </Link>
        ) : (
          <Link href={buildCreateHref(sp)} className="fc-btn-primary fc-btn-sm shrink-0 self-start">
            + Adicionar
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="fc-section-card p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-muted)]">Cadastrados</p>
          <p className="mt-1 text-2xl font-bold text-fc-heading">{stats.total}</p>
        </div>
        <div className="fc-section-card p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-muted)]">Ativos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.active}</p>
        </div>
        <div className="fc-section-card p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-muted)]">Inativos</p>
          <p className="mt-1 text-2xl font-bold text-slate-600">{stats.inactive}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fc-heading">Lista completa</h2>
        <form method="get" className="fc-glass flex flex-wrap items-end gap-3 p-4">
          {showCreateForm ? <input type="hidden" name="criar" value="1" /> : null}
          <div>
            <label className="fc-label text-xs">Nome</label>
            <input
              name="nome"
              defaultValue={nome ?? ""}
              className="fc-input mt-1 min-w-[10rem]"
              placeholder="Buscar"
            />
          </div>
          <div>
            <label className="fc-label text-xs">E-mail</label>
            <input
              name="email"
              defaultValue={email ?? ""}
              className="fc-input mt-1 min-w-[12rem]"
              placeholder="Filtrar"
            />
          </div>
          <div>
            <label className="fc-label text-xs">Situação</label>
            <select name="active" defaultValue={sp.active ?? ""} className="fc-input mt-1 min-w-[8rem]">
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
          <button type="submit" className="fc-btn-secondary">
            Filtrar
          </button>
        </form>
      </div>

      {showCreateForm ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="fc-glass-strong w-full max-w-3xl rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-fc-heading">Novo colaborador</h2>
                <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
                  Perfil <strong>USER</strong>, sem senha inicial. O colaborador ativa o acesso pelo link recebido por e-mail.
                </p>
              </div>
              <Link
                href={listHref}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg text-[var(--fc-text-muted)] hover:bg-[var(--fc-surface-3)] hover:text-[var(--fc-heading)]"
                aria-label="Fechar modal"
                title="Fechar"
              >
                ×
              </Link>
            </div>

            {created ? (
              <div className="mt-3 rounded-xl border border-emerald-300/70 bg-emerald-50 p-3 text-sm text-emerald-900">
                Convite criado com sucesso.
                {inviteUrl ? (
                  <>
                    {" "}
                    Link de teste:{" "}
                    <a className="fc-link break-all" href={inviteUrl}>
                      {inviteUrl}
                    </a>
                  </>
                ) : (
                  " O colaborador deve usar o link enviado por e-mail."
                )}
              </div>
            ) : null}

            <form action={createUserForm} className="mt-4 space-y-4" autoComplete="off">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="fc-label text-xs">Nome completo *</label>
                  <input
                    name="displayName"
                    required
                    minLength={2}
                    className="fc-input mt-1 w-full"
                    placeholder="Ex.: Maria Silva"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="fc-label text-xs">E-mail *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="fc-input mt-1 w-full"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <p className="fc-label text-xs">Empresas (centro de custo) *</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  {companies.length === 0 ? (
                    <p className="text-sm text-[var(--fc-text-muted)]">
                      Cadastre uma empresa antes (menu Empresas → Cadastro da empresa).
                    </p>
                  ) : (
                    companies.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-fc-heading">
                        <input type="checkbox" name="companyIds" value={c.id} className="fc-checkbox" />
                        {c.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" className="fc-btn-primary" disabled={companies.length === 0}>
                  Cadastrar
                </button>
                <Link href={listHref} className="fc-btn-secondary">
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="fc-glass fc-table-shell overflow-hidden p-0">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs text-[var(--fc-text-muted)]">
            {rows.length === 0
              ? "Nenhum resultado para os filtros atuais."
              : `${rows.length} resultado(s) com os filtros atuais.`}
          </p>
        </div>
        <table className="min-w-[960px]">
          <thead className="fc-glass-table-head">
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Empresas</th>
              <th>Perfil</th>
              <th>Situação</th>
              <th>Ver saldo</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--fc-text-muted)]">
                  Sem registos.{" "}
                  <Link href={buildCreateHref(sp)} className="fc-link">
                    Adicionar colaborador
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-fc-heading">{rowLabel(u.displayName, u.email)}</td>
                  <td className="text-[var(--fc-text-muted)]">{u.email}</td>
                  <td className="max-w-[200px] truncate text-sm text-[var(--fc-text-muted)]">
                    {u.userCompanies.map((x) => x.company.name).join(", ") || "—"}
                  </td>
                  <td>
                    <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-900">
                      Colaborador
                    </span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.active ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <form action={setUserCreditBalanceVisibilityForm} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-fc-heading">
                        <input
                          type="checkbox"
                          name="creditBalanceVisibleToSelf"
                          defaultChecked={u.creditBalanceVisibleToSelf}
                          className="fc-checkbox"
                        />
                        Exibir
                      </label>
                      <button type="submit" className="fc-btn-ghost text-xs">
                        OK
                      </button>
                    </form>
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link href={`/admin/users/${u.id}/edit`} className="fc-link text-xs font-medium">
                        Editar
                      </Link>
                      {u.active ? (
                        <form action={setUserActiveForm} className="inline">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="active" value="false" />
                          <button type="submit" className="fc-btn-ghost text-xs text-red-600 hover:text-red-700">
                            Inativar
                          </button>
                        </form>
                      ) : (
                        <form action={setUserActiveForm} className="inline">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="active" value="true" />
                          <button type="submit" className="fc-btn-ghost text-xs">
                            Reativar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import {
  createCompanyForm,
  deleteCompanyForm,
  listCompanies,
  updateCompanyForm,
} from "@/lib/actions/companies";
import Link from "next/link";

function buildListQuery(sp: { nome?: string; cnpj?: string }) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.cnpj?.trim()) qs.set("cnpj", sp.cnpj.trim());
  const str = qs.toString();
  return str ? `?${str}` : "";
}

function buildCreateHref(sp: { nome?: string; cnpj?: string }) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.cnpj?.trim()) qs.set("cnpj", sp.cnpj.trim());
  qs.set("criar", "1");
  return `/admin/companies?${qs.toString()}`;
}

function buildEditHref(sp: { nome?: string; cnpj?: string }, companyId: string) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.cnpj?.trim()) qs.set("cnpj", sp.cnpj.trim());
  qs.set("editar", companyId);
  return `/admin/companies?${qs.toString()}`;
}

function buildDeleteHref(sp: { nome?: string; cnpj?: string }, companyId: string) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.cnpj?.trim()) qs.set("cnpj", sp.cnpj.trim());
  qs.set("excluir", companyId);
  return `/admin/companies?${qs.toString()}`;
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string; nome?: string; cnpj?: string; editar?: string; excluir?: string }>;
}) {
  const sp = await searchParams;
  const showCreateForm = sp.criar === "1" || sp.criar === "true";
  const rows = await listCompanies({ name: sp.nome, cnpj: sp.cnpj });
  const listHref = `/admin/companies${buildListQuery(sp)}`;
  const editingCompany = sp.editar ? rows.find((c) => c.id === sp.editar) ?? null : null;
  const deletingCompany = sp.excluir ? rows.find((c) => c.id === sp.excluir) ?? null : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="fc-page-title">Empresas</h1>
          <p className="fc-page-sub">Nome obrigatório; CNPJ e telefone opcionais.</p>
        </div>
        {showCreateForm ? (
          <Link href={listHref} className="fc-btn-secondary fc-btn-sm shrink-0 self-start">
            Voltar à lista
          </Link>
        ) : (
          <Link href={buildCreateHref(sp)} className="fc-btn-primary fc-btn-sm shrink-0 self-start">
            + Nova empresa
          </Link>
        )}
      </div>

      {showCreateForm ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="fc-glass-strong w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-fc-heading">Nova empresa</h2>
                <p className="mt-1 text-xs text-[var(--fc-text-muted)]">Preencha os dados da empresa para cadastrar.</p>
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
            <form action={createCompanyForm} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="fc-label text-xs">Nome *</label>
                <input name="name" required className="fc-input mt-1" />
              </div>
              <div>
                <label className="fc-label text-xs">CNPJ</label>
                <input name="cnpj" className="fc-input mt-1" />
              </div>
              <div>
                <label className="fc-label text-xs">Telefone</label>
                <input name="phone" className="fc-input mt-1" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <button type="submit" className="fc-btn-primary">
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

      {editingCompany ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="fc-glass-strong w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-fc-heading">Editar empresa</h2>
                <p className="mt-1 text-xs text-[var(--fc-text-muted)]">Atualize os dados cadastrais da empresa.</p>
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
            <form action={updateCompanyForm} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={editingCompany.id} />
              <div className="sm:col-span-2">
                <label className="fc-label text-xs">Nome *</label>
                <input name="name" defaultValue={editingCompany.name} required className="fc-input mt-1" />
              </div>
              <div>
                <label className="fc-label text-xs">CNPJ</label>
                <input name="cnpj" defaultValue={editingCompany.cnpj ?? ""} className="fc-input mt-1" />
              </div>
              <div>
                <label className="fc-label text-xs">Telefone</label>
                <input name="phone" defaultValue={editingCompany.phone ?? ""} className="fc-input mt-1" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <button type="submit" className="fc-btn-primary">
                  Salvar
                </button>
                <Link href={listHref} className="fc-btn-secondary">
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingCompany ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4">
          <div className="fc-glass-strong w-full max-w-md rounded-2xl p-5 shadow-2xl">
            <h2 className="text-base font-semibold text-fc-heading">Confirmar exclusão</h2>
            <p className="mt-2 text-sm text-[var(--fc-text-muted)]">
              Deseja realmente excluir a empresa <strong>{deletingCompany.name}</strong>?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Link href={listHref} className="fc-btn-secondary">
                Cancelar
              </Link>
              <form action={deleteCompanyForm}>
                <input type="hidden" name="id" value={deletingCompany.id} />
                <button type="submit" className="fc-btn-danger">
                  Excluir
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fc-heading">Empresas cadastradas</h2>
        <form method="get" className="fc-glass flex flex-wrap items-end gap-3 p-4">
          {showCreateForm ? <input type="hidden" name="criar" value="1" /> : null}
          <div>
            <label className="fc-label text-xs">Nome</label>
            <input
              name="nome"
              defaultValue={sp.nome ?? ""}
              className="fc-input mt-1 min-w-[12rem]"
              placeholder="Filtrar por nome"
            />
          </div>
          <div>
            <label className="fc-label text-xs">CNPJ</label>
            <input
              name="cnpj"
              defaultValue={sp.cnpj ?? ""}
              className="fc-input mt-1 min-w-[12rem]"
              placeholder="Filtrar por CNPJ"
            />
          </div>
          <button type="submit" className="fc-btn-secondary">
            Filtrar
          </button>
        </form>
      </div>

      <div className="fc-glass fc-table-shell overflow-hidden p-0">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs text-[var(--fc-text-muted)]">
            {rows.length === 0
              ? "Nenhuma empresa para os filtros atuais."
              : `${rows.length} empresa(s) encontrada(s).`}
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--fc-text-muted)]">
            Sem registros.{" "}
            <Link href={buildCreateHref(sp)} className="fc-link">
              Cadastrar empresa
            </Link>
          </div>
        ) : (
          <table className="min-w-[900px]">
            <thead className="fc-glass-table-head">
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Telefone</th>
                <th>Acesso</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="text-[var(--fc-text-muted)]">{c.id.slice(-5).toUpperCase()}</td>
                <td className="font-medium text-fc-heading">{c.name}</td>
                <td className="text-[var(--fc-text-muted)]">{c.cnpj || "—"}</td>
                <td className="text-[var(--fc-text-muted)]">{c.phone || "—"}</td>
                <td className="text-[var(--fc-text-muted)]">{c._count.userCompanies > 0 ? "RESTRITO" : "TODOS"}</td>
                <td className="text-emerald-700">ATIVO</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={buildEditHref(sp, c.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--fc-text-muted)] hover:bg-[var(--fc-surface-3)] hover:text-[var(--fc-heading)]"
                      title="Editar"
                      aria-label={`Editar ${c.name}`}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </Link>
                    <Link
                      href={buildDeleteHref(sp, c.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                      aria-label={`Excluir ${c.name}`}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

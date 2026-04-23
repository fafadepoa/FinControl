import {
  linkUsersBatchForm,
  listCostCenterMatrix,
  listUsersForLink,
  unlinkUserForm,
} from "@/lib/actions/cost-centers";
import Link from "next/link";

type PageSP = {
  nome?: string;
  cnpj?: string;
  colaborador?: string;
  abrir?: string;
};

function buildListQuery(sp: PageSP) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.cnpj?.trim()) qs.set("cnpj", sp.cnpj.trim());
  if (sp.colaborador?.trim()) qs.set("colaborador", sp.colaborador.trim());
  const str = qs.toString();
  return str ? `?${str}` : "";
}

function buildOpenHref(sp: PageSP, companyId: string) {
  const qs = new URLSearchParams();
  if (sp.nome?.trim()) qs.set("nome", sp.nome.trim());
  if (sp.cnpj?.trim()) qs.set("cnpj", sp.cnpj.trim());
  if (sp.colaborador?.trim()) qs.set("colaborador", sp.colaborador.trim());
  qs.set("abrir", companyId);
  return `/admin/cost-centers?${qs.toString()}`;
}

export default async function CostCentersPage({
  searchParams,
}: {
  searchParams: Promise<PageSP>;
}) {
  const sp = await searchParams;
  const [matrix, users] = await Promise.all([listCostCenterMatrix(), listUsersForLink()]);
  const nome = sp.nome?.trim().toLowerCase() ?? "";
  const cnpj = sp.cnpj?.trim().toLowerCase() ?? "";
  const colaborador = sp.colaborador?.trim().toLowerCase() ?? "";
  const rows = matrix.filter((c) => {
    const okNome = !nome || c.name.toLowerCase().includes(nome);
    const okCnpj = !cnpj || (c.cnpj ?? "").toLowerCase().includes(cnpj);
    const okColaborador =
      !colaborador ||
      c.userCompanies.some((uc) => uc.user.email.toLowerCase().includes(colaborador));
    return okNome && okCnpj && okColaborador;
  });
  const listHref = `/admin/cost-centers${buildListQuery(sp)}`;
  const selected = sp.abrir ? matrix.find((c) => c.id === sp.abrir) ?? null : null;
  const linkedUserIds = selected ? new Set(selected.userCompanies.map((uc) => uc.userId)) : null;
  const availableUsers = selected ? users.filter((u) => !linkedUserIds?.has(u.id)) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="fc-page-title">Centros de custo</h1>
        <p className="fc-page-sub">
          Cada empresa cadastrada e um centro de custo. Vincule colaboradores as empresas para liberar o
          lancamento de despesas.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fc-heading">Filtros</h2>
        <form method="get" className="fc-glass flex flex-wrap items-end gap-3 p-4">
          {sp.abrir ? <input type="hidden" name="abrir" value={sp.abrir} /> : null}
          <div>
            <label className="fc-label text-xs">Centro de custo</label>
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
              className="fc-input mt-1 min-w-[10rem]"
              placeholder="Filtrar por CNPJ"
            />
          </div>
          <div>
            <label className="fc-label text-xs">Colaborador</label>
            <input
              name="colaborador"
              defaultValue={sp.colaborador ?? ""}
              className="fc-input mt-1 min-w-[12rem]"
              placeholder="E-mail do colaborador"
            />
          </div>
          <button type="submit" className="fc-btn-secondary">
            Filtrar
          </button>
        </form>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="fc-glass-strong w-full max-w-3xl rounded-2xl border border-[var(--fc-border)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-muted)]">Centro de custo</p>
                <h2 className="text-lg font-semibold text-fc-heading">{selected.name}</h2>
                <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
                  {selected.cnpj ? `CNPJ ${selected.cnpj}` : ""}
                  {selected.cnpj && selected.phone ? " · " : ""}
                  {selected.phone ? `Tel. ${selected.phone}` : ""}
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

            <div className="mt-4">
              <h3 className="text-sm font-medium text-fc-cyan">Colaboradores vinculados</h3>
              {selected.userCompanies.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--fc-text-muted)]">Nenhum colaborador vinculado.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {selected.userCompanies.map((uc) => (
                    <li
                      key={uc.userId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface-2)] px-3 py-2"
                    >
                      <span className="text-fc-heading">
                        {uc.user.email}{" "}
                        {!uc.user.active && (
                          <span className="text-xs text-amber-300">(inativo)</span>
                        )}
                      </span>
                      <form action={unlinkUserForm}>
                        <input type="hidden" name="userId" value={uc.userId} />
                        <input type="hidden" name="companyId" value={selected.id} />
                        <button
                          type="submit"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-600"
                          title="Remover vínculo"
                          aria-label={`Remover ${uc.user.email}`}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              action={linkUsersBatchForm}
              className="mt-4 space-y-3 border-t border-[rgba(174,225,223,0.12)] pt-4"
            >
              <input type="hidden" name="companyId" value={selected.id} />
              <div className="space-y-2">
                <label className="fc-label text-xs">Adicionar colaborador</label>
                <details className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-2)]">
                  <summary className="cursor-pointer list-none px-3 py-2 text-sm text-[var(--fc-text-muted)]">
                    Selecionar colaboradores (múltiplo)
                  </summary>
                  <div className="max-h-44 space-y-2 overflow-auto border-t border-[var(--fc-border)] px-3 py-2">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-[var(--fc-text-muted)]">Todos os colaboradores já estão vinculados.</p>
                    ) : (
                      availableUsers.map((u) => (
                        <label key={u.id} className="flex items-center gap-2 text-sm text-fc-heading">
                          <input type="checkbox" name="userIds" value={u.id} className="fc-checkbox" />
                          <span>
                            {u.email}
                            {!u.active ? " (inativo)" : ""}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </details>
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" className="fc-btn-primary fc-btn-sm" disabled={availableUsers.length === 0}>
                  Vincular selecionados
                </button>
                <Link href={listHref} className="fc-btn-secondary fc-btn-sm">
                  Fechar
                </Link>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {matrix.length === 0 ? (
          <p className="text-[var(--fc-text-muted)]">Cadastre empresas em Empresas no menu.</p>
        ) : rows.length === 0 ? (
          <div className="fc-glass px-4 py-8 text-center text-sm text-[var(--fc-text-muted)]">
            Nenhum centro de custo encontrado para os filtros atuais.
          </div>
        ) : (
          <div className="fc-glass fc-table-shell overflow-hidden p-0">
            <table className="min-w-[860px]">
              <thead className="fc-glass-table-head">
                <tr>
                  <th>Centro de custo</th>
                  <th>CNPJ</th>
                  <th>Telefone</th>
                  <th>Colaboradores</th>
                  <th>Total vínculos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="cursor-pointer">
                    <td className="p-0">
                      <Link href={buildOpenHref(sp, c.id)} className="block px-4 py-3 font-medium text-fc-heading">
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={buildOpenHref(sp, c.id)} className="block px-4 py-3 text-[var(--fc-text-muted)]">
                        {c.cnpj || "—"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={buildOpenHref(sp, c.id)} className="block px-4 py-3 text-[var(--fc-text-muted)]">
                        {c.phone || "—"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link
                        href={buildOpenHref(sp, c.id)}
                        className="block max-w-[320px] truncate px-4 py-3 text-sm text-[var(--fc-text-muted)]"
                      >
                        {c.userCompanies.length === 0
                          ? "Sem vínculos"
                          : c.userCompanies.map((uc) => uc.user.email).join(", ")}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={buildOpenHref(sp, c.id)} className="block px-4 py-3">
                        {c.userCompanies.length}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

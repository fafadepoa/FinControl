import {
  linkUserForm,
  listCostCenterMatrix,
  listUsersForLink,
  unlinkUserForm,
} from "@/lib/actions/cost-centers";

export default async function CostCentersPage() {
  const [matrix, users] = await Promise.all([listCostCenterMatrix(), listUsersForLink()]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="fc-page-title">Centros de custo</h1>
        <p className="fc-page-sub">
          Cada empresa cadastrada e um centro de custo. Vincule colaboradores as empresas para liberar o
          lancamento de despesas.
        </p>
      </div>

      <div className="space-y-6">
        {matrix.length === 0 ? (
          <p className="text-[var(--fc-text-muted)]">Cadastre empresas em Empresas no menu.</p>
        ) : (
          matrix.map((c) => (
            <section key={c.id} className="fc-glass p-6">
              <h2 className="text-lg font-semibold text-fc-heading">{c.name}</h2>
              <p className="text-xs text-[var(--fc-text-muted)]">
                {c.cnpj && `CNPJ ${c.cnpj}`}
                {c.cnpj && c.phone ? " · " : ""}
                {c.phone && `Tel. ${c.phone}`}
              </p>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-fc-cyan">Colaboradores vinculados</h3>
                {c.userCompanies.length === 0 ? (
                  <p className="mt-1 text-sm text-[var(--fc-text-muted)]">Nenhum colaborador vinculado.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {c.userCompanies.map((uc) => (
                      <li key={uc.userId} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-fc-heading">
                          {uc.user.email}{" "}
                          {!uc.user.active && (
                            <span className="text-xs text-amber-300">(inativo)</span>
                          )}
                        </span>
                        <form action={unlinkUserForm}>
                          <input type="hidden" name="userId" value={uc.userId} />
                          <input type="hidden" name="companyId" value={c.id} />
                          <button type="submit" className="fc-btn-ghost text-xs text-red-300">
                            Remover
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form
                action={linkUserForm}
                className="mt-4 flex flex-wrap items-end gap-3 border-t border-[rgba(174,225,223,0.12)] pt-4"
              >
                <input type="hidden" name="companyId" value={c.id} />
                <div>
                  <label className="fc-label text-xs">Adicionar colaborador</label>
                  <select name="userId" required className="fc-input mt-1 min-w-[14rem]">
                    <option value="">Selecione…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email}
                        {!u.active ? " (inativo)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="fc-btn-primary fc-btn-sm">
                  Vincular
                </button>
              </form>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

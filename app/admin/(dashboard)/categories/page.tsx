import {
  createCategoryForm,
  listCategories,
  updateCategoryForm,
} from "@/lib/actions/categories";
import { listCompanies } from "@/lib/actions/companies";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; companyId?: string; active?: string }>;
}) {
  const sp = await searchParams;
  const name = sp.name;
  const companyId = sp.companyId;
  const active =
    sp.active === "true" ? true : sp.active === "false" ? false : undefined;

  const [rows, companies] = await Promise.all([
    listCategories({
      name: name || undefined,
      companyId: companyId || undefined,
      active,
    }),
    listCompanies(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="fc-page-title">Categorias</h1>
        <p className="fc-page-sub">
          Limite opcional; ao ultrapassar, o colaborador vê apenas um alerta e pode enviar mesmo assim.
        </p>
      </div>

      <form method="get" className="fc-glass flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="fc-label text-xs">Nome</label>
          <input
            name="name"
            defaultValue={name ?? ""}
            className="fc-input mt-1 min-w-[10rem]"
            placeholder="Buscar"
          />
        </div>
        <div>
          <label className="fc-label text-xs">Empresa</label>
          <select name="companyId" defaultValue={companyId ?? ""} className="fc-input mt-1 min-w-[10rem]">
            <option value="">Todas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fc-label text-xs">Status</label>
          <select name="active" defaultValue={sp.active ?? ""} className="fc-input mt-1 min-w-[8rem]">
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
        <button type="submit" className="fc-btn-secondary">
          Filtrar
        </button>
      </form>

      <div className="fc-glass p-6">
        <h2 className="text-sm font-semibold text-fc-heading">Nova categoria</h2>
        <form action={createCategoryForm} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="fc-label text-xs">Empresa *</label>
            <select name="companyId" required className="fc-input mt-1">
              <option value="">Selecione…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fc-label text-xs">Nome *</label>
            <input name="name" required className="fc-input mt-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="fc-label text-xs">Limite (R$) — vazio = sem limite</label>
            <input
              name="limitAmount"
              className="fc-input mt-1 max-w-xs"
              placeholder="Ex: 200 ou 50,00"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="fc-btn-primary">
              Adicionar categoria
            </button>
          </div>
        </form>
      </div>

      <div className="fc-glass fc-table-shell overflow-hidden p-0">
        <table className="min-w-[720px]">
          <thead className="fc-glass-table-head">
            <tr>
              <th>Empresa</th>
              <th>Nome</th>
              <th>Limite</th>
              <th>Ativo</th>
              <th>Salvar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((cat) => (
              <tr key={cat.id}>
                <td className="text-[var(--fc-text-muted)]">{cat.company.name}</td>
                <td>
                  <form action={updateCategoryForm} id={`cat-${cat.id}`} className="contents">
                    <input type="hidden" name="id" value={cat.id} />
                    <input name="name" defaultValue={cat.name} className="fc-input min-w-[140px] py-1.5 text-sm" />
                  </form>
                </td>
                <td>
                  <input
                    form={`cat-${cat.id}`}
                    name="limitAmount"
                    defaultValue={cat.limitAmount != null ? String(cat.limitAmount) : ""}
                    className="fc-input max-w-[120px] py-1.5 text-sm"
                    placeholder="Sem limite"
                  />
                </td>
                <td>
                  <input
                    form={`cat-${cat.id}`}
                    type="checkbox"
                    name="active"
                    defaultChecked={cat.active}
                    className="fc-checkbox"
                  />
                </td>
                <td>
                  <button form={`cat-${cat.id}`} type="submit" className="fc-btn-primary fc-btn-sm">
                    Salvar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

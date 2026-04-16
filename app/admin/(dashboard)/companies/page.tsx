import {
  createCompanyForm,
  deleteCompanyForm,
  listCompanies,
  updateCompanyForm,
} from "@/lib/actions/companies";

export default async function AdminCompaniesPage() {
  const rows = await listCompanies();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="fc-page-title">Empresas</h1>
        <p className="fc-page-sub">Nome obrigatório; CNPJ e telefone opcionais.</p>
      </div>

      <div className="fc-glass p-6">
        <h2 className="text-sm font-semibold text-fc-heading">Nova empresa</h2>
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
          <div className="sm:col-span-2">
            <button type="submit" className="fc-btn-primary">
              Cadastrar
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-fc-heading">Cadastradas</h2>
        {rows.length === 0 ? (
          <p className="text-[var(--fc-text-muted)]">Nenhuma empresa.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((c) => (
              <li key={c.id} className="fc-glass p-5">
                <form action={updateCompanyForm} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="sm:col-span-2">
                    <label className="fc-label text-xs">Nome</label>
                    <input name="name" defaultValue={c.name} required className="fc-input mt-1" />
                  </div>
                  <div>
                    <label className="fc-label text-xs">CNPJ</label>
                    <input name="cnpj" defaultValue={c.cnpj ?? ""} className="fc-input mt-1" />
                  </div>
                  <div>
                    <label className="fc-label text-xs">Telefone</label>
                    <input name="phone" defaultValue={c.phone ?? ""} className="fc-input mt-1" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                    <button type="submit" className="fc-btn-secondary fc-btn-sm">
                      Salvar
                    </button>
                    <span className="text-xs text-[var(--fc-text-muted)]">
                      Colaboradores vinculados: {c._count.userCompanies} · Categorias:{" "}
                      {c._count.categories} · Despesas: {c._count.expenses}
                    </span>
                  </div>
                </form>
                <form action={deleteCompanyForm} className="mt-3 inline-block">
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="fc-btn-danger">
                    Excluir empresa
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

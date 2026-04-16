import {
  createUserForm,
  listUsers,
  setUserActiveForm,
  setUserCreditBalanceVisibilityForm,
} from "@/lib/actions/users";
import { listCompanies } from "@/lib/actions/companies";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; active?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email;
  const active =
    sp.active === "true" ? true : sp.active === "false" ? false : undefined;

  const [rows, companies] = await Promise.all([
    listUsers({
      email: email || undefined,
      active,
    }),
    listCompanies(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="fc-page-title">Colaboradores</h1>
        <p className="fc-page-sub">
          Colaboradores: cadastro por e-mail, vinculo a empresas e preservacao do historico quando inativados.
        </p>
      </div>

      <form method="get" className="fc-glass flex flex-wrap items-end gap-3 p-4">
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

      <div className="fc-glass p-6">
        <h2 className="text-sm font-semibold text-fc-heading">Novo colaborador</h2>
        <form action={createUserForm} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="fc-label text-xs">E-mail *</label>
              <input name="email" type="email" required className="fc-input mt-1" />
            </div>
            <div>
              <label className="fc-label text-xs">Senha inicial *</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="fc-input mt-1"
              />
            </div>
          </div>
          <div>
            <p className="fc-label text-xs">Empresas (centro de custo) *</p>
            <div className="mt-2 flex flex-wrap gap-4">
              {companies.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-fc-heading">
                  <input type="checkbox" name="companyIds" value={c.id} className="fc-checkbox" />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--fc-text-muted)]">
            O colaborador ja e criado com acesso liberado para login e pode redefinir a senha depois, se precisar.
          </p>
          <button type="submit" className="fc-btn-primary">
            Cadastrar
          </button>
        </form>
      </div>

      <div className="fc-glass fc-table-shell overflow-hidden p-0">
        <table className="min-w-[880px]">
          <thead className="fc-glass-table-head">
            <tr>
              <th>E-mail</th>
              <th>Empresas</th>
              <th>Situação</th>
              <th>Ver saldo de crédito</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td className="text-[var(--fc-text-muted)]">
                  {u.userCompanies.map((x) => x.company.name).join(", ") || "—"}
                </td>
                <td>{u.active ? "Ativo" : "Inativo"}</td>
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
                      Exibir na nova despesa
                    </label>
                    <button type="submit" className="fc-btn-ghost text-xs">
                      Salvar
                    </button>
                  </form>
                </td>
                <td>
                  {u.active ? (
                    <form action={setUserActiveForm} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value="false" />
                      <button type="submit" className="fc-btn-ghost text-xs text-red-300 hover:text-red-200">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

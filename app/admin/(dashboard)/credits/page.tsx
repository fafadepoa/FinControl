import {
  listCreditOverview,
  listCreditTransactions,
  postCreditForm,
} from "@/lib/actions/credits";
import { formatBRL } from "@/lib/money";

export default async function AdminCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const sp = await searchParams;
  const filterUserId = sp.userId;

  const [overview, txs] = await Promise.all([
    listCreditOverview(),
    listCreditTransactions({ userId: filterUserId }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="fc-page-title">Créditos</h1>
        <p className="fc-page-sub">
          Lancamentos de credito por colaborador, com baixa automatica quando houver pagamento por credito.
        </p>
      </div>

      <div className="fc-glass p-6">
        <h2 className="text-sm font-semibold text-fc-heading">Novo lançamento</h2>
        <form action={postCreditForm} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="fc-label text-xs">Colaborador *</label>
            <select name="userId" required className="fc-input mt-1">
              <option value="">Selecione…</option>
              {overview.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fc-label text-xs">Valor (R$) *</label>
            <input name="amount" required className="fc-input mt-1" placeholder="0,00" />
          </div>
          <div className="sm:col-span-2">
            <label className="fc-label text-xs">Observação</label>
            <input name="note" className="fc-input mt-1" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="fc-btn-primary">
              Registrar
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-fc-heading">Saldos</h2>
        <div className="fc-glass fc-table-shell mt-2 overflow-hidden p-0">
          <table className="min-w-[480px]">
            <thead className="fc-glass-table-head">
              <tr>
                <th>Colaborador</th>
                <th>Saldo</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {overview.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td className="fc-amount">{formatBRL(Number(u.creditBalance?.balance ?? 0))}</td>
                  <td>{u.active ? "Ativo" : "Inativo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-fc-heading">Movimentações recentes</h2>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <select name="userId" defaultValue={filterUserId ?? ""} className="fc-input w-auto min-w-[12rem]">
              <option value="">Todos os colaboradores</option>
              {overview.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
            <button type="submit" className="fc-btn-secondary fc-btn-sm">
              Filtrar
            </button>
          </form>
        </div>
        <div className="fc-glass fc-table-shell mt-2 overflow-hidden p-0">
          <table className="min-w-[720px]">
            <thead className="fc-glass-table-head">
              <tr>
                <th>Data</th>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Por</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap text-[var(--fc-text-muted)]">
                    {new Date(t.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td>{t.user.email}</td>
                  <td>{t.type}</td>
                  <td className="fc-amount">{formatBRL(Number(t.amount))}</td>
                  <td className="text-[var(--fc-text-muted)]">{t.createdBy?.email ?? "—"}</td>
                  <td className="text-[var(--fc-text-muted)]">{t.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

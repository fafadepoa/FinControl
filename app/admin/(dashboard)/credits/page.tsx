import {
  getCreditTotals,
  listCreditOverview,
  listCreditTransactions,
} from "@/lib/actions/credits";
import { CreditTransactionType } from "@prisma/client";
import { Activity } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { AdminNewCreditModal } from "@/components/admin-new-credit-modal";
import { UIEmptyState } from "@/components/ui/empty-state";

export default async function AdminCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const sp = await searchParams;
  const filterUserId = sp.userId;

  const [overview, txs, totals] = await Promise.all([
    listCreditOverview(),
    listCreditTransactions({ userId: filterUserId }),
    getCreditTotals(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="fc-page-title">Créditos</h1>
        <p className="fc-page-sub">
          Lancamentos de credito por colaborador, com baixa automatica quando houver pagamento por credito.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AdminNewCreditModal users={overview.map((u) => ({ id: u.id, email: u.email }))} />
        <div className="fc-glass px-4 py-3">
          <p className="fc-soft-heading">Total de crédito adicionado</p>
          <p className="fc-amount text-base text-emerald-600">{formatBRL(totals.totalAdded)}</p>
        </div>
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
        {txs.length === 0 ? (
          <UIEmptyState
            icon={<Activity className="h-5 w-5" />}
            title="Sem movimentações para este filtro"
            description="Ajuste os filtros ou registre um novo lançamento de crédito."
          />
        ) : (
          <div className="fc-glass fc-table-shell mt-2 overflow-hidden p-0">
            <table className="min-w-[920px]">
              <thead className="fc-glass-table-head">
                <tr>
                  <th>ID</th>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Saldo após</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs text-[var(--fc-text-muted)]">{t.id.slice(-8).toUpperCase()}</td>
                    <td>{t.user.email}</td>
                    <td>{creditTypeLabel(t.type)}</td>
                    <td className="whitespace-nowrap text-[var(--fc-text-muted)]">
                      {new Date(t.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className={`fc-amount ${creditAmountClass(t.type)}`}>{formatSignedAmount(t.type, Number(t.amount))}</td>
                    <td className="fc-amount">{t.balanceAfter != null ? formatBRL(Number(t.balanceAfter)) : "—"}</td>
                    <td className="text-[var(--fc-text-muted)]">{t.createdBy?.email ?? "Sistema"}</td>
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

function creditTypeLabel(type: CreditTransactionType) {
  if (type === "CREDIT") return "Crédito adicionado";
  if (type === "DEBIT") return "Crédito utilizado";
  return "Ajuste de saldo";
}

function creditAmountClass(type: CreditTransactionType) {
  if (type === "CREDIT") return "text-emerald-600";
  if (type === "DEBIT") return "text-rose-600";
  return "text-[var(--fc-text)]";
}

function formatSignedAmount(type: CreditTransactionType, amount: number) {
  const value = formatBRL(amount);
  if (type === "CREDIT") return `+ ${value}`;
  if (type === "DEBIT") return `- ${value}`;
  return value;
}

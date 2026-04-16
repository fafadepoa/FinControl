import Link from "next/link";
import { ExpenseStatus } from "@prisma/client";
import { listMyExpenses } from "@/lib/actions/expenses";
import { formatBRL } from "@/lib/money";
import { ExpenseSummaryModal } from "@/components/expense-summary-modal";

const statusLabel: Record<ExpenseStatus, string> = {
  PENDING: "Aguardando validação",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  PAID: "Paga",
};

export default async function MyExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const sp = await searchParams;
  const rows = await listMyExpenses();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="fc-page-title">Minhas despesas</h1>
        <Link href="/expenses/new" className="fc-btn-primary fc-btn-sm">
          Nova despesa
        </Link>
      </div>

      {sp.created === "1" && (
        <div className="fc-alert-success border border-[rgba(36,172,113,0.45)]">
          Despesa enviada. <strong>Aguardando validação</strong> pelo administrador.
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-[var(--fc-text-muted)]">Nenhuma despesa ainda.</p>
      ) : (
        <div className="fc-glass fc-table-shell overflow-hidden p-0">
          <table className="min-w-[640px]">
            <thead className="fc-glass-table-head">
              <tr>
                <th>Data</th>
                <th>Empresa</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-[var(--fc-text-muted)]">
                    {new Date(e.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td>{e.company.name}</td>
                  <td>{e.category.name}</td>
                  <td className="fc-amount">{formatBRL(Number(e.amount))}</td>
                  <td>{statusLabel[e.status]}</td>
                  <td>
                    <ExpenseSummaryModal
                      dateLabel={new Date(e.createdAt).toLocaleString("pt-BR")}
                      companyName={e.company.name}
                      categoryName={e.category.name}
                      amountLabel={formatBRL(Number(e.amount))}
                      statusLabel={statusLabel[e.status]}
                      description={e.description}
                      attachmentUrl={e.attachmentUrl}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

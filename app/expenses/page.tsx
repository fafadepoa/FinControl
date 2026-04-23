import Link from "next/link";
import { ExpenseStatus } from "@prisma/client";
import { listMyExpenses } from "@/lib/actions/expenses";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
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
  const { user } = await requireAuth();
  const sp = await searchParams;
  const rows = await listMyExpenses();
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      creditBalanceVisibleToSelf: true,
      creditBalance: { select: { balance: true } },
    },
  });

  const totalGenerated = rows.length;
  const totalAmount = rows.reduce((acc, item) => acc + Number(item.amount), 0);
  const pendingCount = rows.filter((item) => item.status === "PENDING").length;
  const creditVisible = me?.creditBalanceVisibleToSelf !== false;
  const creditAmount =
    me?.creditBalance?.balance != null ? Number(me.creditBalance.balance) : 0;
  const displayName = user.displayName?.trim() || user.email.split("@")[0] || user.email;

  return (
    <div className="space-y-6">
      <section className="fc-glass-strong rounded-2xl p-5 md:p-6">
        <p className="text-sm text-[var(--fc-text-muted)]">Olá,</p>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-fc-heading">
          {displayName}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="fc-section-card p-4">
            <p className="fc-soft-heading">Despesas geradas</p>
            <p className="mt-2 text-2xl font-bold text-fc-heading">{totalGenerated}</p>
          </article>
          <article className="fc-section-card p-4">
            <p className="fc-soft-heading">Valor total solicitado</p>
            <p className="mt-2 text-2xl font-bold text-fc-heading">{formatBRL(totalAmount)}</p>
            <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
              {pendingCount} em validação
            </p>
          </article>
          <article className="fc-section-card p-4">
            <p className="fc-soft-heading">Créditos disponíveis</p>
            <p className="mt-2 text-2xl font-bold text-fc-heading">
              {creditVisible ? formatBRL(creditAmount) : "Oculto"}
            </p>
            {!creditVisible && (
              <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
                Visibilidade controlada pelo administrador
              </p>
            )}
          </article>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-fc-heading">Funcionalidades</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/expenses/new" className="fc-section-card flex items-center gap-3 p-4 hover:bg-white/80">
            <span className="text-2xl text-fc-cyan">$</span>
            <div>
              <p className="font-semibold text-fc-heading">Solicitar despesas</p>
              <p className="text-xs text-[var(--fc-text-muted)]">Criar uma nova solicitação</p>
            </div>
          </Link>
          <Link href="/expenses/history" className="fc-section-card flex items-center gap-3 p-4 hover:bg-white/80">
            <span className="text-2xl text-fc-cyan">📅</span>
            <div>
              <p className="font-semibold text-fc-heading">Histórico de despesas</p>
              <p className="text-xs text-[var(--fc-text-muted)]">Consultar e filtrar solicitações</p>
            </div>
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="fc-soft-heading">Espaço do colaborador</p>
          <h1 className="fc-page-title">Minhas despesas</h1>
        </div>
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
        <div className="fc-section-card p-4 text-[var(--fc-text-muted)]">Nenhuma despesa ainda.</div>
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
                      attachmentUrls={
                        e.attachments.length > 0
                          ? e.attachments.map((attachment) => attachment.url)
                          : e.attachmentUrl
                            ? [e.attachmentUrl]
                            : []
                      }
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

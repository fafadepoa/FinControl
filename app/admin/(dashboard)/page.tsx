import { ExpenseStatus } from "@prisma/client";
import Link from "next/link";
import { getAdminExpenseStats, listAdminExpenses } from "@/lib/actions/expenses";
import { formatBRL } from "@/lib/money";

export default async function AdminDashboardPage() {
  const stats = await getAdminExpenseStats();
  const recent = (await listAdminExpenses()).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="fc-soft-heading">Painel administrativo</p>
        <h1 className="fc-page-title">Dashboard</h1>
        <p className="fc-page-sub">Visão geral das despesas das suas empresas</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pendentes" value={stats.pending} accent="pending" />
        <StatCard label="Aprovadas" value={stats.approved} accent="approved" />
        <StatCard label="Rejeitadas" value={stats.rejected} accent="rejected" />
        <StatCard label="Pagas" value={stats.paid} accent="paid" />
        <StatCard label="Total (qtd)" value={stats.total} accent="total" />
      </div>

      <div className="fc-section-card p-4">
        <p className="text-sm text-[var(--fc-text-muted)]">
          Valor total registrado:{" "}
          <span className="fc-amount text-base">{formatBRL(stats.totalAmount)}</span>
        </p>
      </div>

      <div className="fc-section-card p-4 text-[var(--fc-text-muted)]">
        <strong className="text-fc-heading">Cartão corporativo:</strong> em breve. Integração planejada
        para fases futuras.
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-fc-heading">Despesas recentes</h2>
          <Link href="/admin/expenses" className="fc-link text-sm">
            Ver todas
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="fc-section-card p-4 text-[var(--fc-text-muted)]">Nenhuma despesa ainda.</div>
        ) : (
          <div className="fc-glass fc-table-shell overflow-hidden p-0">
            <table className="min-w-[720px]">
              <thead className="fc-glass-table-head">
                <tr>
                  <th>Data</th>
                  <th>Colaborador</th>
                  <th>Empresa</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-[var(--fc-text-muted)]">
                      {new Date(e.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td>{e.user.email}</td>
                    <td>{e.company.name}</td>
                    <td className="fc-amount">{formatBRL(Number(e.amount))}</td>
                    <td>{statusPt(e.status)}</td>
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "pending" | "approved" | "rejected" | "paid" | "total";
}) {
  const accentClass = {
    pending: "fc-stat-pending",
    approved: "fc-stat-approved",
    rejected: "fc-stat-rejected",
    paid: "fc-stat-paid",
    total: "fc-stat-total",
  }[accent];
  return (
    <div className={`fc-glass fc-stat-card p-4 ${accentClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-fc-heading">{value}</p>
    </div>
  );
}

function statusPt(s: ExpenseStatus) {
  switch (s) {
    case "PENDING":
      return "Aguardando validação";
    case "APPROVED":
      return "Aprovada";
    case "REJECTED":
      return "Rejeitada";
    case "PAID":
      return "Paga";
    default:
      return s;
  }
}

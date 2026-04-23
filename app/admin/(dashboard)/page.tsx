import { ExpenseStatus } from "@prisma/client";
import Link from "next/link";
import { Activity, CircleDollarSign, ClipboardCheck, Clock3, Plus, ReceiptText, Wallet } from "lucide-react";
import { getAdminExpenseStats, listAdminExpenses } from "@/lib/actions/expenses";
import { formatBRL } from "@/lib/money";
import { UICard } from "@/components/ui/card";
import { UIBadge } from "@/components/ui/badge";
import { UIButton } from "@/components/ui/button";
import { UIEmptyState } from "@/components/ui/empty-state";
import { ExpensesMonthlyChart } from "@/components/charts/expenses-monthly-chart";
import { ExpensesStatusPie } from "@/components/charts/expenses-status-pie";
import { ExpensesTrendLine } from "@/components/charts/expenses-trend-line";

export default async function AdminDashboardPage() {
  const stats = await getAdminExpenseStats();
  const all = await listAdminExpenses();
  const recent = all.slice(0, 8);
  const monthly = buildMonthly(all);
  const trend = buildTrend(all);
  const statusData = [
    { name: "Pendentes", value: stats.pending },
    { name: "Aprovadas", value: stats.approved },
    { name: "Rejeitadas", value: stats.rejected },
    { name: "Pagas", value: stats.paid },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="fc-soft-heading">Painel administrativo</p>
        <h1 className="fc-page-title">Dashboard</h1>
        <p className="fc-page-sub">Visão geral das despesas, tendências e atividades recentes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pendentes" value={stats.pending} icon={<Clock3 className="h-4 w-4" />} tone="warning" />
        <StatCard label="Aprovadas" value={stats.approved} icon={<ClipboardCheck className="h-4 w-4" />} tone="neutral" />
        <StatCard label="Rejeitadas" value={stats.rejected} icon={<Activity className="h-4 w-4" />} tone="danger" />
        <StatCard label="Pagas" value={stats.paid} icon={<Wallet className="h-4 w-4" />} tone="success" />
        <StatCard label="Total (qtd)" value={stats.total} icon={<ReceiptText className="h-4 w-4" />} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <UICard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--fc-heading)]">Despesas por mês</h2>
            <UIBadge tone="neutral">12 meses</UIBadge>
          </div>
          <ExpensesMonthlyChart data={monthly} />
        </UICard>
        <UICard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--fc-heading)]">Distribuição por status</h2>
            <UIBadge tone="neutral">Atual</UIBadge>
          </div>
          <ExpensesStatusPie data={statusData} />
        </UICard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <UICard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--fc-heading)]">Tendência temporal</h2>
            <p className="text-sm text-[var(--fc-text-muted)]">Valor total: <span className="font-semibold text-[var(--fc-heading)]">{formatBRL(stats.totalAmount)}</span></p>
          </div>
          <ExpensesTrendLine data={trend} />
        </UICard>
        <UICard className="space-y-4 p-5">
          <h2 className="text-base font-semibold text-[var(--fc-heading)]">Ações rápidas</h2>
          <div className="grid gap-2">
            <Link href="/expenses/new">
              <UIButton className="w-full justify-start" size="lg">
                <Plus className="h-4 w-4" />
                Nova despesa
              </UIButton>
            </Link>
            <Link href="/admin/expenses">
              <UIButton variant="secondary" className="w-full justify-start" size="lg">
                <ReceiptText className="h-4 w-4" />
                Gerenciar despesas
              </UIButton>
            </Link>
            <Link href="/admin/credits">
              <UIButton variant="secondary" className="w-full justify-start" size="lg">
                <CircleDollarSign className="h-4 w-4" />
                Lançamentos de crédito
              </UIButton>
            </Link>
          </div>
        </UICard>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--fc-heading)]">Atividade recente</h2>
          <Link href="/admin/expenses" className="fc-link text-sm">
            Ver todas
          </Link>
        </div>
        {recent.length === 0 ? (
          <UIEmptyState
            icon={<Activity className="h-5 w-5" />}
            title="Sem despesas recentes"
            description="Assim que as despesas forem registradas, elas aparecerão aqui."
          />
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
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "neutral" | "warning" | "danger" | "success";
}) {
  const badgeTone = tone === "warning" || tone === "danger" || tone === "success" ? tone : "neutral";
  return (
    <UICard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <UIBadge tone={badgeTone}>{label}</UIBadge>
        <span className="text-[var(--fc-text-subtle)]">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--fc-heading)]">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-muted)]">
        atual
      </p>
    </UICard>
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

function buildMonthly(
  rows: Array<{
    createdAt: Date;
    amount: { toString(): string };
  }>,
) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const byMonth = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.createdAt.getFullYear()}-${row.createdAt.getMonth()}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(row.amount.toString()));
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-12)
    .map(([key, total]) => {
      const [year, month] = key.split("-");
      const date = new Date(Number(year), Number(month), 1);
      return { month: formatter.format(date), total };
    });
}

function buildTrend(
  rows: Array<{
    createdAt: Date;
    amount: { toString(): string };
  }>,
) {
  return rows
    .slice()
    .reverse()
    .slice(-14)
    .map((row) => ({
      point: new Date(row.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total: Number(row.amount.toString()),
    }));
}

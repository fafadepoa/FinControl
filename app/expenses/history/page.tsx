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

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default async function ExpensesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    status?: string;
    companyId?: string;
    categoryId?: string;
  }>;
}) {
  const sp = await searchParams;
  const rows = await listMyExpenses();

  const years = Array.from(
    new Set(rows.map((row) => new Date(row.createdAt).getFullYear()))
  ).sort((a, b) => b - a);
  const selectedYear =
    sp.year && /^\d{4}$/.test(sp.year) ? Number(sp.year) : years[0] ?? new Date().getFullYear();
  const selectedMonth =
    sp.month && /^\d{1,2}$/.test(sp.month) ? Number(sp.month) : undefined;
  const selectedStatus =
    sp.status && Object.values(ExpenseStatus).includes(sp.status as ExpenseStatus)
      ? (sp.status as ExpenseStatus)
      : undefined;
  const selectedCompanyId = sp.companyId || undefined;
  const selectedCategoryId = sp.categoryId || undefined;

  const companies = Array.from(
    new Map(rows.map((row) => [row.company.id, row.company.name])).entries()
  ).map(([id, name]) => ({ id, name }));
  const categories = Array.from(
    new Map(rows.map((row) => [row.category.id, row.category.name])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filtered = rows.filter((row) => {
    const date = new Date(row.createdAt);
    const byYear = date.getFullYear() === selectedYear;
    const byMonth = selectedMonth ? date.getMonth() + 1 === selectedMonth : true;
    const byStatus = selectedStatus ? row.status === selectedStatus : true;
    const byCompany = selectedCompanyId ? row.company.id === selectedCompanyId : true;
    const byCategory = selectedCategoryId ? row.category.id === selectedCategoryId : true;
    return byYear && byMonth && byStatus && byCompany && byCategory;
  });

  const totalAmount = filtered.reduce((acc, row) => acc + Number(row.amount), 0);
  const pendingAmount = filtered
    .filter((row) => row.status === "PENDING")
    .reduce((acc, row) => acc + Number(row.amount), 0);
  const paidAmount = filtered
    .filter((row) => row.status === "PAID")
    .reduce((acc, row) => acc + Number(row.amount), 0);

  const groupedByMonth = filtered.reduce<Record<number, typeof filtered>>((acc, row) => {
    const month = new Date(row.createdAt).getMonth() + 1;
    if (!acc[month]) acc[month] = [];
    acc[month].push(row);
    return acc;
  }, {});

  const groupedMonthEntries = Object.entries(groupedByMonth)
    .map(([month, items]) => ({
      month: Number(month),
      items,
      total: items.reduce((sum, item) => sum + Number(item.amount), 0),
    }))
    .sort((a, b) => b.month - a.month);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="fc-soft-heading">Espaço do colaborador</p>
          <h1 className="fc-page-title">Histórico de despesas</h1>
          <p className="fc-page-sub">
            Filtre por ano, mês, status e empresa para revisar suas solicitações.
          </p>
        </div>
        <Link href="/expenses/new" className="fc-btn-primary fc-btn-sm">
          Nova despesa
        </Link>
      </div>

      <section className="fc-glass-strong rounded-2xl p-5 md:p-6">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="fc-label text-xs">Ano</label>
            <select name="year" defaultValue={String(selectedYear)} className="fc-input mt-1">
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fc-label text-xs">Mês</label>
            <select
              name="month"
              defaultValue={selectedMonth ? String(selectedMonth) : ""}
              className="fc-input mt-1"
            >
              <option value="">Todos</option>
              {monthNames.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fc-label text-xs">Status</label>
            <select
              name="status"
              defaultValue={selectedStatus ?? ""}
              className="fc-input mt-1"
            >
              <option value="">Todos</option>
              {Object.values(ExpenseStatus).map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fc-label text-xs">Empresa</label>
            <select
              name="companyId"
              defaultValue={selectedCompanyId ?? ""}
              className="fc-input mt-1"
            >
              <option value="">Todas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fc-label text-xs">Categoria</label>
            <select
              name="categoryId"
              defaultValue={selectedCategoryId ?? ""}
              className="fc-input mt-1"
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
            <button type="submit" className="fc-btn-secondary">
              Aplicar filtros
            </button>
            <Link href="/expenses/history" className="fc-link text-sm">
              Limpar
            </Link>
          </div>
        </form>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="fc-section-card p-4">
            <p className="fc-soft-heading">Total no período</p>
            <p className="mt-2 text-2xl font-bold text-fc-heading">{formatBRL(totalAmount)}</p>
          </article>
          <article className="fc-section-card p-4">
            <p className="fc-soft-heading">Pendente no período</p>
            <p className="mt-2 text-2xl font-bold text-fc-heading">{formatBRL(pendingAmount)}</p>
          </article>
          <article className="fc-section-card p-4">
            <p className="fc-soft-heading">Pagas no período</p>
            <p className="mt-2 text-2xl font-bold text-fc-heading">{formatBRL(paidAmount)}</p>
            <p className="mt-1 text-xs text-[var(--fc-text-muted)]">{filtered.length} lançamento(s)</p>
          </article>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="fc-section-card p-4 text-[var(--fc-text-muted)]">
          Nenhuma despesa encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-4">
          {!selectedMonth && groupedMonthEntries.length > 0 && (
            <section className="fc-glass rounded-2xl p-4">
              <p className="fc-soft-heading mb-3">Resumo por mês</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedMonthEntries.map((entry) => (
                  <Link
                    key={entry.month}
                    href={`/expenses/history?year=${selectedYear}&month=${entry.month}${selectedStatus ? `&status=${selectedStatus}` : ""}${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ""}${selectedCategoryId ? `&categoryId=${selectedCategoryId}` : ""}`}
                    className="fc-section-card block p-4 hover:bg-white/80"
                  >
                    <p className="text-sm font-semibold text-fc-heading">
                      {monthNames[entry.month - 1]}
                    </p>
                    <p className="mt-2 text-xl font-bold text-fc-heading">
                      {formatBRL(entry.total)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
                      {entry.items.length} lançamento(s)
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {groupedMonthEntries.map((entry) => (
            <section key={entry.month} className="fc-glass overflow-hidden rounded-2xl">
              <header className="fc-glass-table-head flex items-center justify-between px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-fc-heading">
                  {monthNames[entry.month - 1]}
                </h2>
                <span className="fc-amount text-sm">{formatBRL(entry.total)}</span>
              </header>
              <div className="divide-y divide-[rgba(13,48,80,0.08)]">
                {entry.items.map((expense) => (
                  <article key={expense.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-[220px] flex-1">
                      <p className="font-semibold text-fc-heading">
                        {expense.description?.trim() || "Despesa sem descrição"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--fc-text-muted)]">
                        <span>{new Date(expense.createdAt).toLocaleDateString("pt-BR")}</span>
                        <span>{expense.company.name}</span>
                        <span>{statusLabel[expense.status]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="fc-amount whitespace-nowrap">{formatBRL(Number(expense.amount))}</span>
                      <ExpenseSummaryModal
                        dateLabel={new Date(expense.createdAt).toLocaleString("pt-BR")}
                        companyName={expense.company.name}
                        categoryName={expense.category.name}
                        amountLabel={formatBRL(Number(expense.amount))}
                        statusLabel={statusLabel[expense.status]}
                        description={expense.description}
                        attachmentUrls={
                          expense.attachments.length > 0
                            ? expense.attachments.map((attachment) => attachment.url)
                            : expense.attachmentUrl
                              ? [expense.attachmentUrl]
                              : []
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import { ExpenseStatus } from "@prisma/client";
import Link from "next/link";
import { listAdminExpenses } from "@/lib/actions/expenses";
import { listUsers } from "@/lib/actions/users";
import { listCompanies } from "@/lib/actions/companies";
import { AdminExpensesTable } from "@/components/admin-expenses-table";

function statusLabel(s: ExpenseStatus) {
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

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; companyId?: string; userId?: string; categoryId?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && Object.values(ExpenseStatus).includes(sp.status as ExpenseStatus)
      ? (sp.status as ExpenseStatus)
      : undefined;
  const companyId = sp.companyId || undefined;
  const userId = sp.userId || undefined;
  const categoryId = sp.categoryId || undefined;

  const [rows, companies, users] = await Promise.all([
    listAdminExpenses({ status, companyId, userId, categoryId }),
    listCompanies(),
    listUsers(),
  ]);
  const categories = Array.from(
    new Map(rows.map((expense) => [expense.category.id, expense.category.name])).entries()
  ).map(([id, name]) => ({ id, name }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="fc-page-title">Todas as despesas</h1>
        <Link href="/expenses/new" className="fc-btn-primary fc-btn-sm">
          Nova despesa
        </Link>
      </div>

      <form className="fc-glass flex flex-wrap items-end gap-3 p-4" method="get">
        <div>
          <label className="fc-label text-xs">Status</label>
          <select name="status" defaultValue={status ?? ""} className="fc-input mt-1 w-auto min-w-[10rem]">
            <option value="">Todos</option>
            {Object.values(ExpenseStatus).map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fc-label text-xs">Empresa</label>
          <select
            name="companyId"
            defaultValue={companyId ?? ""}
            className="fc-input mt-1 w-auto min-w-[10rem]"
          >
            <option value="">Todas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fc-label text-xs">Colaborador</label>
          <select name="userId" defaultValue={userId ?? ""} className="fc-input mt-1 w-auto min-w-[12rem]">
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="fc-label text-xs">Categoria</label>
          <select
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className="fc-input mt-1 w-auto min-w-[12rem]"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="fc-btn-secondary">
          Filtrar
        </button>
        <Link href="/admin/expenses" className="fc-link self-center text-sm">
          Limpar
        </Link>
      </form>

      <AdminExpensesTable
        rows={rows.map((e) => ({
          id: e.id,
          createdAt: new Date(e.createdAt).toLocaleString("pt-BR"),
          userEmail: e.user.email,
          userId: e.user.id,
          userRole: e.user.role,
          userCreditBalance:
            e.user.creditBalance != null ? String(e.user.creditBalance.balance) : null,
          companyName: e.company.name,
          categoryName: e.category.name,
          amount: String(e.amount),
          status: e.status,
          description: e.description,
          attachmentUrls:
            e.attachments.length > 0
              ? e.attachments.map((attachment) => attachment.url)
              : e.attachmentUrl
                ? [e.attachmentUrl]
                : [],
        }))}
      />
    </div>
  );
}

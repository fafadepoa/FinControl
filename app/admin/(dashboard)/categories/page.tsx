import { listCompanyUsersForCategories, listCategories } from "@/lib/actions/categories";
import { listCompanies } from "@/lib/actions/companies";
import Link from "next/link";
import { AdminNewCategoryModal } from "@/components/admin-new-category-modal";
import { formatBRL } from "@/lib/money";

function limitCell(cat: {
  kind: string;
  paymentRule: string;
  limitAmount: unknown;
  dailyRate: unknown;
  kmRate: unknown;
}) {
  if (cat.kind === "FUEL") {
    if (cat.paymentRule === "DAILY" && cat.dailyRate != null) {
      return `Diária ref. ${formatBRL(Number(cat.dailyRate))}`;
    }
    if (cat.paymentRule === "KM" && cat.kmRate != null) {
      return `Km ref. ${formatBRL(Number(cat.kmRate))}`;
    }
    if (cat.limitAmount != null) return formatBRL(Number(cat.limitAmount));
    return "Sem limite";
  }
  if (cat.limitAmount != null) return formatBRL(Number(cat.limitAmount));
  return "Sem limite";
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    companyId?: string;
    active?: string;
  }>;
}) {
  const sp = await searchParams;
  const name = sp.name;
  const companyId = sp.companyId;
  const active =
    sp.active === "true" ? true : sp.active === "false" ? false : undefined;

  const [rows, companies, companiesWithUsers] = await Promise.all([
    listCategories({
      name: name || undefined,
      companyId: companyId || undefined,
      active,
    }),
    listCompanies(),
    listCompanyUsersForCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="fc-page-title">Categorias</h1>
        <p className="fc-page-sub">
          Cadastre categorias por empresa. Em <strong>Combustível</strong> (ou equivalente), defina se a referência é
          por valor livre, diária ou km — o colaborador informa o valor da despesa manualmente.
        </p>
      </div>

      <div className="fc-glass flex flex-wrap items-end justify-between gap-4 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="fc-label text-xs">Nome</label>
            <input
              name="name"
              defaultValue={name ?? ""}
              className="fc-input mt-1 min-w-[10rem]"
              placeholder="Buscar"
            />
          </div>
          <div>
            <label className="fc-label text-xs">Empresa</label>
            <select name="companyId" defaultValue={companyId ?? ""} className="fc-input mt-1 min-w-[10rem]">
              <option value="">Todas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fc-label text-xs">Status</label>
            <select name="active" defaultValue={sp.active ?? ""} className="fc-input mt-1 min-w-[8rem]">
              <option value="">Todos</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <button type="submit" className="fc-btn-secondary">
            Filtrar
          </button>
        </form>
        <AdminNewCategoryModal companies={companies} companiesWithUsers={companiesWithUsers} />
      </div>

      {rows.length === 0 ? (
        <div className="fc-glass px-4 py-8 text-center text-sm text-[var(--fc-text-muted)]">
          Nenhuma categoria cadastrada. Use <strong>+ Adicionar categoria</strong> para escolher um modelo padrão ou
          criar um tipo novo.
        </div>
      ) : null}

      <div className="fc-glass fc-table-shell overflow-hidden p-0">
        <table className="min-w-[640px]">
          <thead className="fc-glass-table-head">
            <tr>
              <th>Empresa</th>
              <th>Nome</th>
              <th>Acesso</th>
              <th>Limite / referência</th>
              <th>Status</th>
              <th className="w-14 text-center">Editar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((cat) => (
              <tr key={cat.id}>
                <td className="text-[var(--fc-text-muted)]">{cat.company.name}</td>
                <td className="font-medium text-fc-heading">
                  {cat.name}
                  {cat.kind === "FUEL" ? (
                    <span className="ml-2 text-xs font-normal text-[var(--fc-text-muted)]">(combustível)</span>
                  ) : null}
                </td>
                <td>{cat._count.categoryUsers > 0 ? "Restrito" : "Todos"}</td>
                <td className="text-sm text-[var(--fc-text-muted)]">{limitCell(cat)}</td>
                <td>{cat.active ? "Ativo" : "Inativo"}</td>
                <td className="text-center">
                  <Link
                    href={`/admin/categories/${cat.id}/edit`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--fc-glass-border)] text-fc-heading hover:bg-[rgba(15,34,39,0.06)]"
                    aria-label={`Editar categoria ${cat.name}`}
                    title="Editar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

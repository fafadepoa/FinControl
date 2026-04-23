import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryForEdit,
  listCompanyUsersForCategories,
  updateCategoryForm,
} from "@/lib/actions/categories";
import { CategoryEditRulesSection } from "@/components/category-edit-rules";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const [category, companies] = await Promise.all([
    getCategoryForEdit(categoryId),
    listCompanyUsersForCategories(),
  ]);
  if (!category) notFound();

  const companyUsers = companies.find((company) => company.id === category.companyId)?.users ?? [];
  const targetCompanies = companies.filter((company) => company.id !== category.companyId);
  const selectedUsers = new Set(category.categoryUsers.map((link) => link.userId));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="fc-page-title">Editar categoria</h1>
          <p className="fc-page-sub">{category.company.name}</p>
        </div>
        <Link href="/admin/categories" className="fc-btn-secondary fc-btn-sm">
          Voltar
        </Link>
      </div>

      <form action={updateCategoryForm} className="fc-glass grid gap-4 p-6 sm:grid-cols-2">
        <input type="hidden" name="id" value={category.id} />
        <div>
          <label className="fc-label text-xs">Nome *</label>
          <input name="name" defaultValue={category.name} required className="fc-input mt-1" />
        </div>

        <CategoryEditRulesSection
          initialKind={category.kind}
          initialPaymentRule={category.paymentRule}
          initialLimit={category.limitAmount != null ? String(category.limitAmount) : ""}
          initialDailyRate={category.dailyRate != null ? String(category.dailyRate) : ""}
          initialKmRate={category.kmRate != null ? String(category.kmRate) : ""}
        />

        <div className="sm:self-end">
          <label className="fc-label inline-flex items-center gap-2 text-xs">
            <input type="checkbox" name="active" defaultChecked={category.active} className="fc-checkbox" />
            Categoria ativa
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="fc-label text-xs">Usuários vinculados</label>
          <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
            Se nenhum usuário for marcado, a categoria fica disponível para todos os colaboradores da empresa.
          </p>
          <div className="mt-2 max-h-56 space-y-2 overflow-auto rounded border border-[var(--fc-glass-border)] p-3">
            {companyUsers.length === 0 ? (
              <p className="text-xs text-[var(--fc-text-muted)]">Nenhum colaborador encontrado nesta empresa.</p>
            ) : (
              companyUsers.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="userIds"
                    value={user.id}
                    defaultChecked={selectedUsers.has(user.id)}
                    className="fc-checkbox"
                  />
                  <span>{user.displayName?.trim() || user.email}</span>
                  {!user.active ? (
                    <span className="text-xs text-[var(--fc-text-muted)]">(inativo)</span>
                  ) : null}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="sm:col-span-2 space-y-2 rounded-lg border border-[var(--fc-glass-border)] p-3">
          <label className="fc-label text-xs">Aplicar edição em outras empresas (opcional)</label>
          <p className="text-xs text-[var(--fc-text-muted)]">
            Se a categoria já existir pelo nome na empresa alvo, ela será atualizada. Caso não exista, será criada.
            Em cada empresa, sem usuários marcados significa acesso para todos os colaboradores.
          </p>
          {targetCompanies.length === 0 ? (
            <p className="text-xs text-[var(--fc-text-muted)]">Não há outras empresas para aplicar esta categoria.</p>
          ) : (
            <div className="space-y-3">
              {targetCompanies.map((company) => (
                <div key={company.id} className="rounded-md border border-[var(--fc-glass-border)] p-2">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-fc-heading">
                    <input type="checkbox" name="targetCompanyIds" value={company.id} className="fc-checkbox" />
                    <span>{company.name}</span>
                  </label>
                  <div className="mt-2 max-h-28 space-y-2 overflow-auto pl-6 text-sm">
                    {company.users.length === 0 ? (
                      <p className="text-xs text-[var(--fc-text-muted)]">Sem colaboradores nesta empresa.</p>
                    ) : (
                      company.users.map((user) => (
                        <label key={user.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name={`targetUserIds__${company.id}`}
                            value={user.id}
                            className="fc-checkbox"
                          />
                          <span>{user.displayName?.trim() || user.email}</span>
                          {!user.active ? <span className="text-xs text-[var(--fc-text-muted)]">(inativo)</span> : null}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="fc-btn-primary">
            Salvar alteração
          </button>
        </div>
      </form>
    </div>
  );
}

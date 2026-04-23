import Link from "next/link";
import { deleteCompanyForm, getCompanyForEdit, updateCompanyForm } from "@/lib/actions/companies";

export default async function AdminCompanyEditPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await getCompanyForEdit(companyId);

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="fc-page-title">Empresa não encontrada</h1>
        <p className="fc-page-sub">A empresa pode não existir ou não pertence ao seu escopo administrativo.</p>
        <Link href="/admin/companies" className="fc-btn-secondary">
          Voltar para empresas
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="fc-page-title">Editar empresa</h1>
          <p className="fc-page-sub">Atualize os dados cadastrais da empresa.</p>
        </div>
        <Link href="/admin/companies" className="fc-btn-secondary fc-btn-sm">
          Voltar à lista
        </Link>
      </div>

      <div className="fc-glass p-6">
        <form action={updateCompanyForm} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={company.id} />
          <div className="sm:col-span-2">
            <label className="fc-label text-xs">Nome *</label>
            <input name="name" defaultValue={company.name} required className="fc-input mt-1" />
          </div>
          <div>
            <label className="fc-label text-xs">CNPJ</label>
            <input name="cnpj" defaultValue={company.cnpj ?? ""} className="fc-input mt-1" />
          </div>
          <div>
            <label className="fc-label text-xs">Telefone</label>
            <input name="phone" defaultValue={company.phone ?? ""} className="fc-input mt-1" />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
            <button type="submit" className="fc-btn-primary">
              Salvar alterações
            </button>
            <span className="text-xs text-[var(--fc-text-muted)]">
              Colaboradores vinculados: {company._count.userCompanies} · Categorias: {company._count.categories} ·
              Despesas: {company._count.expenses}
            </span>
          </div>
        </form>
      </div>

      <div className="fc-glass p-6">
        <h2 className="text-sm font-semibold text-fc-heading">Zona de risco</h2>
        <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
          Excluir empresa remove os dados relacionados conforme as regras do sistema.
        </p>
        <form action={deleteCompanyForm} className="mt-4 inline-block">
          <input type="hidden" name="id" value={company.id} />
          <button type="submit" className="fc-btn-danger">
            Excluir empresa
          </button>
        </form>
      </div>
    </div>
  );
}

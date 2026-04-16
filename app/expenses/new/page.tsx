import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { ExpenseWizard } from "@/components/expense-wizard";

export default async function NewExpensePage() {
  const { user } = await requireAuth();
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      creditBalanceVisibleToSelf: true,
      creditBalance: { select: { balance: true } },
    },
  });
  const creditBalanceAmount =
    me?.creditBalance?.balance != null ? Number(me.creditBalance.balance) : 0;
  const creditBalanceVisible = me?.creditBalanceVisibleToSelf !== false;

  const linked = await prisma.userCompany.findMany({
    where: { userId: user.id },
    include: {
      company: {
        include: {
          categories: {
            where: { active: true },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  const companies = linked.map((uc) => ({
    id: uc.company.id,
    name: uc.company.name,
    categories: uc.company.categories.map((c) => ({
      id: c.id,
      name: c.name,
      limitAmount: c.limitAmount != null ? c.limitAmount.toString() : null,
    })),
  }));

  return (
    <div className="space-y-8">
      <h1 className="fc-page-title">Nova despesa</h1>
      {companies.length === 0 ? (
        <div className="fc-alert-error border border-amber-500/40 bg-amber-950/30 text-amber-100">
          Você não está vinculado a nenhuma empresa. Solicite ao administrador o vínculo a um centro de
          custo.
        </div>
      ) : (
        <ExpenseWizard
          companies={companies}
          creditBalanceVisible={creditBalanceVisible}
          creditBalanceAmount={creditBalanceAmount}
        />
      )}
    </div>
  );
}

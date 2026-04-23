import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { ExpenseWizard } from "@/components/expense-wizard";
import type { CategoryKind, FuelEntryMode } from "@prisma/client";

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

  const [linkedRows, managedRows] = await Promise.all([
    prisma.userCompany.findMany({
      where: { userId: user.id },
      include: {
        company: {
          include: {
            categories: {
              where: { active: true },
              orderBy: { name: "asc" },
              include: {
                categoryUsers: { select: { userId: true } },
              },
            },
          },
        },
      },
    }),
    user.role === "ADMIN"
      ? prisma.company.findMany({
          where: { createdById: user.id },
          include: {
            categories: {
              where: { active: true },
              orderBy: { name: "asc" },
              include: {
                categoryUsers: { select: { userId: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const companyMap = new Map<
    string,
    {
      id: string;
      name: string;
      categories: {
        id: string;
        name: string;
        kind: CategoryKind;
        paymentRule: FuelEntryMode;
        limitAmount: string | null;
        dailyRate: string | null;
        kmRate: string | null;
      }[];
    }
  >();
  for (const uc of linkedRows) {
    companyMap.set(uc.company.id, {
      id: uc.company.id,
      name: uc.company.name,
      categories: uc.company.categories
        .filter((category) => {
          if (user.role === "ADMIN") return true;
          if (category.categoryUsers.length === 0) return true;
          return category.categoryUsers.some((link) => link.userId === user.id);
        })
        .map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          paymentRule: c.paymentRule,
          limitAmount: c.limitAmount != null ? c.limitAmount.toString() : null,
          dailyRate: c.dailyRate != null ? c.dailyRate.toString() : null,
          kmRate: c.kmRate != null ? c.kmRate.toString() : null,
        })),
    });
  }
  for (const c of managedRows) {
    if (!companyMap.has(c.id)) {
      companyMap.set(c.id, {
        id: c.id,
        name: c.name,
        categories: c.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          kind: cat.kind,
          paymentRule: cat.paymentRule,
          limitAmount: cat.limitAmount != null ? cat.limitAmount.toString() : null,
          dailyRate: cat.dailyRate != null ? cat.dailyRate.toString() : null,
          kmRate: cat.kmRate != null ? cat.kmRate.toString() : null,
        })),
      });
    }
  }
  const companies = Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="space-y-8">
      <div>
        <p className="fc-soft-heading">Espaço do colaborador</p>
        <h1 className="fc-page-title">Nova despesa</h1>
      </div>
      {companies.length === 0 ? (
        <div className="fc-alert-error">
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

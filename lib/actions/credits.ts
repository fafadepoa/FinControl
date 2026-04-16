"use server";

import { revalidatePath } from "next/cache";
import { CreditTransactionType, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getManagedCompanyIds, requireAdmin } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { sendCreditAddedEmail } from "@/lib/email/send";

export async function postCreditForm(formData: FormData) {
  await postCreditAdjustment({
    userId: String(formData.get("userId") ?? ""),
    amountStr: String(formData.get("amount") ?? ""),
    type: CreditTransactionType.CREDIT,
    note: String(formData.get("note") ?? "") || null,
  });
}

export async function listCreditOverview() {
  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  if (companyIds.length === 0) return [];

  return prisma.user.findMany({
    where: {
      userCompanies: { some: { companyId: { in: companyIds } } },
    },
    select: {
      id: true,
      email: true,
      active: true,
      creditBalance: true,
    },
    orderBy: { email: "asc" },
  });
}

export async function listCreditTransactions(filters?: { userId?: string }) {
  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  const scopedUsers = await prisma.user.findMany({
    where: {
      ...(companyIds.length
        ? { userCompanies: { some: { companyId: { in: companyIds } } } }
        : { id: { in: [] } }),
    },
    select: { id: true },
  });
  const allowed = new Set(scopedUsers.map((u) => u.id));
  if (filters?.userId && !allowed.has(filters.userId)) {
    return [];
  }
  const userFilter = filters?.userId
    ? { userId: filters.userId }
    : { userId: { in: [...allowed] } };

  return prisma.creditTransaction.findMany({
    where: userFilter,
    include: {
      user: { select: { email: true } },
      createdBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function postCreditAdjustment(input: {
  userId: string;
  amountStr: string;
  type: CreditTransactionType;
  note?: string | null;
}) {
  const { user } = await requireAdmin();
  const target = await prisma.user.findFirst({
    where: { id: input.userId },
    select: { id: true, email: true, role: true, emailVerifiedAt: true },
  });
  if (!target) throw new Error("Colaborador nao encontrado.");
  const companyIds = await getManagedCompanyIds(user.id);
  if (companyIds.length === 0) throw new Error("Cadastre uma empresa antes.");
  const linked = await prisma.userCompany.findFirst({
    where: { userId: input.userId, companyId: { in: companyIds } },
  });
  if (!linked) throw new Error("Colaborador fora do seu escopo administrativo.");

  const raw = input.amountStr.replace(/\s/g, "").replace("R$", "").replace(",", ".");
  const amountNum = Number(raw);
  if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error("Valor inválido.");
  const amount = new Prisma.Decimal(amountNum);

  let nextBalanceNumber = 0;
  await prisma.$transaction(async (tx) => {
    await tx.creditBalance.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, balance: 0 },
      update: {},
    });

    const bal = await tx.creditBalance.findUniqueOrThrow({
      where: { userId: input.userId },
    });
    const current = new Prisma.Decimal(bal.balance.toString());
    let next = current;
    if (input.type === CreditTransactionType.CREDIT) {
      next = current.plus(amount);
    } else if (input.type === CreditTransactionType.DEBIT) {
      next = current.minus(amount);
    } else {
      next = amount;
    }
    if (next.lessThan(0)) throw new Error("Saldo não pode ficar negativo.");

    await tx.creditBalance.update({
      where: { userId: input.userId },
      data: { balance: next },
    });
    nextBalanceNumber = Number(next.toString());

    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        amount,
        type: input.type,
        note: input.note?.trim() || null,
        createdById: user.id,
      },
    });
  });

  if (input.type === CreditTransactionType.CREDIT && target.role === Role.USER && target.emailVerifiedAt) {
    try {
      await sendCreditAddedEmail({
        to: target.email,
        amountLabel: formatBRL(amountNum),
        balanceLabel: formatBRL(nextBalanceNumber),
        note: input.note?.trim() || null,
        grantedByEmail: user.email,
      });
    } catch (error) {
      console.error("[credits] falha ao enviar e-mail de crédito:", error);
    }
  }

  revalidatePath("/admin/credits");
}

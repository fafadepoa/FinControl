"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { CreditTransactionType, ExpenseStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getLinkedCompanyIds,
  getManagedCompanyIds,
  requireAdmin,
  requireAuth,
} from "@/lib/session";
import { parseMoneyBR } from "@/lib/money";

const RECEIPT_DIR = path.join(process.cwd(), "uploads", "receipts");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

async function saveReceipt(file: File | null | undefined): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Arquivo muito grande (máx. 5 MB).");
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) throw new Error("Use PDF ou imagem (JPEG, PNG, WebP ou GIF).");
  await mkdir(RECEIPT_DIR, { recursive: true });
  const ext =
    type === "application/pdf"
      ? "pdf"
      : type === "image/png"
        ? "png"
        : type === "image/webp"
          ? "webp"
          : type === "image/gif"
            ? "gif"
            : "jpg";
  const name = `${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const full = path.join(RECEIPT_DIR, name);
  await writeFile(full, buf);
  return `/api/receipts/${name}`;
}

export async function createExpense(input: {
  amountStr: string;
  companyId: string;
  categoryId: string;
  description?: string | null;
  receipt?: File | null;
}) {
  const { session, user } = await requireAuth();
  const linked = await getLinkedCompanyIds(user.id);
  if (!linked.includes(input.companyId)) {
    throw new Error("Empresa inválida para este usuário.");
  }

  const amount = parseMoneyBR(input.amountStr);
  if (amount === null || amount === 0) throw new Error("Informe um valor válido.");

  const category = await prisma.category.findFirst({
    where: {
      id: input.categoryId,
      companyId: input.companyId,
      active: true,
    },
  });
  if (!category) throw new Error("Categoria inválida.");

  const attachmentUrl = await saveReceipt(input.receipt ?? null);

  await prisma.expense.create({
    data: {
      userId: user.id,
      companyId: input.companyId,
      categoryId: category.id,
      amount,
      description: input.description?.trim() || null,
      status: ExpenseStatus.PENDING,
      attachmentUrl,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/admin");
  revalidatePath("/admin/expenses");
}

export async function listMyExpenses() {
  const { user } = await requireAuth();
  return prisma.expense.findMany({
    where: { userId: user.id },
    include: { company: true, category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAdminExpenses(filters?: {
  status?: ExpenseStatus;
  companyId?: string;
  userId?: string;
}) {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (companyIds.length === 0) return [];

  return prisma.expense.findMany({
    where: {
      companyId: { in: companyIds },
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.companyId && companyIds.includes(filters.companyId)
        ? { companyId: filters.companyId }
        : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
    },
    include: {
      company: true,
      category: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          creditBalance: { select: { balance: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function assertAdminOwnsExpense(adminId: string, expenseId: string) {
  const companyIds = await getManagedCompanyIds(adminId);
  const exp = await prisma.expense.findFirst({
    where: { id: expenseId, companyId: { in: companyIds } },
  });
  if (!exp) throw new Error("Despesa não encontrada.");
  return exp;
}

export async function approveExpense(expenseId: string) {
  const { user } = await requireAdmin();
  const exp = await assertAdminOwnsExpense(user.id, expenseId);
  if (exp.status !== ExpenseStatus.PENDING) throw new Error("Status inválido para aprovação.");
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: ExpenseStatus.APPROVED, approvedAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/expenses");
  revalidatePath("/expenses");
}

export async function rejectExpense(expenseId: string) {
  const { user } = await requireAdmin();
  const exp = await assertAdminOwnsExpense(user.id, expenseId);
  if (exp.status !== ExpenseStatus.PENDING) throw new Error("Status inválido para rejeição.");
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: ExpenseStatus.REJECTED },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/expenses");
  revalidatePath("/expenses");
}

export async function payExpense(expenseId: string) {
  const { user } = await requireAdmin();
  const exp = await assertAdminOwnsExpense(user.id, expenseId);
  if (exp.status !== ExpenseStatus.APPROVED) throw new Error("Só é possível pagar despesas aprovadas.");
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: ExpenseStatus.PAID, paidAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/expenses");
  revalidatePath("/expenses");
}

function statusMutation(nextStatus: ExpenseStatus, now: Date) {
  if (nextStatus === ExpenseStatus.PENDING) {
    return {
      status: ExpenseStatus.PENDING,
      approvedAt: null,
      paidAt: null,
    };
  }
  if (nextStatus === ExpenseStatus.APPROVED) {
    return {
      status: ExpenseStatus.APPROVED,
      approvedAt: now,
      paidAt: null,
    };
  }
  if (nextStatus === ExpenseStatus.REJECTED) {
    return {
      status: ExpenseStatus.REJECTED,
      approvedAt: null,
      paidAt: null,
    };
  }
  return {
    status: ExpenseStatus.PAID,
    approvedAt: now,
    paidAt: now,
  };
}

export async function setExpenseStatusForm(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const nextRaw = String(formData.get("nextStatus") ?? "");
  if (!expenseId) throw new Error("Despesa inválida.");
  if (!Object.values(ExpenseStatus).includes(nextRaw as ExpenseStatus)) {
    throw new Error("Status inválido.");
  }
  const nextStatus = nextRaw as ExpenseStatus;

  const { user } = await requireAdmin();
  await assertAdminOwnsExpense(user.id, expenseId);

  const now = new Date();
  await prisma.expense.update({
    where: { id: expenseId },
    data: statusMutation(nextStatus, now),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/expenses");
  revalidatePath("/expenses");
}

export async function payExpenseWithCredit(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  if (!expenseId) throw new Error("Despesa inválida.");

  const { user } = await requireAdmin();
  const exp = await assertAdminOwnsExpense(user.id, expenseId);
  if (exp.status !== ExpenseStatus.APPROVED) {
    throw new Error("Pagamento por crédito só é permitido para despesas aprovadas.");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const balance = await tx.creditBalance.upsert({
      where: { userId: exp.userId },
      create: { userId: exp.userId, balance: 0 },
      update: {},
    });
    const current = new Prisma.Decimal(balance.balance.toString());
    const amount = new Prisma.Decimal(exp.amount.toString());
    if (current.lessThan(amount)) {
      throw new Error("Saldo de crédito insuficiente para este pagamento.");
    }

    const next = current.minus(amount);
    await tx.creditBalance.update({
      where: { userId: exp.userId },
      data: { balance: next },
    });

    await tx.creditTransaction.create({
      data: {
        userId: exp.userId,
        amount,
        type: CreditTransactionType.DEBIT,
        note: `Pagamento por crédito da despesa ${exp.id}`,
        createdById: user.id,
      },
    });

    await tx.expense.update({
      where: { id: exp.id },
      data: {
        status: ExpenseStatus.PAID,
        approvedAt: exp.approvedAt ?? now,
        paidAt: now,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/credits");
  revalidatePath("/expenses");
}

export async function getAdminExpenseStats() {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  const empty = {
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    total: 0,
    totalAmount: 0,
  };
  if (companyIds.length === 0) return empty;

  const grouped = await prisma.expense.groupBy({
    by: ["status"],
    where: { companyId: { in: companyIds } },
    _count: { _all: true },
    _sum: { amount: true },
  });

  const counts: Record<string, number> = {};
  let totalAmount = 0;
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    totalAmount += Number(g._sum.amount ?? 0);
  }

  const total = grouped.reduce((a, g) => a + g._count._all, 0);

  return {
    pending: counts[ExpenseStatus.PENDING] ?? 0,
    approved: counts[ExpenseStatus.APPROVED] ?? 0,
    rejected: counts[ExpenseStatus.REJECTED] ?? 0,
    paid: counts[ExpenseStatus.PAID] ?? 0,
    total,
    totalAmount,
  };
}

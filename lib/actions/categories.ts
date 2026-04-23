"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CategoryKind, FuelEntryMode, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getManagedCompanyIds, requireAdmin } from "@/lib/session";

const DEFAULT_CATEGORY_TEMPLATES = [
  { name: "Pedágio", kind: CategoryKind.DEFAULT },
  { name: "Alimentação", kind: CategoryKind.DEFAULT },
  { name: "Hospedagem", kind: CategoryKind.DEFAULT },
  { name: "Combustível", kind: CategoryKind.FUEL },
  { name: "Transporte", kind: CategoryKind.DEFAULT },
] as const;

function normalizeCategoryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function parseLimit(value?: string | null) {
  if (!value?.trim()) return null;
  const normalized = value
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) throw new Error("Limite inválido.");
  return new Prisma.Decimal(n);
}

function parseFuelEntryMode(raw: string | null | undefined): FuelEntryMode {
  const v = (raw ?? "").trim().toUpperCase();
  if (v === "DAILY") return FuelEntryMode.DAILY;
  if (v === "KM") return FuelEntryMode.KM;
  return FuelEntryMode.FREE;
}

function normalizeFuelPaymentForCategory(input: {
  kind: CategoryKind;
  paymentRule: FuelEntryMode;
  limitAmount: Prisma.Decimal | null;
  dailyRate: Prisma.Decimal | null;
  kmRate: Prisma.Decimal | null;
}) {
  if (input.kind !== CategoryKind.FUEL) {
    return {
      paymentRule: FuelEntryMode.FREE,
      dailyRate: null as Prisma.Decimal | null,
      kmRate: null as Prisma.Decimal | null,
      limitAmount: input.limitAmount,
    };
  }
  if (input.paymentRule === FuelEntryMode.DAILY) {
    if (!input.dailyRate || input.dailyRate.lte(0)) {
      throw new Error("Informe o valor pago por diária (maior que zero).");
    }
    return {
      paymentRule: FuelEntryMode.DAILY,
      dailyRate: input.dailyRate,
      kmRate: null,
      limitAmount: null,
    };
  }
  if (input.paymentRule === FuelEntryMode.KM) {
    if (!input.kmRate || input.kmRate.lte(0)) {
      throw new Error("Informe o valor pago por km (maior que zero).");
    }
    return {
      paymentRule: FuelEntryMode.KM,
      dailyRate: null,
      kmRate: input.kmRate,
      limitAmount: null,
    };
  }
  return {
    paymentRule: FuelEntryMode.FREE,
    dailyRate: null,
    kmRate: null,
    limitAmount: input.limitAmount,
  };
}

function getDefaultTemplateByName(name: string) {
  const normalized = normalizeCategoryName(name);
  return DEFAULT_CATEGORY_TEMPLATES.find((tpl) => normalizeCategoryName(tpl.name) === normalized) ?? null;
}

function resolveCategoryPayload(input: {
  mode: "template" | "custom";
  templateName?: string;
  customName?: string;
  customIsFuel?: boolean;
}) {
  if (input.mode === "template") {
    const template = getDefaultTemplateByName(input.templateName ?? "");
    if (!template) throw new Error("Selecione uma categoria padrão válida.");
    return { name: template.name, kind: template.kind };
  }

  const customName = (input.customName ?? "").trim();
  if (customName.length < 2) throw new Error("Informe o nome da categoria (mínimo 2 caracteres).");
  return {
    name: customName,
    kind: input.customIsFuel ? CategoryKind.FUEL : CategoryKind.CUSTOM,
  };
}

async function assertCategoryScope(categoryId: string, allowedCompanyIds: string[]) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, companyId: { in: allowedCompanyIds } },
  });
  if (!category) throw new Error("Categoria não encontrada.");
  return category;
}

async function validateAllowedUsers(companyId: string, userIds: string[]) {
  if (userIds.length === 0) return [];
  const rows = await prisma.user.findMany({
    where: {
      role: "USER",
      id: { in: userIds },
      userCompanies: { some: { companyId } },
    },
    select: { id: true },
  });
  if (rows.length !== userIds.length) throw new Error("Usuário inválido na seleção.");
  return rows.map((row) => row.id);
}

function parseTargetUserIdsByCompany(formData: FormData) {
  const byCompany: Record<string, string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("targetUserIds__")) continue;
    const companyId = key.slice("targetUserIds__".length);
    const userId = String(value ?? "").trim();
    if (!companyId || !userId) continue;
    if (!byCompany[companyId]) byCompany[companyId] = [];
    byCompany[companyId].push(userId);
  }
  return byCompany;
}

function normalizeUniqueIds(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function pickScopedTargetCompanies(input: {
  sourceCompanyId: string;
  targetCompanyIds: string[];
  allowedCompanyIds: string[];
}) {
  return normalizeUniqueIds(input.targetCompanyIds).filter(
    (companyId) => companyId !== input.sourceCompanyId && input.allowedCompanyIds.includes(companyId),
  );
}

async function findCategoryByNormalizedName(
  tx: Prisma.TransactionClient,
  companyId: string,
  categoryName: string,
) {
  const rows = await tx.category.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });
  const normalized = normalizeCategoryName(categoryName);
  return rows.find((row) => normalizeCategoryName(row.name) === normalized) ?? null;
}

async function assertNoNormalizedDuplicate(companyId: string, nextName: string, ignoreCategoryId?: string) {
  const existing = await prisma.category.findMany({
    where: {
      companyId,
      ...(ignoreCategoryId ? { id: { not: ignoreCategoryId } } : {}),
    },
    select: { id: true, name: true },
  });
  const normalized = normalizeCategoryName(nextName);
  if (existing.some((row) => normalizeCategoryName(row.name) === normalized)) {
    throw new Error("Já existe uma categoria com este nome nesta empresa.");
  }
}

export async function ensureDefaultCategoriesForCompany(companyId: string) {
  const existing = await prisma.category.findMany({
    where: { companyId },
    select: { name: true, kind: true },
  });
  const existingNormalized = new Set(existing.map((c) => normalizeCategoryName(c.name)));
  const missing = DEFAULT_CATEGORY_TEMPLATES.filter(
    (template) => !existingNormalized.has(normalizeCategoryName(template.name))
  );
  if (missing.length === 0) return 0;

  await prisma.category.createMany({
    data: missing.map((template) => ({
      companyId,
      name: template.name,
      kind: template.kind,
      paymentRule: FuelEntryMode.FREE,
      active: true,
    })),
    skipDuplicates: true,
  });
  return missing.length;
}

export async function backfillDefaultCategories() {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (companyIds.length === 0) return 0;

  let created = 0;
  for (const companyId of companyIds) {
    created += await ensureDefaultCategoriesForCompany(companyId);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/expenses/new");
  return created;
}

export async function backfillDefaultCategoriesForm() {
  const created = await backfillDefaultCategories();
  redirect(`/admin/categories?defaultsApplied=1&defaultsCreated=${created}`);
}

export async function resetManagedCategoriesAndExpenses() {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (companyIds.length === 0) return { deletedExpenses: 0, deletedCategories: 0 };

  const [deletedExpenses, deletedCategories] = await prisma.$transaction(async (tx) => {
    const expenses = await tx.expense.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    const categories = await tx.category.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    return [expenses.count, categories.count] as const;
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/expenses");
  revalidatePath("/expenses/new");
  revalidatePath("/expenses/history");
  revalidatePath("/expenses");
  return { deletedExpenses, deletedCategories };
}

export async function resetManagedCategoriesAndExpensesForm(formData: FormData) {
  if (formData.get("confirmReset") !== "on") {
    throw new Error("Confirme a limpeza antes de continuar.");
  }
  const result = await resetManagedCategoriesAndExpenses();
  const qs = new URLSearchParams({
    resetDone: "1",
    deletedExpenses: String(result.deletedExpenses),
    deletedCategories: String(result.deletedCategories),
  });
  redirect(`/admin/categories?${qs.toString()}`);
}

export async function listCompanyUsersForCategories() {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (companyIds.length === 0) return [];

  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: {
      id: true,
      name: true,
      userCompanies: {
        where: { user: { role: "USER" } },
        select: {
          user: {
            select: { id: true, email: true, displayName: true, active: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    users: company.userCompanies
      .map((row) => row.user)
      .sort((a, b) =>
        (a.displayName?.trim() || a.email).localeCompare(b.displayName?.trim() || b.email, "pt-BR")
      ),
  }));
}

export async function listCategories(filters?: { companyId?: string; active?: boolean; name?: string }) {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (companyIds.length === 0) return [];

  return prisma.category.findMany({
    where: {
      companyId: { in: companyIds },
      ...(filters?.companyId && companyIds.includes(filters.companyId)
        ? { companyId: filters.companyId }
        : {}),
      ...(filters?.active !== undefined ? { active: filters.active } : {}),
      ...(filters?.name?.trim()
        ? { name: { contains: filters.name.trim() } }
        : {}),
    },
    include: {
      company: { select: { name: true } },
      categoryUsers: {
        include: { user: { select: { id: true, email: true, displayName: true, active: true } } },
        orderBy: { userId: "asc" },
      },
      _count: { select: { categoryUsers: true, expenses: true } },
    },
    orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
  });
}

export async function createCategoryForm(formData: FormData) {
  await createCategory({
    companyId: String(formData.get("companyId") ?? ""),
    mode: String(formData.get("mode") ?? "template") === "custom" ? "custom" : "template",
    templateName: String(formData.get("templateName") ?? ""),
    customName: String(formData.get("customName") ?? ""),
    customIsFuel: formData.get("customIsFuel") === "on",
    userIds: formData.getAll("userIds").map(String).filter(Boolean),
    targetCompanyIds: formData.getAll("targetCompanyIds").map(String).filter(Boolean),
    targetUserIdsByCompany: parseTargetUserIdsByCompany(formData),
    limitAmount: String(formData.get("limitAmount") ?? "") || null,
    paymentRule: parseFuelEntryMode(String(formData.get("paymentRule") ?? "FREE")),
    dailyRate: String(formData.get("dailyRate") ?? "") || null,
    kmRate: String(formData.get("kmRate") ?? "") || null,
  });
}

export async function updateCategoryForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await updateCategory(id, {
    name: String(formData.get("name") ?? ""),
    kind:
      String(formData.get("kind") ?? "") === CategoryKind.FUEL
        ? CategoryKind.FUEL
        : String(formData.get("kind") ?? "") === CategoryKind.DEFAULT
          ? CategoryKind.DEFAULT
          : CategoryKind.CUSTOM,
    limitAmount: String(formData.get("limitAmount") ?? "") || null,
    paymentRule: parseFuelEntryMode(String(formData.get("paymentRule") ?? "FREE")),
    dailyRate: String(formData.get("dailyRate") ?? "") || null,
    kmRate: String(formData.get("kmRate") ?? "") || null,
    userIds: formData.getAll("userIds").map(String).filter(Boolean),
    targetCompanyIds: formData.getAll("targetCompanyIds").map(String).filter(Boolean),
    targetUserIdsByCompany: parseTargetUserIdsByCompany(formData),
    active: formData.get("active") === "on",
  });
}

export async function createCategory(data: {
  companyId: string;
  mode: "template" | "custom";
  templateName?: string;
  customName?: string;
  customIsFuel?: boolean;
  userIds?: string[];
  targetCompanyIds?: string[];
  targetUserIdsByCompany?: Record<string, string[]>;
  limitAmount?: string | null;
  paymentRule?: FuelEntryMode;
  dailyRate?: string | null;
  kmRate?: string | null;
  active?: boolean;
}) {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (!companyIds.includes(data.companyId)) throw new Error("Empresa inválida.");
  const resolved = resolveCategoryPayload({
    mode: data.mode,
    templateName: data.templateName,
    customName: data.customName,
    customIsFuel: data.customIsFuel,
  });
  const limit = parseLimit(data.limitAmount);
  const daily = data.dailyRate?.trim() ? parseLimit(data.dailyRate) : null;
  const km = data.kmRate?.trim() ? parseLimit(data.kmRate) : null;
  const payment = normalizeFuelPaymentForCategory({
    kind: resolved.kind,
    paymentRule: data.paymentRule ?? FuelEntryMode.FREE,
    limitAmount: limit,
    dailyRate: daily,
    kmRate: km,
  });
  const targetCompanies = pickScopedTargetCompanies({
    sourceCompanyId: data.companyId,
    targetCompanyIds: data.targetCompanyIds ?? [],
    allowedCompanyIds: companyIds,
  });
  const allCompanyIds = [data.companyId, ...targetCompanies];

  await prisma.$transaction(async (tx) => {
    for (const companyId of allCompanyIds) {
      const existing = await findCategoryByNormalizedName(tx, companyId, resolved.name);
      const validUsers = await validateAllowedUsers(
        companyId,
        companyId === data.companyId
          ? normalizeUniqueIds(data.userIds ?? [])
          : normalizeUniqueIds(data.targetUserIdsByCompany?.[companyId] ?? []),
      );
      const record = existing
        ? await tx.category.update({
            where: { id: existing.id },
            data: {
              name: resolved.name,
              kind: resolved.kind,
              paymentRule: payment.paymentRule,
              dailyRate: payment.dailyRate,
              kmRate: payment.kmRate,
              limitAmount: payment.limitAmount,
              active: data.active ?? true,
            },
            select: { id: true },
          })
        : await tx.category.create({
            data: {
              companyId,
              name: resolved.name,
              kind: resolved.kind,
              paymentRule: payment.paymentRule,
              dailyRate: payment.dailyRate,
              kmRate: payment.kmRate,
              limitAmount: payment.limitAmount,
              active: data.active ?? true,
            },
            select: { id: true },
          });

      await tx.categoryUser.deleteMany({ where: { categoryId: record.id } });
      if (validUsers.length > 0) {
        await tx.categoryUser.createMany({
          data: validUsers.map((userId) => ({ categoryId: record.id, userId })),
          skipDuplicates: true,
        });
      }
    }
  });
  revalidatePath("/admin/categories");
  revalidatePath("/expenses/new");
  revalidatePath("/expenses/history");
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    kind: CategoryKind;
    limitAmount?: string | null;
    paymentRule?: FuelEntryMode;
    dailyRate?: string | null;
    kmRate?: string | null;
    userIds?: string[];
    targetCompanyIds?: string[];
    targetUserIdsByCompany?: Record<string, string[]>;
    active?: boolean;
  }
) {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  const cat = await assertCategoryScope(id, companyIds);
  const name = data.name.trim();
  if (!name) throw new Error("Nome é obrigatório.");
  await assertNoNormalizedDuplicate(cat.companyId, name, cat.id);
  const limit = parseLimit(data.limitAmount);
  const daily = data.dailyRate?.trim() ? parseLimit(data.dailyRate) : null;
  const km = data.kmRate?.trim() ? parseLimit(data.kmRate) : null;
  const payment = normalizeFuelPaymentForCategory({
    kind: data.kind,
    paymentRule: data.paymentRule ?? FuelEntryMode.FREE,
    limitAmount: limit,
    dailyRate: daily,
    kmRate: km,
  });
  const allowedUsers = await validateAllowedUsers(cat.companyId, normalizeUniqueIds(data.userIds ?? []));
  const targetCompanies = pickScopedTargetCompanies({
    sourceCompanyId: cat.companyId,
    targetCompanyIds: data.targetCompanyIds ?? [],
    allowedCompanyIds: companyIds,
  });

  await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id },
      data: {
        name,
        kind: data.kind,
        paymentRule: payment.paymentRule,
        dailyRate: payment.dailyRate,
        kmRate: payment.kmRate,
        limitAmount: payment.limitAmount,
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    await tx.categoryUser.deleteMany({ where: { categoryId: id } });
    if (allowedUsers.length > 0) {
      await tx.categoryUser.createMany({
        data: allowedUsers.map((userId) => ({ categoryId: id, userId })),
        skipDuplicates: true,
      });
    }

    for (const companyId of targetCompanies) {
      const existing = await findCategoryByNormalizedName(tx, companyId, name);
      const validUsers = await validateAllowedUsers(
        companyId,
        normalizeUniqueIds(data.targetUserIdsByCompany?.[companyId] ?? []),
      );
      const record = existing
        ? await tx.category.update({
            where: { id: existing.id },
            data: {
              name,
              kind: data.kind,
              paymentRule: payment.paymentRule,
              dailyRate: payment.dailyRate,
              kmRate: payment.kmRate,
              limitAmount: payment.limitAmount,
              ...(data.active !== undefined ? { active: data.active } : {}),
            },
            select: { id: true },
          })
        : await tx.category.create({
            data: {
              companyId,
              name,
              kind: data.kind,
              paymentRule: payment.paymentRule,
              dailyRate: payment.dailyRate,
              kmRate: payment.kmRate,
              limitAmount: payment.limitAmount,
              active: data.active ?? true,
            },
            select: { id: true },
          });

      await tx.categoryUser.deleteMany({ where: { categoryId: record.id } });
      if (validUsers.length > 0) {
        await tx.categoryUser.createMany({
          data: validUsers.map((userId) => ({ categoryId: record.id, userId })),
          skipDuplicates: true,
        });
      }
    }
  });
  revalidatePath("/admin/categories");
  revalidatePath("/expenses/new");
  revalidatePath("/expenses/history");
}

export async function getCategoryForEdit(categoryId: string) {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (companyIds.length === 0) return null;

  return prisma.category.findFirst({
    where: { id: categoryId, companyId: { in: companyIds } },
    include: {
      company: { select: { id: true, name: true } },
      categoryUsers: { select: { userId: true } },
    },
  });
}

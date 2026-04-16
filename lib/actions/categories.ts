"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getManagedCompanyIds, requireAdmin } from "@/lib/session";

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
    include: { company: { select: { name: true } } },
    orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
  });
}

export async function createCategoryForm(formData: FormData) {
  await createCategory({
    companyId: String(formData.get("companyId") ?? ""),
    name: String(formData.get("name") ?? ""),
    limitAmount: String(formData.get("limitAmount") ?? "") || null,
  });
}

export async function updateCategoryForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await updateCategory(id, {
    name: String(formData.get("name") ?? ""),
    limitAmount: String(formData.get("limitAmount") ?? "") || null,
    active: formData.get("active") === "on",
  });
}

export async function createCategory(data: {
  companyId: string;
  name: string;
  limitAmount?: string | null;
  active?: boolean;
}) {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  if (!companyIds.includes(data.companyId)) throw new Error("Empresa inválida.");
  const name = data.name.trim();
  if (!name) throw new Error("Nome é obrigatório.");
  let limit: Prisma.Decimal | null = null;
  if (data.limitAmount?.trim()) {
    const n = Number(data.limitAmount.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) throw new Error("Limite inválido.");
    limit = new Prisma.Decimal(n);
  }
  await prisma.category.create({
    data: {
      companyId: data.companyId,
      name,
      limitAmount: limit,
      active: data.active ?? true,
    },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/expenses/new");
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    limitAmount?: string | null;
    active?: boolean;
  }
) {
  const { user } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(user.id);
  const cat = await prisma.category.findFirst({
    where: { id, companyId: { in: companyIds } },
  });
  if (!cat) throw new Error("Categoria não encontrada.");
  const name = data.name.trim();
  if (!name) throw new Error("Nome é obrigatório.");
  let limit: Prisma.Decimal | null = null;
  if (data.limitAmount?.trim()) {
    const n = Number(data.limitAmount.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) throw new Error("Limite inválido.");
    limit = new Prisma.Decimal(n);
  } else {
    limit = null;
  }
  await prisma.category.update({
    where: { id },
    data: {
      name,
      limitAmount: limit,
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/expenses/new");
}

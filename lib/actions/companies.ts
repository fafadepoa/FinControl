"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function listCompanies(filters?: { name?: string; cnpj?: string }) {
  const { user } = await requireAdmin();
  return prisma.company.findMany({
    where: {
      createdById: user.id,
      ...(filters?.name?.trim() ? { name: { contains: filters.name.trim() } } : {}),
      ...(filters?.cnpj?.trim() ? { cnpj: { contains: filters.cnpj.trim() } } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { userCompanies: true, categories: true, expenses: true } },
    },
  });
}

export async function getCompanyForEdit(id: string) {
  const { user } = await requireAdmin();
  return prisma.company.findFirst({
    where: { id, createdById: user.id },
    include: {
      _count: { select: { userCompanies: true, categories: true, expenses: true } },
    },
  });
}

export async function createCompanyForm(formData: FormData) {
  await createCompany({
    name: String(formData.get("name") ?? ""),
    cnpj: String(formData.get("cnpj") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
  });
}

export async function createCompany(data: {
  name: string;
  cnpj?: string | null;
  phone?: string | null;
}) {
  const { user } = await requireAdmin();
  const name = data.name.trim();
  if (!name) throw new Error("Nome é obrigatório.");
  await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name,
        cnpj: data.cnpj?.trim() || null,
        phone: data.phone?.trim() || null,
        createdById: user.id,
      },
      select: { id: true },
    });
    await tx.userCompany.upsert({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
      update: {},
      create: { userId: user.id, companyId: company.id },
    });
  });
  revalidatePath("/admin/companies");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/cost-centers");
  revalidatePath("/expenses");
  revalidatePath("/expenses/new");
}

export async function updateCompanyForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await updateCompany(id, {
    name: String(formData.get("name") ?? ""),
    cnpj: String(formData.get("cnpj") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
  });
}

export async function updateCompany(
  id: string,
  data: { name: string; cnpj?: string | null; phone?: string | null }
) {
  const { user } = await requireAdmin();
  const name = data.name.trim();
  if (!name) throw new Error("Nome é obrigatório.");
  const row = await prisma.company.findFirst({
    where: { id, createdById: user.id },
  });
  if (!row) throw new Error("Empresa não encontrada.");
  await prisma.company.update({
    where: { id },
    data: {
      name,
      cnpj: data.cnpj?.trim() || null,
      phone: data.phone?.trim() || null,
    },
  });
  revalidatePath("/admin/companies");
  revalidatePath("/admin/cost-centers");
}

export async function deleteCompanyForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteCompany(id);
}

export async function deleteCompany(id: string) {
  const { user } = await requireAdmin();
  const row = await prisma.company.findFirst({
    where: { id, createdById: user.id },
  });
  if (!row) throw new Error("Empresa não encontrada.");
  await prisma.company.delete({ where: { id } });
  revalidatePath("/admin/companies");
  revalidatePath("/admin/cost-centers");
}

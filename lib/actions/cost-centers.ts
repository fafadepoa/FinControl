"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function linkUserForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  if (!userId || !companyId) return;
  await linkUserToCompany(userId, companyId);
}

export async function linkUsersBatchForm(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const userIds = formData.getAll("userIds").map(String).filter(Boolean);
  if (!companyId || userIds.length === 0) return;
  await linkUsersToCompanyBatch(userIds, companyId);
}

export async function unlinkUserForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  if (!userId || !companyId) return;
  await unlinkUserFromCompany(userId, companyId);
}

export async function listCostCenterMatrix() {
  const { user } = await requireAdmin();
  const companies = await prisma.company.findMany({
    where: { createdById: user.id },
    orderBy: { name: "asc" },
    include: {
      userCompanies: {
        include: {
          user: {
            select: { id: true, email: true, active: true, role: true },
          },
        },
      },
    },
  });
  return companies;
}

export async function linkUserToCompany(userId: string, companyId: string) {
  const { user } = await requireAdmin();
  const ok = await prisma.company.findFirst({
    where: { id: companyId, createdById: user.id },
  });
  if (!ok) throw new Error("Empresa inválida.");
  const target = await prisma.user.findFirst({
    where: { id: userId, role: "USER" },
  });
  if (!target) throw new Error("Colaborador invalido.");
  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId, companyId } },
    update: {},
    create: { userId, companyId },
  });
  revalidatePath("/admin/cost-centers");
  revalidatePath("/expenses/new");
}

export async function linkUsersToCompanyBatch(userIds: string[], companyId: string) {
  const { user } = await requireAdmin();
  const ok = await prisma.company.findFirst({
    where: { id: companyId, createdById: user.id },
    select: { id: true },
  });
  if (!ok) throw new Error("Empresa inválida.");

  const targets = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "USER" },
    select: { id: true },
  });
  if (targets.length === 0) throw new Error("Nenhum colaborador válido selecionado.");

  await prisma.userCompany.createMany({
    data: targets.map((target) => ({ userId: target.id, companyId })),
    skipDuplicates: true,
  });

  revalidatePath("/admin/cost-centers");
  revalidatePath("/expenses/new");
}

export async function unlinkUserFromCompany(userId: string, companyId: string) {
  const { user } = await requireAdmin();
  const ok = await prisma.company.findFirst({
    where: { id: companyId, createdById: user.id },
  });
  if (!ok) throw new Error("Empresa inválida.");
  await prisma.userCompany.deleteMany({ where: { userId, companyId } });
  revalidatePath("/admin/cost-centers");
  revalidatePath("/expenses/new");
}

export async function listUsersForLink() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, email: true, active: true },
    orderBy: { email: "asc" },
  });
}

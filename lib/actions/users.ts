"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getManagedCompanyIds, requireAdmin } from "@/lib/session";

export async function createUserForm(formData: FormData) {
  const companyIds = formData.getAll("companyIds").map(String).filter(Boolean);
  await createUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    companyIds,
  });
}

export async function setUserActiveForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const active = formData.get("active") === "true";
  if (!userId) return;
  await setUserActive(userId, active);
}

export async function setUserCreditBalanceVisibilityForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Colaborador invalido.");
  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  if (companyIds.length === 0) throw new Error("Cadastre uma empresa antes.");
  const target = await prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.USER,
      userCompanies: { some: { companyId: { in: companyIds } } },
    },
  });
  if (!target) throw new Error("Colaborador nao encontrado.");
  const visible = formData.has("creditBalanceVisibleToSelf");
  await prisma.user.update({
    where: { id: userId },
    data: { creditBalanceVisibleToSelf: visible },
  });
  revalidatePath("/admin/users");
  revalidatePath("/expenses/new");
}

export async function listUsers(filters?: { active?: boolean; email?: string }) {
  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  if (companyIds.length === 0) return [];

  return prisma.user.findMany({
    where: {
      role: Role.USER,
      userCompanies: { some: { companyId: { in: companyIds } } },
      ...(filters?.active !== undefined ? { active: filters.active } : {}),
      ...(filters?.email?.trim()
        ? { email: { contains: filters.email.trim().toLowerCase() } }
        : {}),
    },
    include: {
      userCompanies: { include: { company: { select: { id: true, name: true } } } },
      creditBalance: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  companyIds: string[];
}) {
  const { user: admin } = await requireAdmin();
  const email = data.email.toLowerCase().trim();
  if (!email) throw new Error("E-mail é obrigatório.");
  if (!data.password || data.password.length < 6) throw new Error("Senha mínima de 6 caracteres.");
  const companyIds = await prisma.company.findMany({
    where: { createdById: admin.id, id: { in: data.companyIds } },
    select: { id: true },
  });
  if (companyIds.length === 0) throw new Error("Selecione ao menos uma empresa.");

  const passwordHash = await hash(data.password, 10);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.USER,
      active: true,
      emailVerifiedAt: new Date(),
      userCompanies: {
        create: companyIds.map((c) => ({ companyId: c.id })),
      },
      creditBalance: { create: { balance: 0 } },
    },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/cost-centers");
  revalidatePath("/admin/credits");
  return created.id;
}

export async function setUserActive(userId: string, active: boolean) {
  await requireAdmin();
  const u = await prisma.user.findFirst({
    where: { id: userId, role: Role.USER },
  });
  if (!u) throw new Error("Colaborador nao encontrado.");
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/users");
}

/** Inativação lógica — preserva histórico */
export async function deactivateUser(userId: string) {
  await setUserActive(userId, false);
}

export async function deleteUser(userId: string) {
  await deactivateUser(userId);
}

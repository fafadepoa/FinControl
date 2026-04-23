"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getManagedCompanyIds, requireAdmin } from "@/lib/session";
import { createCollaboratorInvite } from "@/lib/auth/collaborator-invite";

export async function createUserForm(formData: FormData) {
  const companyIds = formData.getAll("companyIds").map(String).filter(Boolean);
  const result = await createUser({
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    companyIds,
  });
  const qs = new URLSearchParams({ criar: "1", created: "1" });
  if (result.inviteUrl) qs.set("inviteUrl", result.inviteUrl);
  redirect(`/admin/users?${qs.toString()}`);
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

export async function getCollaboratorStats() {
  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  const base = {
    role: Role.USER,
    userCompanies: { some: { companyId: { in: companyIds } } },
  };
  if (companyIds.length === 0) return { total: 0, active: 0, inactive: 0 };
  const [total, active, inactive] = await Promise.all([
    prisma.user.count({ where: base }),
    prisma.user.count({ where: { ...base, active: true } }),
    prisma.user.count({ where: { ...base, active: false } }),
  ]);
  return { total, active, inactive };
}

export async function listUsers(filters?: { active?: boolean; email?: string; name?: string }) {
  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  if (companyIds.length === 0) return [];

  const nameQ = filters?.name?.trim();
  const emailQ = filters?.email?.trim()?.toLowerCase();

  return prisma.user.findMany({
    where: {
      role: Role.USER,
      userCompanies: { some: { companyId: { in: companyIds } } },
      ...(filters?.active !== undefined ? { active: filters.active } : {}),
      ...(emailQ ? { email: { contains: emailQ } } : {}),
      ...(nameQ
        ? {
            OR: [
              { displayName: { contains: nameQ, mode: "insensitive" as const } },
              { email: { contains: nameQ.toLowerCase() } },
            ],
          }
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
  displayName: string;
  email: string;
  companyIds: string[];
}) {
  const { user: admin } = await requireAdmin();
  const displayName = data.displayName.trim();
  if (displayName.length < 2) throw new Error("Informe o nome do colaborador (mínimo 2 caracteres).");
  const email = data.email.toLowerCase().trim();
  if (!email) throw new Error("E-mail é obrigatório.");
  const companyIds = await prisma.company.findMany({
    where: { createdById: admin.id, id: { in: data.companyIds } },
    select: { id: true, name: true },
  });
  if (companyIds.length === 0) throw new Error("Selecione ao menos uma empresa.");
  const created = await prisma.user.create({
    data: {
      displayName,
      email,
      passwordHash: null,
      role: Role.USER,
      active: true,
      emailVerifiedAt: null,
      userCompanies: {
        create: companyIds.map((c) => ({ companyId: c.id })),
      },
      creditBalance: { create: { balance: 0 } },
    },
  });

  const invite = await createCollaboratorInvite({
    userId: created.id,
    email,
    displayName,
    companyNames: companyIds.map((c) => c.name),
    inviterLabel: admin.displayName?.trim() || admin.email,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/cost-centers");
  revalidatePath("/admin/credits");
  return { id: created.id, inviteUrl: invite.inviteUrl, invitationRequired: invite.invitationRequired };
}

export async function getCollaboratorForEdit(userId: string) {
  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  if (companyIds.length === 0) return null;
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.USER,
      userCompanies: { some: { companyId: { in: companyIds } } },
    },
    include: {
      userCompanies: { include: { company: { select: { id: true, name: true } } } },
    },
  });
}

export async function updateCollaboratorDetailsForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!userId) throw new Error("Colaborador invalido.");
  if (displayName.length < 2) throw new Error("Nome deve ter pelo menos 2 caracteres.");
  if (!email) throw new Error("E-mail obrigatorio.");

  const { user: admin } = await requireAdmin();
  const companyIds = await getManagedCompanyIds(admin.id);
  const target = await prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.USER,
      userCompanies: { some: { companyId: { in: companyIds } } },
    },
  });
  if (!target) throw new Error("Colaborador nao encontrado.");

  const other = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
    select: { id: true },
  });
  if (other) throw new Error("Ja existe outra conta com este e-mail.");

  await prisma.user.update({
    where: { id: userId },
    data: { displayName, email },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);
  redirect(`/admin/users/${userId}/edit`);
}

export async function updateCollaboratorCompaniesForm(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Colaborador invalido.");
  const companyIds = formData.getAll("companyIds").map(String).filter(Boolean);

  const { user: admin } = await requireAdmin();
  const managed = await getManagedCompanyIds(admin.id);
  const allowed = await prisma.company.findMany({
    where: { createdById: admin.id, id: { in: companyIds.length ? companyIds : [] } },
    select: { id: true },
  });
  if (companyIds.length === 0) throw new Error("Selecione ao menos uma empresa.");
  if (allowed.length !== companyIds.length) throw new Error("Empresa invalida na selecao.");

  const target = await prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.USER,
      userCompanies: { some: { companyId: { in: managed } } },
    },
  });
  if (!target) throw new Error("Colaborador nao encontrado.");

  await prisma.$transaction([
    prisma.userCompany.deleteMany({ where: { userId } }),
    prisma.userCompany.createMany({
      data: allowed.map((c) => ({ userId, companyId: c.id })),
    }),
  ]);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);
  revalidatePath("/expenses/new");
  redirect(`/admin/users/${userId}/edit`);
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

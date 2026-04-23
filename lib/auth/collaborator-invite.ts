import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendCollaboratorInviteEmail } from "@/lib/email/send";

const INVITE_HOURS = 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function exposeInviteLinkForLocalDev(): boolean {
  try {
    const host = new URL(getBaseUrl()).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return process.env.NODE_ENV === "development";
  }
}

export async function createCollaboratorInvite(input: {
  userId: string;
  email: string;
  displayName: string;
  companyNames: string[];
  inviterLabel: string;
}) {
  const tokenRaw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(tokenRaw);
  const expiresAt = new Date(Date.now() + INVITE_HOURS * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.collaboratorInviteToken.deleteMany({ where: { userId: input.userId, usedAt: null } });
    await tx.collaboratorInviteToken.create({
      data: { userId: input.userId, tokenHash, expiresAt },
    });
  });

  const acceptUrl = new URL("/accept-invite", getBaseUrl());
  acceptUrl.searchParams.set("token", tokenRaw);
  const inviteUrl = acceptUrl.toString();

  let delivered = false;
  try {
    delivered = await sendCollaboratorInviteEmail({
      to: input.email,
      inviteUrl,
      displayName: input.displayName,
      companyNames: input.companyNames,
      inviterLabel: input.inviterLabel,
    });
  } catch (err) {
    console.warn("[email] falha ao enviar convite de colaborador:", err);
  }

  if (!delivered) {
    console.info(`[email][fallback] link de convite para ${input.email}: ${inviteUrl}`);
  }

  return {
    inviteUrl: !delivered || !isEmailConfigured() || exposeInviteLinkForLocalDev() ? inviteUrl : null,
    invitationRequired: true,
  };
}

export async function acceptCollaboratorInviteWithPassword(input: { token: string; password: string }) {
  const tokenRaw = input.token.trim();
  if (!tokenRaw) throw new Error("Token ausente.");
  if (!input.password || input.password.length < 6) throw new Error("Senha mínima de 6 caracteres.");

  const now = new Date();
  const tokenHash = hashToken(tokenRaw);
  const row = await prisma.collaboratorInviteToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, active: true } } },
  });
  if (!row) throw new Error("Convite inválido.");
  if (row.usedAt) throw new Error("Este convite já foi utilizado.");
  if (row.expiresAt <= now) throw new Error("Convite expirado. Solicite um novo convite ao administrador.");
  if (!row.user.active) throw new Error("Conta inativa. Solicite reativação ao administrador.");

  const passwordHash = await hash(input.password, 10);
  await prisma.$transaction(async (tx) => {
    await tx.collaboratorInviteToken.update({
      where: { id: row.id },
      data: { usedAt: now },
    });
    await tx.user.update({
      where: { id: row.user.id },
      data: { passwordHash, emailVerifiedAt: now },
    });
  });
}

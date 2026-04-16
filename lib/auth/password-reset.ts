import { randomBytes, createHash } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email/send";

const TOKEN_HOURS = 1;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/** Sempre retorna sucesso genérico para não revelar se o e-mail existe. */
export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.toLowerCase().trim();
  if (!email) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true, active: true },
  });
  if (!user?.active || !user.emailVerifiedAt) return;

  const tokenRaw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(tokenRaw);
  const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
  });

  const resetUrl = new URL("/reset-password", getBaseUrl());
  resetUrl.searchParams.set("token", tokenRaw);
  try {
    const delivered = await sendPasswordResetEmail({ to: email, resetUrl: resetUrl.toString() });
    if (!delivered) {
      console.info(`[email][dev] link de redefinicao para ${email}: ${resetUrl.toString()}`);
    }
  } catch (e) {
    console.error("[password-reset] falha ao enviar e-mail:", e);
  }

  return {
    resetUrl: !isEmailConfigured() ? resetUrl.toString() : null,
  };
}

export async function resetPasswordWithToken(tokenRaw: string, newPassword: string) {
  if (newPassword.length < 6) throw new Error("Senha mínima de 6 caracteres.");
  const now = new Date();
  const tokenHash = hashToken(tokenRaw);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  });
  if (!row) throw new Error("Link inválido ou expirado.");
  if (row.usedAt) throw new Error("Este link já foi utilizado.");
  if (row.expiresAt <= now) throw new Error("Link expirado. Solicite nova recuperação.");

  const passwordHash = await hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: now },
    });
    await tx.user.update({
      where: { id: row.user.id },
      data: { passwordHash },
    });
  });
}

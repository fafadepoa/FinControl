import { randomBytes, createHash } from "crypto";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendVerifyAccountEmail } from "@/lib/email/send";

const TOKEN_HOURS = 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getBaseUrl() {
  return process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/** Em desenvolvimento local sempre devolver o link na API para testar sem depender só da inbox. */
function exposeVerifyLinkForLocalDev(): boolean {
  try {
    const host = new URL(getBaseUrl()).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return process.env.NODE_ENV === "development";
  }
}

export async function registerUserWithVerification(input: {
  email: string;
  password: string;
  role: Role;
  companyName?: string | null;
}) {
  const email = input.email.toLowerCase().trim();
  if (!email) throw new Error("E-mail e obrigatório.");
  if (input.role !== "ADMIN") throw new Error("Cadastros publicos estao disponiveis apenas para administradores.");
  if (input.password.length < 6) throw new Error("Senha mínima de 6 caracteres.");
  const companyName = input.companyName?.trim() ?? "";
  if (!companyName) throw new Error("Informe o nome da empresa.");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Ja existe uma conta com este e-mail.");

  const passwordHash = await hash(input.password, 10);
  const requireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";
  const tokenRaw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(tokenRaw);
  const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000);
  const verifiedAt = requireEmailVerification ? null : new Date();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: input.role,
        active: true,
        emailVerifiedAt: verifiedAt,
        creditBalance: { create: { balance: 0 } },
      },
      select: { id: true },
    });

    const company = await tx.company.create({
      data: {
        name: companyName,
        createdById: user.id,
      },
      select: { id: true },
    });

    await tx.userCompany.create({
      data: {
        userId: user.id,
        companyId: company.id,
      },
    });

    if (requireEmailVerification) {
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    }
  });

  if (!requireEmailVerification) {
    return { verifyUrl: null, verificationRequired: false };
  }

  const verifyUrl = new URL("/verify-email", getBaseUrl());
  verifyUrl.searchParams.set("token", tokenRaw);
  let delivered = false;
  try {
    delivered = await sendVerifyAccountEmail({
      to: email,
      verifyUrl: verifyUrl.toString(),
      role: input.role,
    });
  } catch (err) {
    console.warn("[email] falha ao enviar verificacao:", err);
  }

  const showLink = !delivered || exposeVerifyLinkForLocalDev();
  if (!delivered) {
    console.info(`[email][fallback] link de verificacao para ${email}: ${verifyUrl.toString()}`);
  }

  return {
    verifyUrl: showLink ? verifyUrl.toString() : null,
    verificationRequired: true,
  };
}

export async function verifyEmailToken(tokenRaw: string) {
  if (!tokenRaw) return { ok: false as const, reason: "Token ausente." };
  const now = new Date();
  const tokenHash = hashToken(tokenRaw);

  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, emailVerifiedAt: true } } },
  });
  if (!token) return { ok: false as const, reason: "Token inválido." };
  if (token.usedAt) return { ok: false as const, reason: "Token já utilizado." };
  if (token.expiresAt <= now) return { ok: false as const, reason: "Token expirado." };

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    });
    if (!token.user.emailVerifiedAt) {
      await tx.user.update({
        where: { id: token.user.id },
        data: { emailVerifiedAt: now, active: true },
      });
    }
  });

  return { ok: true as const };
}

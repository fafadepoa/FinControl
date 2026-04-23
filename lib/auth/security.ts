import type { PrismaClient } from "@prisma/client";

async function getPrisma(): Promise<PrismaClient> {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const MAX_ATTEMPTS = Number(process.env.AUTH_RATE_LIMIT_ATTEMPTS ?? 5);
const WINDOW_MINUTES = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES ?? 10);
const BLOCK_MINUTES = Number(process.env.AUTH_RATE_LIMIT_BLOCK_MINUTES ?? 15);

function normalizeIp(value: string | null | undefined) {
  if (!value) return "unknown";
  return value.split(",")[0]?.trim() || "unknown";
}

function buildIdentifier(email: string, ip: string) {
  return `${email.toLowerCase().trim()}|${normalizeIp(ip)}`;
}

function computeBlockExpiry(now: Date) {
  return new Date(now.getTime() + BLOCK_MINUTES * 60 * 1000);
}

function windowIsExpired(now: Date, windowStartedAt: Date) {
  const diffMs = now.getTime() - windowStartedAt.getTime();
  return diffMs > WINDOW_MINUTES * 60 * 1000;
}

export async function checkLoginThrottle(email: string, ip: string) {
  try {
    const prisma = await getPrisma();
    const identifier = buildIdentifier(email, ip);
    const now = new Date();
    const record = await prisma.loginThrottle.findUnique({ where: { identifier } });
    if (!record) return { blocked: false as const };

    if (record.blockedUntil && record.blockedUntil > now) {
      return { blocked: true as const, blockedUntil: record.blockedUntil };
    }

    return { blocked: false as const };
  } catch (e) {
    console.warn("[auth] checkLoginThrottle ignorado (DB/migration):", e);
    return { blocked: false as const };
  }
}

export async function registerFailedLogin(email: string, ip: string) {
  try {
    const prisma = await getPrisma();
    const identifier = buildIdentifier(email, ip);
    const now = new Date();
    const record = await prisma.loginThrottle.findUnique({ where: { identifier } });

    if (!record) {
      await prisma.loginThrottle.create({
        data: {
          identifier,
          attempts: 1,
          windowStartedAt: now,
          lastAttemptAt: now,
        },
      });
      return;
    }

    const resetWindow = windowIsExpired(now, record.windowStartedAt);
    const attempts = resetWindow ? 1 : record.attempts + 1;
    const blockedUntil = attempts >= MAX_ATTEMPTS ? computeBlockExpiry(now) : null;

    await prisma.loginThrottle.update({
      where: { identifier },
      data: {
        attempts,
        windowStartedAt: resetWindow ? now : record.windowStartedAt,
        blockedUntil,
        lastAttemptAt: now,
      },
    });
  } catch (e) {
    console.warn("[auth] registerFailedLogin ignorado (DB/migration):", e);
  }
}

export async function registerSuccessfulLogin(email: string, ip: string) {
  try {
    const prisma = await getPrisma();
    const identifier = buildIdentifier(email, ip);
    await prisma.loginThrottle.deleteMany({ where: { identifier } });
  } catch (e) {
    console.warn("[auth] registerSuccessfulLogin ignorado (DB/migration):", e);
  }
}

export async function auditAuthEvent(input: {
  email?: string | null;
  ip?: string | null;
  event: string;
  reason?: string | null;
}) {
  try {
    const prisma = await getPrisma();
    await prisma.authAuditEvent.create({
      data: {
        email: input.email?.toLowerCase().trim() || null,
        ip: normalizeIp(input.ip),
        event: input.event,
        reason: input.reason ?? null,
      },
    });
  } catch (e) {
    console.warn("[auth] auditAuthEvent ignorado (DB/migration):", e);
  }
}

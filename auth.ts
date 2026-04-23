import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import authConfig from "./auth.config";
import {
  auditAuthEvent,
  checkLoginThrottle,
  registerFailedLogin,
  registerSuccessfulLogin,
} from "@/lib/auth/security";
import {
  EmailNotVerifiedSignin,
  RateLimitedSignin,
  RoleMismatchSignin,
} from "@/lib/auth/sign-in-errors";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        requestedRole: { label: "Perfil esperado", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const { prisma } = await import("@/lib/prisma");

        const email = String(credentials.email).toLowerCase().trim();
        const ip = request?.headers.get("x-forwarded-for") ?? request?.headers.get("x-real-ip");
        const requestedRole =
          credentials.requestedRole === "ADMIN" || credentials.requestedRole === "USER"
            ? credentials.requestedRole
            : null;

        const throttle = await checkLoginThrottle(email, ip ?? "unknown");
        if (throttle.blocked) {
          await auditAuthEvent({
            email,
            ip,
            event: "LOGIN_BLOCKED",
            reason: "RATE_LIMIT",
          });
          throw new RateLimitedSignin();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) {
          await registerFailedLogin(email, ip ?? "unknown");
          await auditAuthEvent({
            email,
            ip,
            event: "LOGIN_FAILED",
            reason: !user ? "USER_NOT_FOUND" : "USER_INACTIVE",
          });
          return null;
        }

        if (!user.passwordHash) {
          await registerFailedLogin(email, ip ?? "unknown");
          await auditAuthEvent({
            email,
            ip,
            event: "LOGIN_FAILED",
            reason: "INVITE_PENDING_PASSWORD",
          });
          return null;
        }

        const ok = await compare(String(credentials.password), user.passwordHash);
        if (!ok) {
          await registerFailedLogin(email, ip ?? "unknown");
          await auditAuthEvent({
            email,
            ip,
            event: "LOGIN_FAILED",
            reason: "INVALID_PASSWORD",
          });
          return null;
        }

        const requireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";
        if (requireEmailVerification && !user.emailVerifiedAt) {
          await auditAuthEvent({
            email,
            ip,
            event: "LOGIN_FAILED",
            reason: "EMAIL_NOT_VERIFIED",
          });
          throw new EmailNotVerifiedSignin();
        }

        // Login colaborador (/login) pede requestedRole USER; contas criadas pelo cadastro público são ADMIN.
        const roleAllowed =
          !requestedRole ||
          (requestedRole === "ADMIN" && user.role === "ADMIN") ||
          (requestedRole === "USER" && (user.role === "USER" || user.role === "ADMIN"));
        if (!roleAllowed) {
          await registerFailedLogin(email, ip ?? "unknown");
          await auditAuthEvent({
            email,
            ip,
            event: "LOGIN_FAILED",
            reason: "ROLE_MISMATCH",
          });
          throw new RoleMismatchSignin();
        }

        await registerSuccessfulLogin(email, ip ?? "unknown");
        await auditAuthEvent({
          email,
          ip,
          event: "LOGIN_SUCCESS",
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});

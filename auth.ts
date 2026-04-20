import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const requestedRole =
          credentials.requestedRole === "ADMIN" || credentials.requestedRole === "USER"
            ? credentials.requestedRole
            : null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;

        const requireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";
        if (requireEmailVerification && !user.emailVerifiedAt) return null;

        // Login colaborador (/login) pede requestedRole USER; contas criadas pelo cadastro público são ADMIN.
        // Só bloqueamos tentativa de acesso admin sem perfil ADMIN; USER comum não acessa /admin/login.
        const roleAllowed =
          !requestedRole ||
          (requestedRole === "ADMIN" && user.role === "ADMIN") ||
          (requestedRole === "USER" && (user.role === "USER" || user.role === "ADMIN"));
        if (!roleAllowed) return null;

        const ok = await compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});

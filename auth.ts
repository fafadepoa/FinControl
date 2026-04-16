import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function maskEmail(email: string) {
  const [localPart, domain = ""] = email.split("@");
  const compactLocal = localPart.length <= 2 ? `${localPart[0] ?? "*"}*` : `${localPart.slice(0, 2)}***`;
  return `${compactLocal}@${domain}`;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        requestedRole: { label: "Perfil esperado", type: "text" },
      },
      async authorize(credentials) {
        // #region agent log
        fetch("http://127.0.0.1:7631/ingest/ac0e6707-932b-43bc-924d-84dab4ff09fe", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d38fc4" },
          body: JSON.stringify({
            sessionId: "d38fc4",
            runId: "initial",
            hypothesisId: "H1-H5",
            location: "auth.ts:authorize:start",
            message: "credentials authorize called",
            data: {
              hasEmail: Boolean(credentials?.email),
              hasPassword: Boolean(credentials?.password),
              requestedRoleRaw: credentials?.requestedRole ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const requestedRole =
          credentials.requestedRole === "ADMIN" || credentials.requestedRole === "USER"
            ? credentials.requestedRole
            : null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active || !user.emailVerifiedAt) {
          // #region agent log
          fetch("http://127.0.0.1:7631/ingest/ac0e6707-932b-43bc-924d-84dab4ff09fe", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d38fc4" },
            body: JSON.stringify({
              sessionId: "d38fc4",
              runId: "initial",
              hypothesisId: "H2-H4",
              location: "auth.ts:authorize:block-user-state",
              message: "blocked before role/password",
              data: {
                email: maskEmail(email),
                userFound: Boolean(user),
                active: user?.active ?? null,
                emailVerified: Boolean(user?.emailVerifiedAt),
                userRole: user?.role ?? null,
                requestedRole,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          return null;
        }
        if (requestedRole && user.role !== requestedRole) {
          // #region agent log
          fetch("http://127.0.0.1:7631/ingest/ac0e6707-932b-43bc-924d-84dab4ff09fe", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d38fc4" },
            body: JSON.stringify({
              sessionId: "d38fc4",
              runId: "initial",
              hypothesisId: "H1",
              location: "auth.ts:authorize:block-role",
              message: "blocked by requested role mismatch",
              data: {
                email: maskEmail(email),
                userRole: user.role,
                requestedRole,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          return null;
        }
        const ok = await compare(String(credentials.password), user.passwordHash);
        if (!ok) {
          // #region agent log
          fetch("http://127.0.0.1:7631/ingest/ac0e6707-932b-43bc-924d-84dab4ff09fe", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d38fc4" },
            body: JSON.stringify({
              sessionId: "d38fc4",
              runId: "initial",
              hypothesisId: "H3-H5",
              location: "auth.ts:authorize:block-password",
              message: "blocked by password mismatch",
              data: {
                email: maskEmail(email),
                userRole: user.role,
                requestedRole,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          return null;
        }
        // #region agent log
        fetch("http://127.0.0.1:7631/ingest/ac0e6707-932b-43bc-924d-84dab4ff09fe", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d38fc4" },
          body: JSON.stringify({
            sessionId: "d38fc4",
            runId: "initial",
            hypothesisId: "H1-H5",
            location: "auth.ts:authorize:success",
            message: "credentials accepted",
            data: {
              email: maskEmail(email),
              userRole: user.role,
              requestedRole,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as Role | undefined) ?? "USER";
      }
      return session;
    },
  },
});

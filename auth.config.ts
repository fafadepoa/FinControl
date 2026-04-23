import type { NextAuthConfig } from "next-auth";

/**
 * Config compartilhada e compatível com Edge (middleware).
 * Não importe Prisma/bcrypt aqui — isso mantém o bundle do middleware pequeno.
 */
const SESSION_MAX_AGE = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS ?? 12 * 60 * 60);

const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" as const, maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof token.exp === "number" ? token.exp : null;
      if (exp && now >= exp) {
        // token vencido: força sessão inválida
        token.exp = now;
      }
      if (user) {
        token.role = user.role;
        token.sub = user.id;
        token.email = user.email;
        token.exp = now + SESSION_MAX_AGE;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;

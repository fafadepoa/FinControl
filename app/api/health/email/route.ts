import { NextResponse } from "next/server";
import { getEmailEnvIssues, isEmailEnvReady } from "@/lib/email/diagnostics";

/**
 * Diagnóstico seguro de envio de e-mail (sem expor segredos).
 * Use após deploy para confirmar Resend/MAIL_FROM na Vercel.
 */
export async function GET() {
  const issues = getEmailEnvIssues();
  return NextResponse.json({
    configured: isEmailEnvReady(),
    issues,
    hint:
      issues.length > 0
        ? "Corrija os itens acima nas Environment Variables e faça um novo deploy."
        : "Resend e MAIL_FROM parecem prontos para verificação de conta e redefinição de senha.",
    manualTests: {
      accountVerification:
        "Com AUTH_REQUIRE_EMAIL_VERIFICATION=true, crie uma conta em /register e confira a caixa de entrada (e spam).",
      passwordReset:
        "Em /forgot-password use o e-mail de um usuário ativo e com e-mail verificado; o link chega pelo mesmo Resend.",
    },
  });
}

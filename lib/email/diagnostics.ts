import { resend } from "@/lib/email/client";

export const RESEND_KEY_PLACEHOLDER = "COLE_SUA_CHAVE_REAL_DO_RESEND_AQUI";
export const MAIL_FROM_PLACEHOLDER = "SEU_DOMINIO_VERIFICADO.com";

/**
 * Lista problemas de configuração que impedem o envio via Resend.
 * Não expõe valores de segredo.
 */
export function getEmailEnvIssues(): string[] {
  const issues: string[] = [];
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey?.trim()) {
    issues.push("RESEND_API_KEY ausente.");
  } else if (apiKey.includes(RESEND_KEY_PLACEHOLDER)) {
    issues.push("RESEND_API_KEY ainda contém o placeholder do .env.example.");
  }

  if (!from?.trim()) {
    issues.push("MAIL_FROM ausente.");
  } else if (from.includes(MAIL_FROM_PLACEHOLDER)) {
    issues.push(
      "MAIL_FROM ainda contém placeholder; use um remetente verificado no Resend (domínio ou e-mail de teste).",
    );
  }

  if (!resend) {
    issues.push("Cliente Resend não foi inicializado (chave ausente ou inválida).");
  }

  if (process.env.NODE_ENV === "production") {
    const base = process.env.APP_BASE_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
    if (!base) {
      issues.push(
        "Em produção, defina APP_BASE_URL ou NEXTAUTH_URL para que os links dos e-mails apontem para o site correto.",
      );
    }
  }

  return issues;
}

export function isEmailEnvReady(): boolean {
  return getEmailEnvIssues().length === 0;
}

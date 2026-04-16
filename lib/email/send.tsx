import * as React from "react";
import { render } from "@react-email/components";
import { resend } from "@/lib/email/client";
import { CreditAddedEmail } from "@/lib/email/templates/credit-added";
import { ResetPasswordEmail } from "@/lib/email/templates/reset-password";
import { VerifyAccountEmail } from "@/lib/email/templates/verify-account";

const RESEND_KEY_PLACEHOLDER = "COLE_SUA_CHAVE_REAL_DO_RESEND_AQUI";
const MAIL_FROM_PLACEHOLDER = "SEU_DOMINIO_VERIFICADO.com";

function getMailConfig() {
  const from = process.env.MAIL_FROM;
  const appName = process.env.APP_NAME ?? "FinControl";
  const logoUrl = process.env.APP_LOGO_URL;
  return { from, appName, logoUrl };
}

export function isEmailConfigured() {
  const { from } = getMailConfig();
  const apiKey = process.env.RESEND_API_KEY;
  if (!resend || !from || !apiKey) return false;
  if (apiKey.includes(RESEND_KEY_PLACEHOLDER)) return false;
  if (from.includes(MAIL_FROM_PLACEHOLDER)) return false;
  return true;
}

async function sendRawEmail(input: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  const { from } = getMailConfig();
  const client = resend;
  if (!isEmailConfigured() || !client) {
    console.warn("[email] envio ignorado: RESEND_API_KEY ou MAIL_FROM ausente.");
    return false;
  }
  const sender = from as string;

  const html = await render(input.react);
  await client.emails.send({
    from: sender,
    to: input.to,
    subject: input.subject,
    html,
  });
  return true;
}

export async function sendVerifyAccountEmail(input: {
  to: string;
  verifyUrl: string;
  role: "ADMIN" | "USER";
}) {
  const { appName, logoUrl } = getMailConfig();
  return sendRawEmail({
    to: input.to,
    subject: `Confirme sua conta no ${appName}`,
    react: (
      <VerifyAccountEmail
        appName={appName}
        userEmail={input.to}
        verifyUrl={input.verifyUrl}
        roleLabel={input.role === "ADMIN" ? "Administrador" : "Colaborador"}
        logoUrl={logoUrl}
      />
    ),
  });
}

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const { appName, logoUrl } = getMailConfig();
  return sendRawEmail({
    to: input.to,
    subject: `Redefinir senha no ${appName}`,
    react: (
      <ResetPasswordEmail appName={appName} userEmail={input.to} resetUrl={input.resetUrl} logoUrl={logoUrl} />
    ),
  });
}

export async function sendCreditAddedEmail(input: {
  to: string;
  amountLabel: string;
  balanceLabel: string;
  note?: string | null;
  grantedByEmail: string;
}) {
  const { appName, logoUrl } = getMailConfig();
  return sendRawEmail({
    to: input.to,
    subject: `Credito adicionado na sua conta do ${appName}`,
    react: (
      <CreditAddedEmail
        appName={appName}
        userEmail={input.to}
        amountLabel={input.amountLabel}
        balanceLabel={input.balanceLabel}
        note={input.note}
        grantedByEmail={input.grantedByEmail}
        logoUrl={logoUrl}
      />
    ),
  });
}

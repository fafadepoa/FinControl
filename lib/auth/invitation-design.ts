/**
 * Desenho futuro: convite de colaborador por e-mail (ainda não implementado).
 *
 * Fluxo proposto:
 * 1. Admin informa apenas e-mail (+ empresas); sistema cria convite com token opaco.
 * 2. sendInviteCollaboratorEmail({ to, acceptUrl }) usando Resend (mesmo pipeline que send.tsx).
 * 3. Página /accept-invite?token=... valida token, define senha e cria vínculos UserCompany.
 *
 * Modelo Prisma sugerido (migration futura):
 *
 * model CollaboratorInvitation {
 *   id          String    @id @default(cuid())
 *   email       String
 *   tokenHash   String    @unique
 *   companyIds  String[]
 *   invitedById String
 *   expiresAt   DateTime
 *   usedAt      DateTime?
 *   createdAt   DateTime  @default(now())
 * }
 */

export type InvitationAcceptPayload = {
  token: string;
  password: string;
};

/** Contrato para o template de e-mail futuro (implementação em lib/email/send.tsx). */
export type InviteCollaboratorEmailInput = {
  to: string;
  acceptUrl: string;
  companyNames: string[];
  inviterLabel: string;
};

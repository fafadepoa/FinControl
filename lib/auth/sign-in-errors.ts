import { CredentialsSignin } from "next-auth";

/** Confirmação de e-mail obrigatória (AUTH_REQUIRE_EMAIL_VERIFICATION). */
export class EmailNotVerifiedSignin extends CredentialsSignin {
  override code = "email_not_verified";
}

/** Muitas tentativas (rate limit). */
export class RateLimitedSignin extends CredentialsSignin {
  override code = "rate_limited";
}

/** Ex.: colaborador tentando /admin/login ou admin só em /login com política errada. */
export class RoleMismatchSignin extends CredentialsSignin {
  override code = "role_mismatch";
}

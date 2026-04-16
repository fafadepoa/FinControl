import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/auth/password-reset";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  let resetUrl: string | null = null;
  try {
    const { email } = schema.parse(await req.json());
    const result = await requestPasswordReset(email);
    resetUrl = result?.resetUrl ?? null;
  } catch {
    // não revelar erro de validação
  }
  return NextResponse.json({
    ok: true,
    message: "Se o e-mail existir e estiver verificado, enviaremos instruções em instantes.",
    resetUrl,
  });
}

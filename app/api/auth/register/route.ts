import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { registerUserWithVerification } from "@/lib/auth/registration";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.literal(Role.ADMIN),
  companyName: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.parse(await req.json());
    const result = await registerUserWithVerification({
      email: parsed.email,
      password: parsed.password,
      role: parsed.role,
      companyName: parsed.companyName,
    });
    return NextResponse.json({ ok: true, verifyUrl: result.verifyUrl });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Dados de cadastro inválidos."
        : error instanceof Error
          ? error.message
          : "Falha ao criar conta.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

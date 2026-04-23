import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptCollaboratorInviteWithPassword } from "@/lib/auth/collaborator-invite";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const { token, password } = schema.parse(await req.json());
    await acceptCollaboratorInviteWithPassword({ token, password });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Dados inválidos."
        : error instanceof Error
          ? error.message
          : "Falha ao aceitar convite.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

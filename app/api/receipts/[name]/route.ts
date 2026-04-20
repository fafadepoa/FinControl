import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getManagedCompanyIds } from "@/lib/session";

const RECEIPT_DIR = path.join(process.cwd(), "uploads", "receipts");

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { name } = await ctx.params;
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return new NextResponse("Inválido", { status: 400 });
  }

  const urlSuffix = `/api/receipts/${name}`;
  const expense =
    (await prisma.expense.findFirst({
      where: { attachmentUrl: { endsWith: urlSuffix } },
      select: { userId: true, companyId: true },
    })) ??
    (await prisma.expense.findFirst({
      where: { attachments: { some: { url: { endsWith: urlSuffix } } } },
      select: { userId: true, companyId: true },
    }));

  if (!expense) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const isOwner = expense.userId === session.user.id;
  let isAdmin = false;
  if (session.user.role === "ADMIN") {
    const managed = await getManagedCompanyIds(session.user.id);
    isAdmin = managed.includes(expense.companyId);
  }

  if (!isOwner && !isAdmin) {
    return new NextResponse("Proibido", { status: 403 });
  }

  const filePath = path.join(RECEIPT_DIR, name);
  try {
    const buf = await readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    const type =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "image/jpeg";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Não encontrado", { status: 404 });
  }
}

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, active: true, role: true, email: true },
  });
  if (!user?.active) redirect("/login");
  return { session, user };
}

export async function requireAdmin() {
  const { session, user } = await requireAuth();
  if (user.role !== "ADMIN") redirect("/expenses");
  return { session, user };
}

export async function getManagedCompanyIds(adminId: string) {
  const rows = await prisma.company.findMany({
    where: { createdById: adminId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function getLinkedCompanyIds(userId: string) {
  const rows = await prisma.userCompany.findMany({
    where: { userId },
    select: { companyId: true },
  });
  return rows.map((r) => r.companyId);
}

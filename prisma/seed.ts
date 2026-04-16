import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("admin123", 10);
  const userHash = await hash("user123", 10);
  const verifiedAt = new Date();

  const admin = await prisma.user.upsert({
    where: { email: "admin@fincontrol.local" },
    update: { active: true, emailVerifiedAt: verifiedAt },
    create: {
      email: "admin@fincontrol.local",
      passwordHash,
      role: Role.ADMIN,
      active: true,
      emailVerifiedAt: verifiedAt,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@fincontrol.local" },
    update: { active: true, emailVerifiedAt: verifiedAt },
    create: {
      email: "user@fincontrol.local",
      passwordHash: userHash,
      role: Role.USER,
      active: true,
      emailVerifiedAt: verifiedAt,
    },
  });

  const company = await prisma.company.upsert({
    where: { id: "seed-company-1" },
    update: {},
    create: {
      id: "seed-company-1",
      name: "Empresa Demo",
      cnpj: "12.345.678/0001-90",
      phone: "(11) 99999-0000",
      createdById: admin.id,
    },
  });

  await prisma.userCompany.upsert({
    where: {
      userId_companyId: { userId: admin.id, companyId: company.id },
    },
    update: {},
    create: { userId: admin.id, companyId: company.id },
  });

  await prisma.userCompany.upsert({
    where: {
      userId_companyId: { userId: user.id, companyId: company.id },
    },
    update: {},
    create: { userId: user.id, companyId: company.id },
  });

  await prisma.category.upsert({
    where: {
      companyId_name: { companyId: company.id, name: "Alimentação" },
    },
    update: { limitAmount: 50, active: true },
    create: {
      companyId: company.id,
      name: "Alimentação",
      limitAmount: 50,
      active: true,
    },
  });

  await prisma.category.upsert({
    where: {
      companyId_name: { companyId: company.id, name: "Transporte" },
    },
    update: { active: true },
    create: {
      companyId: company.id,
      name: "Transporte",
      active: true,
    },
  });

  await prisma.creditBalance.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 500 },
  });

  console.log("Seed OK — admin: admin@fincontrol.local / admin123");
  console.log("         user: user@fincontrol.local / user123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

/**
 * Remove todos os dados do banco (desenvolvimento / teste do zero).
 * Ordem respeita FKs (SQLite + Prisma).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.expense.deleteMany();
    await tx.category.deleteMany();
    await tx.creditTransaction.deleteMany();
    await tx.creditBalance.deleteMany();
    await tx.emailVerificationToken.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.userCompany.deleteMany();
    await tx.company.deleteMany();
    await tx.user.deleteMany();
  });
  console.log("Banco limpo: todos os usuários e dados relacionados foram removidos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

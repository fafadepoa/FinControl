CREATE TYPE "CategoryKind" AS ENUM ('DEFAULT', 'CUSTOM', 'FUEL');

ALTER TABLE "Category"
ADD COLUMN "kind" "CategoryKind" NOT NULL DEFAULT 'CUSTOM';

CREATE TABLE "CategoryUser" (
  "categoryId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryUser_pkey" PRIMARY KEY ("categoryId", "userId")
);

CREATE INDEX "CategoryUser_userId_idx" ON "CategoryUser"("userId");

ALTER TABLE "CategoryUser"
ADD CONSTRAINT "CategoryUser_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryUser"
ADD CONSTRAINT "CategoryUser_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

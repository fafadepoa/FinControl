-- Colaborador pode nascer sem senha até aceitar convite por e-mail.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Token para convite de colaborador.
CREATE TABLE "CollaboratorInviteToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CollaboratorInviteToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollaboratorInviteToken_tokenHash_key" ON "CollaboratorInviteToken"("tokenHash");
CREATE INDEX "CollaboratorInviteToken_userId_createdAt_idx" ON "CollaboratorInviteToken"("userId", "createdAt");
CREATE INDEX "CollaboratorInviteToken_expiresAt_idx" ON "CollaboratorInviteToken"("expiresAt");

ALTER TABLE "CollaboratorInviteToken"
ADD CONSTRAINT "CollaboratorInviteToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

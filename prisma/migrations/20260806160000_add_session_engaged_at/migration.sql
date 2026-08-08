-- AlterTable
ALTER TABLE "SpaceTestSession" ADD COLUMN "engagedAt" TIMESTAMP(3);

-- Backfill: completed sessions were clearly engaged
UPDATE "SpaceTestSession"
SET "engagedAt" = COALESCE("submittedAt", "createdAt")
WHERE "submittedAt" IS NOT NULL AND "engagedAt" IS NULL;

-- CreateIndex
CREATE INDEX "SpaceTestSession_spaceTestId_engagedAt_idx" ON "SpaceTestSession"("spaceTestId", "engagedAt");

-- CreateIndex
CREATE INDEX "SpaceTestSession_spaceTestId_submittedAt_idx" ON "SpaceTestSession"("spaceTestId", "submittedAt");

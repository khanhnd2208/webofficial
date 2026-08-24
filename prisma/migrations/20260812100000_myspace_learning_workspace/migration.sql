-- AlterTable
ALTER TABLE "SpaceTest" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: alphabetical order within each subject (stable for Chapter 2 before Chapter 10 via later title tie-break in app).
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY "subjectId" ORDER BY title ASC, id ASC) AS rn
  FROM "SpaceTest"
)
UPDATE "SpaceTest" AS t
SET "displayOrder" = ordered.rn
FROM ordered
WHERE t.id = ordered.id;

-- AlterTable
ALTER TABLE "SpaceTestSession" ADD COLUMN "userId" TEXT;
ALTER TABLE "SpaceTestSession" ADD COLUMN "guestId" TEXT;

-- CreateIndex
CREATE INDEX "SpaceTest_subjectId_displayOrder_idx" ON "SpaceTest"("subjectId", "displayOrder");

-- CreateIndex
CREATE INDEX "SpaceTestSession_userId_submittedAt_idx" ON "SpaceTestSession"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "SpaceTestSession_guestId_submittedAt_idx" ON "SpaceTestSession"("guestId", "submittedAt");

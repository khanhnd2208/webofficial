ALTER TABLE "MyClassKuProgress" ADD COLUMN "lastViewedAt" TIMESTAMP(3);

UPDATE "MyClassKuProgress"
SET "lastViewedAt" = COALESCE("firstViewedAt", "completedAt", "updatedAt")
WHERE "lastViewedAt" IS NULL;

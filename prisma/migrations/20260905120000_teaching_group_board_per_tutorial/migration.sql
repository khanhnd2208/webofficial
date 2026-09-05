-- Per-tutorial group boards with optional per-group capacity.
ALTER TABLE "TeachingGroupBoard" ADD COLUMN "tutorialClassId" TEXT;
ALTER TABLE "TeachingGroup" ADD COLUMN "maxSize" INTEGER;

DROP INDEX IF EXISTS "TeachingGroupBoard_classId_key";

ALTER TABLE "TeachingGroupBoard" DROP COLUMN IF EXISTS "isOpen";
ALTER TABLE "TeachingGroupBoard" DROP COLUMN IF EXISTS "claimEpoch";
ALTER TABLE "TeachingGroupBoard" DROP COLUMN IF EXISTS "openedAt";
ALTER TABLE "TeachingGroupBoard" DROP COLUMN IF EXISTS "lockedAt";

ALTER TABLE "TeachingGroupBoard" ALTER COLUMN "groupSize" SET DEFAULT 5;

CREATE INDEX "TeachingGroupBoard_classId_idx" ON "TeachingGroupBoard"("classId");

ALTER TABLE "TeachingGroupBoard"
  ADD CONSTRAINT "TeachingGroupBoard_tutorialClassId_fkey"
  FOREIGN KEY ("tutorialClassId") REFERENCES "TeachingTutorialClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "TeachingGroupAuditAction" ADD VALUE IF NOT EXISTS 'ADD_BATCH';
ALTER TYPE "TeachingGroupAuditAction" ADD VALUE IF NOT EXISTS 'REMOVE';
ALTER TYPE "TeachingGroupAuditAction" ADD VALUE IF NOT EXISTS 'UPDATE_CAPACITY';

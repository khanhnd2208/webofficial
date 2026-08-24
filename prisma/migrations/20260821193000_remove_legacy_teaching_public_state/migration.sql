-- The share endpoint has been the only supported publication flow since the
-- teaching workspace redesign. `attendanceVisible` is now the single source
-- of truth for whether a student class page is reachable.
--
-- Rows from the retired public-page-only flow intentionally remain private:
-- this avoids exposing attendance and CP data without an explicit share action.
DROP INDEX IF EXISTS "TeachingClass_isPublic_updatedAt_idx";

ALTER TABLE "TeachingClass"
DROP COLUMN "isPublic",
DROP COLUMN "publicPublishedAt";

CREATE INDEX "TeachingClass_attendanceVisible_updatedAt_idx"
ON "TeachingClass"("attendanceVisible", "updatedAt");

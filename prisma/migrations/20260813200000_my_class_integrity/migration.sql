-- CreateEnum
CREATE TYPE "MyClassQuestionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable KnowledgeUnit: published revision is a real FK
CREATE UNIQUE INDEX "KnowledgeUnit_currentPublishedRevisionId_key" ON "KnowledgeUnit"("currentPublishedRevisionId");

ALTER TABLE "KnowledgeUnit"
  ADD CONSTRAINT "KnowledgeUnit_currentPublishedRevisionId_fkey"
  FOREIGN KEY ("currentPublishedRevisionId") REFERENCES "KnowledgeUnitRevision"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION myclass_ku_current_revision_same_unit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."currentPublishedRevisionId" IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM "KnowledgeUnitRevision" r
    WHERE r.id = NEW."currentPublishedRevisionId"
      AND r."knowledgeUnitId" = NEW.id
  ) THEN
    RAISE EXCEPTION 'currentPublishedRevision must belong to the same knowledge unit';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER myclass_ku_current_revision_same_unit
  BEFORE INSERT OR UPDATE OF "currentPublishedRevisionId" ON "KnowledgeUnit"
  FOR EACH ROW
  EXECUTE PROCEDURE myclass_ku_current_revision_same_unit();

-- AlterTable MyClassQuestion: ACTIVE/ARCHIVED instead of boolean
ALTER TABLE "MyClassQuestion" ADD COLUMN "status" "MyClassQuestionStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "MyClassQuestion" SET "status" = 'ARCHIVED' WHERE "isActive" = false;

DROP INDEX "MyClassQuestion_isActive_level_difficulty_idx";

ALTER TABLE "MyClassQuestion" DROP COLUMN "isActive";

CREATE INDEX "MyClassQuestion_status_level_difficulty_idx" ON "MyClassQuestion"("status", "level", "difficulty");

-- AlterTable MyClassTestAttempt: keep history when a test is archived
ALTER TABLE "MyClassTestAttempt" DROP CONSTRAINT "MyClassTestAttempt_testId_fkey";

ALTER TABLE "MyClassTestAttempt"
  ADD CONSTRAINT "MyClassTestAttempt_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "MyClassTest"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MyClassTestAttempt"
  ADD CONSTRAINT "MyClassTestAttempt_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "MyClassCohort"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable MyClassCohort
ALTER TABLE "MyClassCohort" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable MyClassMembership: course-scoped identity + audit
ALTER TABLE "MyClassMembership" ADD COLUMN "courseId" TEXT;
ALTER TABLE "MyClassMembership" ADD COLUMN "activeCourseUserKey" TEXT;
ALTER TABLE "MyClassMembership" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "MyClassMembership" ADD COLUMN "removedAt" TIMESTAMP(3);

UPDATE "MyClassMembership" AS m
SET
  "courseId" = c."courseId",
  "email" = lower(trim(m."email"))
FROM "MyClassCohort" AS c
WHERE m."cohortId" = c."id";

DELETE FROM "MyClassMembership" WHERE "courseId" IS NULL;

ALTER TABLE "MyClassMembership" ALTER COLUMN "courseId" SET NOT NULL;

UPDATE "MyClassMembership"
SET "activeCourseUserKey" = "courseId" || ':' || "userId"
WHERE "status" = 'ACTIVE' AND "userId" IS NOT NULL;

CREATE UNIQUE INDEX "MyClassMembership_activeCourseUserKey_key" ON "MyClassMembership"("activeCourseUserKey");
CREATE INDEX "MyClassMembership_courseId_status_idx" ON "MyClassMembership"("courseId", "status");

ALTER TABLE "MyClassMembership"
  ADD CONSTRAINT "MyClassMembership_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

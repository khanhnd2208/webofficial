-- CreateEnum
CREATE TYPE "MyClassTestRevealPolicy" AS ENUM ('AFTER_SUBMIT', 'IMMEDIATE', 'NEVER');

-- New library fields on MyClassTest (keep course/scope until placements exist)
ALTER TABLE "MyClassTest" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "MyClassTest" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MyClassTest" ADD COLUMN "timeLimitMinutes" INTEGER;
ALTER TABLE "MyClassTest" ADD COLUMN "maxAttempts" INTEGER;
ALTER TABLE "MyClassTest" ADD COLUMN "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MyClassTest" ADD COLUMN "shuffleOptions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MyClassTest" ADD COLUMN "revealPolicy" "MyClassTestRevealPolicy" NOT NULL DEFAULT 'AFTER_SUBMIT';

ALTER TABLE "MyClassTest"
  ADD CONSTRAINT "MyClassTest_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "MyClassSubject"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable placements
CREATE TABLE "MyClassTestPlacement" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "sectionId" TEXT,
    "scope" "MyClassTestScope" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "placementKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyClassTestPlacement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MyClassTestPlacement_placementKey_key" ON "MyClassTestPlacement"("placementKey");
CREATE INDEX "MyClassTestPlacement_courseId_status_position_idx"
  ON "MyClassTestPlacement"("courseId", "status", "position");
CREATE INDEX "MyClassTestPlacement_lessonId_status_position_idx"
  ON "MyClassTestPlacement"("lessonId", "status", "position");
CREATE INDEX "MyClassTestPlacement_sectionId_status_position_idx"
  ON "MyClassTestPlacement"("sectionId", "status", "position");
CREATE INDEX "MyClassTestPlacement_testId_idx" ON "MyClassTestPlacement"("testId");

ALTER TABLE "MyClassTestPlacement"
  ADD CONSTRAINT "MyClassTestPlacement_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "MyClassTest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MyClassTestPlacement"
  ADD CONSTRAINT "MyClassTestPlacement_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MyClassTestPlacement"
  ADD CONSTRAINT "MyClassTestPlacement_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "MyClassLesson"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MyClassTestPlacement"
  ADD CONSTRAINT "MyClassTestPlacement_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "MyClassSection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- One placement per existing test, preserving course/lesson/section/scope
INSERT INTO "MyClassTestPlacement" (
  "id", "testId", "courseId", "lessonId", "sectionId", "scope", "position", "status", "placementKey", "createdAt", "updatedAt"
)
SELECT
  md5(t."id" || ':placement')::text,
  t."id",
  t."courseId",
  t."lessonId",
  t."sectionId",
  t."scope",
  0,
  CASE WHEN t."status" = 'ARCHIVED' THEN 'ARCHIVED'::"MyClassPublishStatus" ELSE 'PUBLISHED'::"MyClassPublishStatus" END,
  t."id" || ':' || t."courseId" || ':' || COALESCE(t."lessonId", '-') || ':' || COALESCE(t."sectionId", '-'),
  t."createdAt",
  t."updatedAt"
FROM "MyClassTest" t;

-- Roster points
ALTER TABLE "MyClassTestQuestion" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 1;

-- Attempt context + fractional scoring
ALTER TABLE "MyClassTestAttempt" ADD COLUMN "placementId" TEXT;
ALTER TABLE "MyClassTestAttempt" ADD COLUMN "courseId" TEXT;
ALTER TABLE "MyClassTestAttempt" ADD COLUMN "earnedPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MyClassTestAttempt" ADD COLUMN "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MyClassTestAttempt" ADD COLUMN "durationSeconds" INTEGER;

UPDATE "MyClassTestAttempt" a
SET
  "courseId" = t."courseId",
  "placementId" = p."id",
  "earnedPoints" = a."score",
  "totalPoints" = a."total"
FROM "MyClassTest" t
JOIN "MyClassTestPlacement" p ON p."testId" = t."id"
WHERE a."testId" = t."id";

ALTER TABLE "MyClassTestAttempt"
  ADD CONSTRAINT "MyClassTestAttempt_placementId_fkey"
  FOREIGN KEY ("placementId") REFERENCES "MyClassTestPlacement"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MyClassTestAttempt"
  ADD CONSTRAINT "MyClassTestAttempt_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "MyClassTestAttempt_placementId_submittedAt_idx"
  ON "MyClassTestAttempt"("placementId", "submittedAt");
CREATE INDEX "MyClassTestAttempt_courseId_submittedAt_idx"
  ON "MyClassTestAttempt"("courseId", "submittedAt");

-- Drop course-bound columns from MyClassTest
ALTER TABLE "MyClassTest" DROP CONSTRAINT IF EXISTS "MyClassTest_courseId_fkey";
ALTER TABLE "MyClassTest" DROP CONSTRAINT IF EXISTS "MyClassTest_lessonId_fkey";
ALTER TABLE "MyClassTest" DROP CONSTRAINT IF EXISTS "MyClassTest_sectionId_fkey";
DROP INDEX IF EXISTS "MyClassTest_courseId_status_idx";
DROP INDEX IF EXISTS "MyClassTest_lessonId_status_idx";
DROP INDEX IF EXISTS "MyClassTest_sectionId_status_idx";
ALTER TABLE "MyClassTest" DROP COLUMN "courseId";
ALTER TABLE "MyClassTest" DROP COLUMN "lessonId";
ALTER TABLE "MyClassTest" DROP COLUMN "sectionId";
ALTER TABLE "MyClassTest" DROP COLUMN "scope";

CREATE INDEX "MyClassTest_status_updatedAt_idx" ON "MyClassTest"("status", "updatedAt");
CREATE INDEX "MyClassTest_subjectId_status_idx" ON "MyClassTest"("subjectId", "status");

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");

-- AlterTable: add nullable subjectId columns
ALTER TABLE "McqQuestion" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "SpaceTest" ADD COLUMN "subjectId" TEXT;

-- Backfill subjects from distinct names on SpaceTest + McqQuestion
INSERT INTO "Subject" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT
  md5(name)::text,
  name,
  lower(regexp_replace(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "subject" AS name FROM "SpaceTest"
  UNION
  SELECT DISTINCT "subject" AS name FROM "McqQuestion"
) AS names
WHERE name IS NOT NULL AND trim(name) <> ''
ON CONFLICT ("name") DO NOTHING;

-- Map SpaceTest.subject → subjectId
UPDATE "SpaceTest" st
SET "subjectId" = s.id
FROM "Subject" s
WHERE s.name = st.subject;

-- Map McqQuestion.subject → subjectId
UPDATE "McqQuestion" q
SET "subjectId" = s.id
FROM "Subject" s
WHERE s.name = q.subject;

-- Ensure every SpaceTest has a subject (fallback orphan row if needed)
INSERT INTO "Subject" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT 'subject_orphaned', 'Orphaned', 'orphaned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "SpaceTest" WHERE "subjectId" IS NULL)
ON CONFLICT ("name") DO NOTHING;

UPDATE "SpaceTest"
SET "subjectId" = (SELECT id FROM "Subject" WHERE name = 'Orphaned' LIMIT 1)
WHERE "subjectId" IS NULL;

-- Drop old indexes and column
DROP INDEX IF EXISTS "McqQuestion_subject_topic_difficulty_idx";
DROP INDEX IF EXISTS "McqQuestion_subject_isActive_idx";
DROP INDEX IF EXISTS "McqQuestion_isActive_subject_topic_idx";
DROP INDEX IF EXISTS "SpaceTest_subject_status_idx";

ALTER TABLE "McqQuestion" DROP COLUMN "subject";
ALTER TABLE "SpaceTest" DROP COLUMN "subject";

-- Make SpaceTest.subjectId required
ALTER TABLE "SpaceTest" ALTER COLUMN "subjectId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "McqQuestion_subjectId_topic_difficulty_idx" ON "McqQuestion"("subjectId", "topic", "difficulty");
CREATE INDEX "McqQuestion_subjectId_isActive_idx" ON "McqQuestion"("subjectId", "isActive");
CREATE INDEX "McqQuestion_isActive_subjectId_topic_idx" ON "McqQuestion"("isActive", "subjectId", "topic");
CREATE INDEX "SpaceTest_subjectId_status_idx" ON "SpaceTest"("subjectId", "status");

-- AddForeignKey
ALTER TABLE "McqQuestion" ADD CONSTRAINT "McqQuestion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SpaceTest" ADD CONSTRAINT "SpaceTest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

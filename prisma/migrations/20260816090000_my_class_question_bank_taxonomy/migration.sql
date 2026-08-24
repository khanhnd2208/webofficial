-- CreateEnum
CREATE TYPE "MyClassQuestionType" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'FILL_BLANK');

-- CreateTable
CREATE TABLE "MyClassSubject" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyClassSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MyClassSubject_slug_key" ON "MyClassSubject"("slug");

-- CreateTable
CREATE TABLE "MyClassTopic" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyClassTopic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MyClassTopic_subjectId_path_key" ON "MyClassTopic"("subjectId", "path");
CREATE INDEX "MyClassTopic_subjectId_path_idx" ON "MyClassTopic"("subjectId", "path");
CREATE INDEX "MyClassTopic_parentId_position_idx" ON "MyClassTopic"("parentId", "position");

ALTER TABLE "MyClassTopic"
  ADD CONSTRAINT "MyClassTopic_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "MyClassSubject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MyClassTopic"
  ADD CONSTRAINT "MyClassTopic_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "MyClassTopic"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MyClassTopicKnowledgeUnit" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,

    CONSTRAINT "MyClassTopicKnowledgeUnit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MyClassTopicKnowledgeUnit_topicId_knowledgeUnitId_key"
  ON "MyClassTopicKnowledgeUnit"("topicId", "knowledgeUnitId");
CREATE INDEX "MyClassTopicKnowledgeUnit_knowledgeUnitId_idx"
  ON "MyClassTopicKnowledgeUnit"("knowledgeUnitId");

ALTER TABLE "MyClassTopicKnowledgeUnit"
  ADD CONSTRAINT "MyClassTopicKnowledgeUnit_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "MyClassTopic"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MyClassTopicKnowledgeUnit"
  ADD CONSTRAINT "MyClassTopicKnowledgeUnit_knowledgeUnitId_fkey"
  FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable MyClassCourse: optional subject
ALTER TABLE "MyClassCourse" ADD COLUMN "subjectId" TEXT;

CREATE INDEX "MyClassCourse_subjectId_status_idx" ON "MyClassCourse"("subjectId", "status");

ALTER TABLE "MyClassCourse"
  ADD CONSTRAINT "MyClassCourse_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "MyClassSubject"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable MyClassQuestion: new bank fields
ALTER TABLE "MyClassQuestion" ADD COLUMN "type" "MyClassQuestionType" NOT NULL DEFAULT 'MCQ_SINGLE';
ALTER TABLE "MyClassQuestion" ADD COLUMN "answer" JSONB;
ALTER TABLE "MyClassQuestion" ADD COLUMN "hint" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MyClassQuestion" ADD COLUMN "source" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MyClassQuestion" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "MyClassQuestion" ADD COLUMN "topicId" TEXT;
ALTER TABLE "MyClassQuestion" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "MyClassQuestion"
SET "answer" = jsonb_build_object('type', 'MCQ_SINGLE', 'correctKey', "correctKey")
WHERE "answer" IS NULL;

ALTER TABLE "MyClassQuestion" ALTER COLUMN "answer" SET NOT NULL;

ALTER TABLE "MyClassQuestion"
  ADD CONSTRAINT "MyClassQuestion_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "MyClassSubject"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MyClassQuestion"
  ADD CONSTRAINT "MyClassQuestion_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "MyClassTopic"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Widen Bloom difficulty 1–6
ALTER TABLE "MyClassQuestion" DROP CONSTRAINT IF EXISTS "MyClassQuestion_difficulty_check";
ALTER TABLE "MyClassQuestion"
  ADD CONSTRAINT "MyClassQuestion_difficulty_check" CHECK ("difficulty" BETWEEN 1 AND 6);

-- Drop legacy question columns
DROP INDEX IF EXISTS "MyClassQuestion_status_level_difficulty_idx";
ALTER TABLE "MyClassQuestion" DROP COLUMN "correctKey";
ALTER TABLE "MyClassQuestion" DROP COLUMN "level";

DROP TYPE IF EXISTS "MyClassQuestionLevel";

CREATE INDEX "MyClassQuestion_status_type_difficulty_idx"
  ON "MyClassQuestion"("status", "type", "difficulty");
CREATE INDEX "MyClassQuestion_subjectId_topicId_status_idx"
  ON "MyClassQuestion"("subjectId", "topicId", "status");
CREATE INDEX "MyClassQuestion_status_updatedAt_id_idx"
  ON "MyClassQuestion"("status", "updatedAt", "id");

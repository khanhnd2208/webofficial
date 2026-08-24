-- CreateEnum
CREATE TYPE "UserVocabSetSource" AS ENUM ('STORE', 'MY_CLASS');

-- AlterTable
ALTER TABLE "UserVocabSet" ADD COLUMN "source" "UserVocabSetSource" NOT NULL DEFAULT 'STORE';
ALTER TABLE "UserVocabSet" ADD COLUMN "sourceCourseId" TEXT;

-- CreateIndex
CREATE INDEX "UserVocabSet_source_sourceCourseId_idx" ON "UserVocabSet"("source", "sourceCourseId");

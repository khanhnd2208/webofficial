-- AlterEnum
ALTER TYPE "LearnSectionType" ADD VALUE 'PRACTICE';
ALTER TYPE "LearnSectionType" ADD VALUE 'DISCUSSION';

-- AlterTable
ALTER TABLE "LearnSection" ADD COLUMN "discussion" JSONB;
ALTER TABLE "LearnSectionRevision" ADD COLUMN "discussion" JSONB;

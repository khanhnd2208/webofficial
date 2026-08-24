-- AlterTable
ALTER TABLE "VocabSet" ADD COLUMN "isCourseOnly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Word" ADD COLUMN "pronunciation" TEXT NOT NULL DEFAULT '',
ADD COLUMN "meaningEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN "meaningVi" TEXT NOT NULL DEFAULT '';

-- Backfill Vietnamese meaning from the legacy definition column.
UPDATE "Word" SET "meaningVi" = "definition" WHERE "meaningVi" = '' AND "definition" <> '';

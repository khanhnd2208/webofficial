-- CreateEnum
CREATE TYPE "CourseVisibility" AS ENUM ('PRIVATE', 'CATALOG');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "visibility" "CourseVisibility" NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "audience" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "learningOutcomes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "format" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "durationText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "prerequisites" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Course_status_visibility_updatedAt_idx" ON "Course"("status", "visibility", "updatedAt" DESC);

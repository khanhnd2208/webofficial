-- AlterEnum
CREATE TYPE "TeachingCourseStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "TeachingCourse" ADD COLUMN "status" "TeachingCourseStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "TeachingCourse_status_updatedAt_idx" ON "TeachingCourse"("status", "updatedAt" DESC);

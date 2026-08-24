-- AlterTable
ALTER TABLE "TeachingClass"
ADD COLUMN "attendanceKey" TEXT,
ADD COLUMN "attendanceVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attendanceNote" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "TeachingClass_attendanceKey_key" ON "TeachingClass"("attendanceKey");

-- AlterTable
ALTER TABLE "TeachingEnrollment"
ADD COLUMN "enrolledFromWeek" INTEGER NOT NULL DEFAULT 1;

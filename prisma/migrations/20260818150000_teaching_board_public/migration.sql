-- DropIndex
DROP INDEX IF EXISTS "TeachingClass_attendanceKey_key";

-- AlterTable
ALTER TABLE "TeachingClass" DROP COLUMN "attendanceKey";

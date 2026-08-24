-- CreateEnum
CREATE TYPE "TeachingLearningExperience" AS ENUM ('CHALLENGE', 'SUPPORT');

-- AlterTable
ALTER TABLE "TeachingEnrollment"
ADD COLUMN "learningExperience" "TeachingLearningExperience",
ADD COLUMN "learningExperienceSelectedAt" TIMESTAMP(3);

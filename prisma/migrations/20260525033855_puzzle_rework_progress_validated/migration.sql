-- AlterEnum
ALTER TYPE "PuzzleStatus" ADD VALUE 'VALIDATED';

-- AlterTable
ALTER TABLE "PuzzleAttempt" ADD COLUMN     "eligibleForLeaderboard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notesJson" JSONB,
ADD COLUMN     "progressJson" JSONB;

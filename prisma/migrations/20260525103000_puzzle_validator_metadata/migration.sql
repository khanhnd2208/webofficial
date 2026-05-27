-- CreateEnum
CREATE TYPE "PuzzleKind" AS ENUM ('DAILY', 'TUTORIAL');

-- CreateEnum
CREATE TYPE "PuzzleValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID');

-- AlterTable
ALTER TABLE "DailyPuzzle" ADD COLUMN     "puzzleKind" "PuzzleKind" NOT NULL DEFAULT 'DAILY',
ADD COLUMN     "validatorVersion" TEXT,
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "layoutHash" TEXT,
ADD COLUMN     "solutionHash" TEXT,
ADD COLUMN     "validationStatus" "PuzzleValidationStatus" NOT NULL DEFAULT 'PENDING';

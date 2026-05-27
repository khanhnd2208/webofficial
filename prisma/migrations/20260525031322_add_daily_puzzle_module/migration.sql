-- CreateEnum
CREATE TYPE "PuzzleDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "PuzzleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PuzzleAttemptStatus" AS ENUM ('IN_PROGRESS', 'SOLVED', 'FAILED', 'ABANDONED');

-- CreateTable
CREATE TABLE "DailyPuzzle" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "layoutJson" JSONB NOT NULL,
    "solutionJson" JSONB NOT NULL,
    "difficulty" "PuzzleDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "status" "PuzzleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleAttempt" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "mistakes" INTEGER NOT NULL DEFAULT 0,
    "status" "PuzzleAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "clientEventsJson" JSONB,

    CONSTRAINT "PuzzleAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleLeaderboardEntry" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "mistakes" INTEGER NOT NULL,
    "rankScore" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuzzleLeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleUserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastSolvedDateKey" TEXT,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuzzleUserStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyPuzzle_dateKey_key" ON "DailyPuzzle"("dateKey");

-- CreateIndex
CREATE INDEX "DailyPuzzle_status_dateKey_idx" ON "DailyPuzzle"("status", "dateKey" DESC);

-- CreateIndex
CREATE INDEX "PuzzleAttempt_puzzleId_status_idx" ON "PuzzleAttempt"("puzzleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleAttempt_userId_puzzleId_key" ON "PuzzleAttempt"("userId", "puzzleId");

-- CreateIndex
CREATE INDEX "PuzzleLeaderboardEntry_puzzleId_rankScore_idx" ON "PuzzleLeaderboardEntry"("puzzleId", "rankScore" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleLeaderboardEntry_userId_puzzleId_key" ON "PuzzleLeaderboardEntry"("userId", "puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleUserStats_userId_key" ON "PuzzleUserStats"("userId");

-- AddForeignKey
ALTER TABLE "PuzzleAttempt" ADD CONSTRAINT "PuzzleAttempt_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "DailyPuzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleLeaderboardEntry" ADD CONSTRAINT "PuzzleLeaderboardEntry_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "DailyPuzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

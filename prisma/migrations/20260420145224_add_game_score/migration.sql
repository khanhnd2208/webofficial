-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('MCQ', 'FILL_BLANK', 'MATCHING', 'GUESS_WHO');

-- CreateTable
CREATE TABLE "GameScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "vocabSetId" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameScore_vocabSetId_mode_score_idx" ON "GameScore"("vocabSetId", "mode", "score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GameScore_userId_vocabSetId_mode_key" ON "GameScore"("userId", "vocabSetId", "mode");

-- AddForeignKey
ALTER TABLE "GameScore" ADD CONSTRAINT "GameScore_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

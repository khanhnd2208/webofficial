-- CreateEnum
CREATE TYPE "UserVocabSetStatus" AS ENUM ('active', 'soft_deleted');

-- CreateTable
CREATE TABLE "VocabSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "vocabSetId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL DEFAULT '',
    "example" TEXT NOT NULL DEFAULT '',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVocabSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabSetId" TEXT NOT NULL,
    "status" "UserVocabSetStatus" NOT NULL DEFAULT 'active',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserVocabSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWordStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isMemorized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWordStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabSet_ownerId_idx" ON "VocabSet"("ownerId");

-- CreateIndex
CREATE INDEX "VocabSet_isArchived_updatedAt_idx" ON "VocabSet"("isArchived", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Word_vocabSetId_isDeleted_idx" ON "Word"("vocabSetId", "isDeleted");

-- CreateIndex
CREATE INDEX "UserVocabSet_userId_status_idx" ON "UserVocabSet"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabSet_userId_vocabSetId_key" ON "UserVocabSet"("userId", "vocabSetId");

-- CreateIndex
CREATE INDEX "UserWordStat_userId_lastReviewed_idx" ON "UserWordStat"("userId", "lastReviewed" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserWordStat_userId_wordId_key" ON "UserWordStat"("userId", "wordId");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabSet" ADD CONSTRAINT "UserVocabSet_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordStat" ADD CONSTRAINT "UserWordStat_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

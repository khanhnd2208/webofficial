/*
  Warnings:

  - You are about to drop the `UserWordStat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserVocabSet" DROP CONSTRAINT "UserVocabSet_vocabSetId_fkey";

-- DropForeignKey
ALTER TABLE "UserWordStat" DROP CONSTRAINT "UserWordStat_wordId_fkey";

-- DropForeignKey
ALTER TABLE "Word" DROP CONSTRAINT "Word_vocabSetId_fkey";

-- DropTable
DROP TABLE "UserWordStat";

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabSet" ADD CONSTRAINT "UserVocabSet_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "TeachingArenaResult" AS ENUM ('PASS', 'FAIL', 'SKIP');

-- CreateTable
CREATE TABLE "TeachingArenaTurn" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "playedOn" DATE NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "enrollmentId" TEXT,
    "playerName" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL DEFAULT '',
    "guestGroup" "TeachingLearningExperience",
    "cardId" TEXT,
    "question" TEXT NOT NULL DEFAULT '',
    "result" "TeachingArenaResult" NOT NULL,
    "award" DECIMAL(4,2),
    "cpAfter" DECIMAL(4,2),
    "giftAfter" INTEGER,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingArenaTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeachingArenaTurn_clientId_key" ON "TeachingArenaTurn"("clientId");

-- CreateIndex
CREATE INDEX "TeachingArenaTurn_courseId_playedOn_playedAt_idx" ON "TeachingArenaTurn"("courseId", "playedOn", "playedAt");

-- CreateIndex
CREATE INDEX "TeachingArenaTurn_enrollmentId_idx" ON "TeachingArenaTurn"("enrollmentId");

-- CreateIndex
CREATE INDEX "TeachingArenaTurn_cardId_idx" ON "TeachingArenaTurn"("cardId");

-- AddForeignKey
ALTER TABLE "TeachingArenaTurn" ADD CONSTRAINT "TeachingArenaTurn_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TeachingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingArenaTurn" ADD CONSTRAINT "TeachingArenaTurn_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TeachingEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingArenaTurn" ADD CONSTRAINT "TeachingArenaTurn_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ActiveRecallCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

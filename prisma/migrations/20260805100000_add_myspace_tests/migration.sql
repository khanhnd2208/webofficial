-- CreateEnum
CREATE TYPE "McqCorrectOption" AS ENUM ('A', 'B', 'C', 'D');

-- CreateTable
CREATE TABLE "McqQuestion" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" "McqCorrectOption" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "aacsb" TEXT NOT NULL DEFAULT '',
    "learningObjective" TEXT NOT NULL DEFAULT '',
    "classification" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McqQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceTest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulties" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "classifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questionCount" INTEGER NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "SpaceTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceTestSession" (
    "id" TEXT NOT NULL,
    "spaceTestId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "score" INTEGER,
    "total" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceTestSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "McqQuestion_subject_topic_difficulty_idx" ON "McqQuestion"("subject", "topic", "difficulty");

-- CreateIndex
CREATE INDEX "McqQuestion_subject_isActive_idx" ON "McqQuestion"("subject", "isActive");

-- CreateIndex
CREATE INDEX "McqQuestion_isActive_subject_topic_idx" ON "McqQuestion"("isActive", "subject", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceTest_slug_key" ON "SpaceTest"("slug");

-- CreateIndex
CREATE INDEX "SpaceTest_status_updatedAt_idx" ON "SpaceTest"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "SpaceTest_subject_status_idx" ON "SpaceTest"("subject", "status");

-- CreateIndex
CREATE INDEX "SpaceTestSession_spaceTestId_createdAt_idx" ON "SpaceTestSession"("spaceTestId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "SpaceTestSession" ADD CONSTRAINT "SpaceTestSession_spaceTestId_fkey" FOREIGN KEY ("spaceTestId") REFERENCES "SpaceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

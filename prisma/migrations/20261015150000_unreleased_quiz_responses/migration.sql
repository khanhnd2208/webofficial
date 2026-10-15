-- CreateTable
CREATE TABLE "UnreleasedQuizResponse" (
    "id" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group" TEXT NOT NULL,
    "variant" TEXT,
    "note" TEXT,
    "q1" TEXT NOT NULL,
    "q2" TEXT,
    "q3" TEXT NOT NULL,
    "q4" TEXT NOT NULL,
    "q5" TEXT,
    "q6" TEXT,
    "q7" TEXT,
    "registerClickedAt" TIMESTAMP(3),

    CONSTRAINT "UnreleasedQuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnreleasedQuizResponse_createdAt_idx" ON "UnreleasedQuizResponse"("createdAt");

-- CreateIndex
CREATE INDEX "UnreleasedQuizResponse_respondentId_idx" ON "UnreleasedQuizResponse"("respondentId");


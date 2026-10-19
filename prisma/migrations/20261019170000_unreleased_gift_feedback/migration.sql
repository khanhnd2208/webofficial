-- CreateTable
CREATE TABLE "UnreleasedGiftResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overall" INTEGER NOT NULL,
    "usefulness" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "comment" TEXT,

    CONSTRAINT "UnreleasedGiftResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnreleasedGiftResponse_createdAt_idx" ON "UnreleasedGiftResponse"("createdAt");

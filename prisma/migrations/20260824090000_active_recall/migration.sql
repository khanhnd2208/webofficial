-- CreateTable
CREATE TABLE "ActiveRecallDeck" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "lessonLabel" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "ActiveRecallDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveRecallCard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveRecallCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveRecallDeck_slug_key" ON "ActiveRecallDeck"("slug");

-- CreateIndex
CREATE INDEX "ActiveRecallDeck_status_position_updatedAt_idx" ON "ActiveRecallDeck"("status", "position", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "ActiveRecallCard_deckId_position_idx" ON "ActiveRecallCard"("deckId", "position");

-- AddForeignKey
ALTER TABLE "ActiveRecallCard" ADD CONSTRAINT "ActiveRecallCard_deckId_fkey"
FOREIGN KEY ("deckId") REFERENCES "ActiveRecallDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

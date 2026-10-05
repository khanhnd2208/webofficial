-- CreateTable
CREATE TABLE "RecallVisitor" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentSessionId" TEXT,

    CONSTRAINT "RecallVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallStudySession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecallStudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallStudyVisit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "deckTitle" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "classId" TEXT NOT NULL DEFAULT '',
    "className" TEXT NOT NULL DEFAULT '',
    "classSlug" TEXT NOT NULL DEFAULT '',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engagedAt" TIMESTAMP(3),
    "lastSequence" INTEGER NOT NULL DEFAULT -1,

    CONSTRAINT "RecallStudyVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallStudyBucket" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "answerReveals" INTEGER NOT NULL DEFAULT 0,
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecallStudyBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallStudyLease" (
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "timedAt" TIMESTAMP(3) NOT NULL,
    "lastInteraction" TIMESTAMP(3),

    CONSTRAINT "RecallStudyLease_pkey" PRIMARY KEY ("visitorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecallVisitor_publicId_key" ON "RecallVisitor"("publicId");

-- CreateIndex
CREATE INDEX "RecallStudySession_visitorId_startedAt_idx" ON "RecallStudySession"("visitorId", "startedAt");

-- CreateIndex
CREATE INDEX "RecallStudyVisit_sessionId_openedAt_idx" ON "RecallStudyVisit"("sessionId", "openedAt");

-- CreateIndex
CREATE INDEX "RecallStudyVisit_courseId_classId_deckId_idx" ON "RecallStudyVisit"("courseId", "classId", "deckId");

-- CreateIndex
CREATE INDEX "RecallStudyVisit_deckId_idx" ON "RecallStudyVisit"("deckId");

-- CreateIndex
CREATE INDEX "RecallStudyBucket_day_idx" ON "RecallStudyBucket"("day");

-- CreateIndex
CREATE UNIQUE INDEX "RecallStudyBucket_visitId_day_key" ON "RecallStudyBucket"("visitId", "day");

-- CreateIndex
CREATE INDEX "RecallStudyLease_expiresAt_idx" ON "RecallStudyLease"("expiresAt");

-- AddForeignKey
ALTER TABLE "RecallStudySession" ADD CONSTRAINT "RecallStudySession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "RecallVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallStudyVisit" ADD CONSTRAINT "RecallStudyVisit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecallStudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallStudyBucket" ADD CONSTRAINT "RecallStudyBucket_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "RecallStudyVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallStudyLease" ADD CONSTRAINT "RecallStudyLease_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "RecallVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;


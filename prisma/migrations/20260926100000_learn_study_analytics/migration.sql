CREATE TABLE "LearnStudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "totalActiveSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastSequence" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "LearnStudySession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearnStudyBucket" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LearnStudyBucket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearnStudyLease" (
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearnStudyLease_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "LearnStudySession_courseId_startedAt_idx" ON "LearnStudySession"("courseId", "startedAt");
CREATE INDEX "LearnStudySession_userId_courseId_startedAt_idx" ON "LearnStudySession"("userId", "courseId", "startedAt");
CREATE INDEX "LearnStudySession_userId_lastActivityAt_idx" ON "LearnStudySession"("userId", "lastActivityAt");
CREATE UNIQUE INDEX "LearnStudyBucket_sessionId_sectionId_day_key" ON "LearnStudyBucket"("sessionId", "sectionId", "day");
CREATE INDEX "LearnStudyBucket_sectionId_day_idx" ON "LearnStudyBucket"("sectionId", "day");
CREATE INDEX "LearnStudyBucket_sessionId_day_idx" ON "LearnStudyBucket"("sessionId", "day");
CREATE INDEX "LearnStudyLease_expiresAt_idx" ON "LearnStudyLease"("expiresAt");

ALTER TABLE "LearnStudySession" ADD CONSTRAINT "LearnStudySession_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "LearnCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearnStudyBucket" ADD CONSTRAINT "LearnStudyBucket_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "LearnStudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

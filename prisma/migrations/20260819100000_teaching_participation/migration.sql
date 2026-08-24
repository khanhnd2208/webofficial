-- CreateTable
CREATE TABLE "TeachingParticipation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "points" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingParticipation_pkey" PRIMARY KEY ("id")
);

-- Create the conflict target before the idempotent backfill.
CREATE UNIQUE INDEX "TeachingParticipation_sessionId_enrollmentId_key" ON "TeachingParticipation"("sessionId", "enrollmentId");

-- Backfill legacy participation values without overwriting an existing row.
INSERT INTO "TeachingParticipation" (
    "id", "sessionId", "enrollmentId", "points", "recordedById", "recordedAt", "createdAt", "updatedAt"
)
SELECT
    'legacy-cp-' || md5("sessionId" || ':' || "enrollmentId"),
    "sessionId",
    "enrollmentId",
    "participationPoints",
    "recordedById",
    "recordedAt",
    "createdAt",
    "updatedAt"
FROM "TeachingAttendance"
WHERE "participationPoints" > 0
ON CONFLICT ("sessionId", "enrollmentId") DO NOTHING;

-- CreateIndex
CREATE INDEX "TeachingParticipation_enrollmentId_idx" ON "TeachingParticipation"("enrollmentId");

-- AddForeignKey
ALTER TABLE "TeachingParticipation" ADD CONSTRAINT "TeachingParticipation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingParticipation" ADD CONSTRAINT "TeachingParticipation_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TeachingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeachingEnrollment"
ADD COLUMN "giftCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "TeachingSession"
ADD COLUMN "participationTakenAt" TIMESTAMP(3),
ADD COLUMN "participationTakenById" TEXT;

-- Existing weeks with at least one persisted CP mark are treated as already opened.
-- Weeks with no mark remain locked so an all-zero week is not guessed as graded.
UPDATE "TeachingSession" AS session
SET
  "participationTakenAt" = marks."latestRecordedAt",
  "participationTakenById" = marks."latestRecordedById"
FROM (
  SELECT
    "sessionId",
    MAX("recordedAt") AS "latestRecordedAt",
    (ARRAY_AGG("recordedById" ORDER BY "recordedAt" DESC NULLS LAST))[1] AS "latestRecordedById"
  FROM "TeachingParticipation"
  GROUP BY "sessionId"
) AS marks
WHERE session."id" = marks."sessionId";

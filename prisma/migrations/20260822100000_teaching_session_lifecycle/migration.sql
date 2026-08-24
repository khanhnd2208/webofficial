-- Keep the started timestamp as the durable scoring boundary and track editability separately.
ALTER TABLE "TeachingSession"
ADD COLUMN "attendanceOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "participationOpen" BOOLEAN NOT NULL DEFAULT false;

-- Sessions that were open before this migration remain open.
UPDATE "TeachingSession"
SET "attendanceOpen" = true
WHERE "attendanceTakenAt" IS NOT NULL;

UPDATE "TeachingSession"
SET "participationOpen" = true
WHERE "participationTakenAt" IS NOT NULL;

-- A previously locked attendance session may still contain marks while its old
-- timestamp was cleared. Restore the durable scoring timestamp without
-- reopening the session for editing.
WITH latest_attendance AS (
  SELECT
    "sessionId",
    MAX("recordedAt") AS "latestRecordedAt",
    (ARRAY_AGG("recordedById" ORDER BY "recordedAt" DESC NULLS LAST))[1] AS "latestRecordedById"
  FROM "TeachingAttendance"
  GROUP BY "sessionId"
)
UPDATE "TeachingSession" AS session
SET
  "attendanceTakenAt" = latest."latestRecordedAt",
  "attendanceTakenById" = latest."latestRecordedById"
FROM latest_attendance AS latest
WHERE session."id" = latest."sessionId"
  AND session."attendanceTakenAt" IS NULL;

-- Do the same for participation. A week with no persisted participation mark
-- remains unstarted because an all-zero week has no durable row to infer from.
WITH latest_participation AS (
  SELECT
    "sessionId",
    MAX("recordedAt") AS "latestRecordedAt",
    (ARRAY_AGG("recordedById" ORDER BY "recordedAt" DESC NULLS LAST))[1] AS "latestRecordedById"
  FROM "TeachingParticipation"
  GROUP BY "sessionId"
)
UPDATE "TeachingSession" AS session
SET
  "participationTakenAt" = latest."latestRecordedAt",
  "participationTakenById" = latest."latestRecordedById"
FROM latest_participation AS latest
WHERE session."id" = latest."sessionId"
  AND session."participationTakenAt" IS NULL;

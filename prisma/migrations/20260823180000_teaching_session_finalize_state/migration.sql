-- Existing taken weeks become finalized (open=false, takenAt kept)
-- so current scores stay unchanged after the 3-state lifecycle change.
UPDATE "TeachingSession"
SET "attendanceOpen" = false
WHERE "attendanceTakenAt" IS NOT NULL;

UPDATE "TeachingSession"
SET "participationOpen" = false
WHERE "participationTakenAt" IS NOT NULL;

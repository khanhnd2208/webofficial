-- Normalize student codes and add a unique key that treats case/whitespace as the same identity.
-- If collisions already exist, this migration stops and lists them instead of merging records.

ALTER TABLE "TeachingStudent" ADD COLUMN "studentCodeNormalized" TEXT;

UPDATE "TeachingStudent"
SET "studentCodeNormalized" = upper(btrim("studentCode"));

DO $$
DECLARE
  collision_list TEXT;
BEGIN
  SELECT string_agg(code, ', ' ORDER BY code)
  INTO collision_list
  FROM (
    SELECT "studentCodeNormalized" AS code
    FROM "TeachingStudent"
    GROUP BY "studentCodeNormalized"
    HAVING COUNT(*) > 1
  ) collisions;

  IF collision_list IS NOT NULL THEN
    RAISE EXCEPTION 'Teaching student code collisions must be reconciled before migrate: %', collision_list;
  END IF;
END $$;

UPDATE "TeachingStudent"
SET "studentCode" = "studentCodeNormalized";

ALTER TABLE "TeachingStudent"
  ALTER COLUMN "studentCodeNormalized" SET NOT NULL;

CREATE UNIQUE INDEX "TeachingStudent_studentCodeNormalized_key"
  ON "TeachingStudent"("studentCodeNormalized");

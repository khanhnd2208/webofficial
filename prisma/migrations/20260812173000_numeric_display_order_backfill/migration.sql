-- Reorder existing tests with numeric-aware title ordering within each subject.
-- This migration is intentionally separate so the already-applied workspace migration stays immutable.
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "subjectId"
           ORDER BY
             CASE WHEN substring(title from '[0-9]+') IS NULL THEN 1 ELSE 0 END,
             NULLIF(substring(title from '[0-9]+'), '')::int NULLS LAST,
             title ASC,
             id ASC
         ) AS rn
  FROM "SpaceTest"
)
UPDATE "SpaceTest" AS t
SET "displayOrder" = ordered.rn
FROM ordered
WHERE t.id = ordered.id;

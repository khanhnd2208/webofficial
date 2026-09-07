-- Keep writes from the previous release valid after courseId becomes required.
-- The live process still omits courseId until the candidate is promoted; a
-- stable UNASSIGNED default avoids PostgreSQL 23502 during that window.

INSERT INTO "TeachingCourse" ("id", "courseCode", "courseName", "createdAt", "updatedAt")
VALUES (
    'c' || substr(md5('unassigned'), 1, 24),
    'UNASSIGNED',
    'Chưa phân loại',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("courseCode") DO NOTHING;

DO $$
DECLARE
    unassigned_id text;
BEGIN
    SELECT id INTO unassigned_id
    FROM "TeachingCourse"
    WHERE "courseCode" = 'UNASSIGNED'
    LIMIT 1;

    IF unassigned_id IS NULL THEN
        RAISE EXCEPTION 'UNASSIGNED course is required as the legacy courseId default';
    END IF;

    EXECUTE format(
        'ALTER TABLE "TeachingClass" ALTER COLUMN "courseId" SET DEFAULT %L',
        unassigned_id
    );
    EXECUTE format(
        'ALTER TABLE "ActiveRecallDeck" ALTER COLUMN "courseId" SET DEFAULT %L',
        unassigned_id
    );
END
$$;

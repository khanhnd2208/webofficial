-- CreateTable
CREATE TABLE "TeachingCourse" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeachingCourse_courseCode_key" ON "TeachingCourse"("courseCode");

-- CreateIndex
CREATE INDEX "TeachingCourse_updatedAt_idx" ON "TeachingCourse"("updatedAt" DESC);

-- AlterTable
ALTER TABLE "TeachingClass" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "ActiveRecallDeck" ADD COLUMN "courseId" TEXT;

-- Backfill courses from existing classes
INSERT INTO "TeachingCourse" ("id", "courseCode", "courseName", "createdAt", "updatedAt")
SELECT
    'c' || substr(md5(lower(
        CASE
            WHEN upper(trim(c."courseCode")) = 'HRM' THEN 'HRM101'
            WHEN trim(c."courseCode") = '' THEN 'UNASSIGNED'
            ELSE upper(trim(c."courseCode"))
        END
    )), 1, 24),
    CASE
        WHEN upper(trim(c."courseCode")) = 'HRM' THEN 'HRM101'
        WHEN trim(c."courseCode") = '' THEN 'UNASSIGNED'
        ELSE upper(trim(c."courseCode"))
    END,
    (ARRAY_AGG(c."courseName" ORDER BY c."updatedAt" DESC))[1],
    MIN(c."createdAt"),
    CURRENT_TIMESTAMP
FROM "TeachingClass" c
GROUP BY
    CASE
        WHEN upper(trim(c."courseCode")) = 'HRM' THEN 'HRM101'
        WHEN trim(c."courseCode") = '' THEN 'UNASSIGNED'
        ELSE upper(trim(c."courseCode"))
    END;

UPDATE "TeachingClass" AS cls
SET "courseId" = course.id
FROM "TeachingCourse" AS course
WHERE course."courseCode" = CASE
    WHEN upper(trim(cls."courseCode")) = 'HRM' THEN 'HRM101'
    WHEN trim(cls."courseCode") = '' THEN 'UNASSIGNED'
    ELSE upper(trim(cls."courseCode"))
END;

-- Canonicalize the known HRM aliases before generic subject matching.
INSERT INTO "TeachingCourse" ("id", "courseCode", "courseName", "createdAt", "updatedAt")
SELECT
    'c' || substr(md5('hrm101'), 1, 24),
    'HRM101',
    'Human Resource Management',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM "ActiveRecallDeck"
    WHERE "courseId" IS NULL
      AND lower(trim(subject)) IN ('human resource management', 'hrm', 'hrm101')
)
ON CONFLICT ("courseCode") DO NOTHING;

UPDATE "ActiveRecallDeck" AS deck
SET "courseId" = course.id
FROM "TeachingCourse" AS course
WHERE deck."courseId" IS NULL
  AND course."courseCode" = 'HRM101'
  AND lower(trim(deck.subject)) IN ('human resource management', 'hrm', 'hrm101');

-- Generic subject → course mapping for existing Active Recall decks
UPDATE "ActiveRecallDeck" AS deck
SET "courseId" = (
    SELECT course.id
    FROM "TeachingCourse" AS course
    WHERE
        lower(trim(deck.subject)) = lower(trim(course."courseName"))
        OR lower(trim(deck.subject)) = lower(trim(course."courseCode"))
    ORDER BY
        CASE
            WHEN lower(trim(deck.subject)) = lower(trim(course."courseCode")) THEN 0
            ELSE 1
        END,
        course."updatedAt" DESC,
        course.id
    LIMIT 1
)
WHERE deck."courseId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "TeachingCourse" AS course
    WHERE
      lower(trim(deck.subject)) = lower(trim(course."courseName"))
      OR lower(trim(deck.subject)) = lower(trim(course."courseCode"))
  );

-- Create leftover courses from unmatched deck subjects
INSERT INTO "TeachingCourse" ("id", "courseCode", "courseName", "createdAt", "updatedAt")
SELECT
    'd' || substr(md5(lower(trim(COALESCE(NULLIF(deck.subject, ''), 'UNASSIGNED')))), 1, 24),
    CASE
        WHEN regexp_replace(trim(deck.subject), '[^A-Za-z0-9]+', '', 'g') = '' THEN 'UNASSIGNED'
        ELSE 'AR-' || upper(md5(lower(trim(deck.subject))))
    END,
    COALESCE(NULLIF(trim(deck.subject), ''), 'Chưa phân loại'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ActiveRecallDeck" AS deck
WHERE deck."courseId" IS NULL
GROUP BY
    CASE
        WHEN regexp_replace(trim(deck.subject), '[^A-Za-z0-9]+', '', 'g') = '' THEN 'UNASSIGNED'
        ELSE 'AR-' || upper(md5(lower(trim(deck.subject))))
    END,
    COALESCE(NULLIF(trim(deck.subject), ''), 'Chưa phân loại'),
    'd' || substr(md5(lower(trim(COALESCE(NULLIF(deck.subject, ''), 'UNASSIGNED')))), 1, 24)
ON CONFLICT ("courseCode") DO NOTHING;

UPDATE "ActiveRecallDeck" AS deck
SET "courseId" = course.id
FROM "TeachingCourse" AS course
WHERE deck."courseId" IS NULL
  AND (
    (
      regexp_replace(trim(deck.subject), '[^A-Za-z0-9]+', '', 'g') = ''
      AND course."courseCode" = 'UNASSIGNED'
    )
    OR (
      regexp_replace(trim(deck.subject), '[^A-Za-z0-9]+', '', 'g') <> ''
      AND course."courseCode" = 'AR-' || upper(md5(lower(trim(deck.subject))))
    )
  );

-- Enforce required course ownership
ALTER TABLE "TeachingClass" ALTER COLUMN "courseId" SET NOT NULL;
ALTER TABLE "ActiveRecallDeck" ALTER COLUMN "courseId" SET NOT NULL;

ALTER TABLE "TeachingClass"
    ADD CONSTRAINT "TeachingClass_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "TeachingCourse"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActiveRecallDeck"
    ADD CONSTRAINT "ActiveRecallDeck_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "TeachingCourse"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "TeachingClass_courseId_status_updatedAt_idx"
    ON "TeachingClass"("courseId", "status", "updatedAt");

CREATE INDEX "ActiveRecallDeck_courseId_status_position_idx"
    ON "ActiveRecallDeck"("courseId", "status", "position");

-- CreateTable
CREATE TABLE "TeachingClassRecallDeck" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingClassRecallDeck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeachingClassRecallDeck_classId_deckId_key"
    ON "TeachingClassRecallDeck"("classId", "deckId");

CREATE INDEX "TeachingClassRecallDeck_classId_enabled_displayOrder_idx"
    ON "TeachingClassRecallDeck"("classId", "enabled", "displayOrder");

CREATE INDEX "TeachingClassRecallDeck_deckId_idx"
    ON "TeachingClassRecallDeck"("deckId");

ALTER TABLE "TeachingClassRecallDeck"
    ADD CONSTRAINT "TeachingClassRecallDeck_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "TeachingClass"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeachingClassRecallDeck"
    ADD CONSTRAINT "TeachingClassRecallDeck_deckId_fkey"
    FOREIGN KEY ("deckId") REFERENCES "ActiveRecallDeck"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable published decks on every matching class
INSERT INTO "TeachingClassRecallDeck" ("id", "classId", "deckId", "enabled", "displayOrder", "createdAt", "updatedAt")
SELECT
    'r' || substr(md5(cls.id || deck.id), 1, 24),
    cls.id,
    deck.id,
    true,
    deck.position,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "TeachingClass" AS cls
JOIN "ActiveRecallDeck" AS deck ON deck."courseId" = cls."courseId"
WHERE deck.status = 'PUBLISHED'
ON CONFLICT ("classId", "deckId") DO NOTHING;

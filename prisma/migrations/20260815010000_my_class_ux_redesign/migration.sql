-- AlterTable
ALTER TABLE "MyClassCourse" ADD COLUMN IF NOT EXISTS "level" TEXT;
ALTER TABLE "MyClassCourse" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "MyClassLesson" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER;

-- AlterTable
ALTER TABLE "MyClassSection" ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "KnowledgeUnitRevision" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER;

-- AlterTable
ALTER TABLE "MyClassTest" ADD COLUMN IF NOT EXISTS "passScore" INTEGER;

-- Backfill section slugs from title + position (unique per lesson)
UPDATE "MyClassSection" AS s
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(
        TRIM(s."title"),
        'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
        'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    ),
    '(^-+|-+$)',
    '',
    'g'
  )
) || CASE WHEN s."position" > 0 THEN '-' || (s."position" + 1)::TEXT ELSE '' END
WHERE s."slug" = '' OR s."slug" IS NULL;

-- Deduplicate any collisions within a lesson
WITH ranked AS (
  SELECT id, "lessonId", slug,
    ROW_NUMBER() OVER (PARTITION BY "lessonId", slug ORDER BY position, id) AS rn
  FROM "MyClassSection"
)
UPDATE "MyClassSection" s
SET slug = s.slug || '-' || ranked.rn::TEXT
FROM ranked
WHERE s.id = ranked.id AND ranked.rn > 1;

-- Ensure no empty slugs remain
UPDATE "MyClassSection"
SET slug = 'phan-' || (position + 1)::TEXT
WHERE slug = '' OR slug IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MyClassSection_lessonId_slug_key" ON "MyClassSection"("lessonId", "slug");

-- CreateTable
CREATE TABLE IF NOT EXISTS "MyClassActivityDay" (
  "id" TEXT NOT NULL,
  "actorKey" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MyClassActivityDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MyClassActivityDay_actorKey_courseId_day_key"
  ON "MyClassActivityDay"("actorKey", "courseId", "day");
CREATE INDEX IF NOT EXISTS "MyClassActivityDay_actorKey_day_idx"
  ON "MyClassActivityDay"("actorKey", "day");
CREATE INDEX IF NOT EXISTS "MyClassActivityDay_courseId_day_idx"
  ON "MyClassActivityDay"("courseId", "day");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MyClassActivityDay_courseId_fkey'
  ) THEN
    ALTER TABLE "MyClassActivityDay"
      ADD CONSTRAINT "MyClassActivityDay_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateEnum (PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MyClassCourseLevel') THEN
    CREATE TYPE "MyClassCourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
  END IF;
END $$;

-- Convert level column to enum if still text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MyClassCourse' AND column_name = 'level' AND data_type = 'text'
  ) THEN
    ALTER TABLE "MyClassCourse"
      ALTER COLUMN "level" TYPE "MyClassCourseLevel"
      USING (
        CASE
          WHEN "level" IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED') THEN "level"::"MyClassCourseLevel"
          ELSE NULL
        END
      );
  END IF;
END $$;

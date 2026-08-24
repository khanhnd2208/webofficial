-- Applied before 20260822090000_teaching_group_board_canonical_names_undo
-- because Prisma sorts same-timestamp migrations alphabetically.
-- Do not rename this folder; it is already recorded in _prisma_migrations.
-- Standardize teaching score limits across every class.
UPDATE "TeachingClass"
SET "cpMaxPoints" = 5,
    "cpPerAbsence" = 0.5;

ALTER TABLE "TeachingClass"
ALTER COLUMN "cpMaxPoints" SET DEFAULT 5,
ALTER COLUMN "cpPerAbsence" SET DEFAULT 0.5;

ALTER TABLE "TeachingClass"
RENAME COLUMN "attendanceNote" TO "classRules";

ALTER TABLE "TeachingClass"
ADD CONSTRAINT "TeachingClass_cpMaxPoints_fixed_check" CHECK ("cpMaxPoints" = 5),
ADD CONSTRAINT "TeachingClass_cpPerAbsence_fixed_check" CHECK ("cpPerAbsence" = 0.5);

ALTER TABLE "TeachingClass"
  ADD COLUMN "attendanceMaxPoints" DECIMAL(4,2) NOT NULL DEFAULT 5,
  ADD COLUMN "absenceDeductionPoints" DECIMAL(4,2) NOT NULL DEFAULT 0.5,
  ADD COLUMN "lateDeductionPoints" DECIMAL(4,2) NOT NULL DEFAULT 0.5,
  ADD COLUMN "lateCountsTowardAbsenceThreshold" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "giftDeductionPoints" DECIMAL(4,2) NOT NULL DEFAULT 1;

-- Normalize existing classes to the behavior that was previously hardcoded in the domain.
UPDATE "TeachingClass"
SET "attendanceMaxPoints" = 5,
    "cpMaxPoints" = 5,
    "absenceDeductionPoints" = 0.5,
    "lateDeductionPoints" = 0.5,
    "lateCountsTowardAbsenceThreshold" = true,
    "giftDeductionPoints" = 1;

ALTER TABLE "TeachingClass"
  ADD CONSTRAINT "TeachingClass_score_policy_sum_check"
  CHECK ("attendanceMaxPoints" >= 0 AND "cpMaxPoints" >= 0 AND "attendanceMaxPoints" + "cpMaxPoints" = 10),
  ADD CONSTRAINT "TeachingClass_score_policy_nonnegative_check"
  CHECK ("absenceDeductionPoints" >= 0 AND "lateDeductionPoints" >= 0 AND "giftDeductionPoints" >= 0);

-- 20260822090000_standardize_teaching_scores pinned cpMaxPoints to 5.
-- 20260830100000_teaching_score_policy made the split configurable
-- (attendance + CP = 10) but left the old check in place, so any class
-- setting CP to something other than 5 failed with a database error.
-- The sum check stays; only the obsolete fixed-value check goes.
ALTER TABLE "TeachingClass" DROP CONSTRAINT IF EXISTS "TeachingClass_cpMaxPoints_fixed_check";

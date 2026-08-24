-- Polymorphic attempt answers
ALTER TABLE "MyClassAttemptAnswer" ADD COLUMN "typeSnapshot" "MyClassQuestionType" NOT NULL DEFAULT 'MCQ_SINGLE';
ALTER TABLE "MyClassAttemptAnswer" ADD COLUMN "answerSnapshot" JSONB;
ALTER TABLE "MyClassAttemptAnswer" ADD COLUMN "response" JSONB;
ALTER TABLE "MyClassAttemptAnswer" ADD COLUMN "feedbackSnapshot" JSONB;
ALTER TABLE "MyClassAttemptAnswer" ADD COLUMN "earned" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MyClassAttemptAnswer" ADD COLUMN "max" DOUBLE PRECISION NOT NULL DEFAULT 1;

UPDATE "MyClassAttemptAnswer"
SET
  "answerSnapshot" = jsonb_build_object('type', 'MCQ_SINGLE', 'correctKey', COALESCE("correctKey", '')),
  "response" = jsonb_build_object('type', 'MCQ_SINGLE', 'key', COALESCE("chosenKey", '')),
  "earned" = CASE WHEN "isCorrect" THEN 1 ELSE 0 END,
  "max" = 1
WHERE "answerSnapshot" IS NULL OR "response" IS NULL;

ALTER TABLE "MyClassAttemptAnswer" ALTER COLUMN "answerSnapshot" SET NOT NULL;
ALTER TABLE "MyClassAttemptAnswer" ALTER COLUMN "response" SET NOT NULL;

ALTER TABLE "MyClassAttemptAnswer" ALTER COLUMN "correctKey" DROP NOT NULL;
ALTER TABLE "MyClassAttemptAnswer" ALTER COLUMN "chosenKey" DROP NOT NULL;

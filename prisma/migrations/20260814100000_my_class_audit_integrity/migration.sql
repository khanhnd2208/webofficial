ALTER TABLE "MyClassAttemptKuEvidence"
  ADD COLUMN "knowledgeUnitSlugSnapshot" TEXT,
  ADD COLUMN "knowledgeUnitTitleSnapshot" TEXT,
  ADD COLUMN "rawResponseCount" INTEGER;

UPDATE "MyClassAttemptKuEvidence" e
SET
  "knowledgeUnitSlugSnapshot" = ku."slug",
  "knowledgeUnitTitleSnapshot" = COALESCE(rev."title", ku."slug")
FROM "KnowledgeUnit" ku
LEFT JOIN "KnowledgeUnitRevision" rev ON rev."id" = ku."currentPublishedRevisionId"
WHERE e."knowledgeUnitId" = ku."id";

ALTER TABLE "MyClassQuestion"
  ADD CONSTRAINT "MyClassQuestion_difficulty_check" CHECK ("difficulty" BETWEEN 1 AND 5);

ALTER TABLE "MyClassTestAttempt"
  ADD CONSTRAINT "MyClassTestAttempt_score_total_check" CHECK ("score" >= 0 AND "total" >= 0 AND "score" <= "total");

ALTER TABLE "MyClassAttemptKuEvidence"
  ADD CONSTRAINT "MyClassAttemptKuEvidence_counts_check" CHECK (
    "weight" >= 0 AND "correctCount" >= 0 AND "questionCount" >= 0 AND "correctCount" <= "questionCount"
  );

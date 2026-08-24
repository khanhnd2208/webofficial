-- My Class v2: actor-keyed progress, guest test attempts, vocab assignments

ALTER TABLE "MyClassKuProgress" ADD COLUMN "guestId" TEXT;
ALTER TABLE "MyClassKuProgress" ADD COLUMN "actorKey" TEXT;
ALTER TABLE "MyClassKuProgress" ADD COLUMN "firstViewedAt" TIMESTAMP(3);
ALTER TABLE "MyClassKuProgress" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "MyClassKuProgress" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "MyClassKuProgress"
SET
  "actorKey" = 'user:' || "userId",
  "firstViewedAt" = "viewedAt";

ALTER TABLE "MyClassKuProgress" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "MyClassKuProgress" ALTER COLUMN "actorKey" SET NOT NULL;

DROP INDEX IF EXISTS "MyClassKuProgress_courseId_knowledgeUnitId_userId_key";
DROP INDEX IF EXISTS "MyClassKuProgress_userId_courseId_idx";

CREATE UNIQUE INDEX "MyClassKuProgress_courseId_knowledgeUnitId_actorKey_key"
  ON "MyClassKuProgress"("courseId", "knowledgeUnitId", "actorKey");
CREATE INDEX "MyClassKuProgress_userId_idx" ON "MyClassKuProgress"("userId");
CREATE INDEX "MyClassKuProgress_guestId_idx" ON "MyClassKuProgress"("guestId");
CREATE INDEX "MyClassKuProgress_courseId_actorKey_idx" ON "MyClassKuProgress"("courseId", "actorKey");

ALTER TABLE "MyClassKuProgress"
  ADD CONSTRAINT "MyClassKuProgress_actor_xor"
  CHECK (
    ("userId" IS NOT NULL AND "guestId" IS NULL)
    OR ("guestId" IS NOT NULL AND "userId" IS NULL)
  );

ALTER TABLE "MyClassKuProgress" DROP COLUMN "viewedAt";

ALTER TABLE "MyClassTestAttempt" ADD COLUMN "guestId" TEXT;
CREATE INDEX "MyClassTestAttempt_guestId_submittedAt_idx" ON "MyClassTestAttempt"("guestId", "submittedAt");

ALTER TABLE "MyClassTestAttempt"
  ADD CONSTRAINT "MyClassTestAttempt_actor_xor"
  CHECK (
    ("userId" IS NULL AND "guestId" IS NULL)
    OR ("userId" IS NOT NULL AND "guestId" IS NULL)
    OR ("guestId" IS NOT NULL AND "userId" IS NULL)
  );

CREATE TABLE "MyClassVocabAssignment" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "lessonId" TEXT,
  "vocabSetId" TEXT NOT NULL,
  "scopeKey" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MyClassVocabAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MyClassVocabAssignment_scopeKey_key" ON "MyClassVocabAssignment"("scopeKey");
CREATE INDEX "MyClassVocabAssignment_courseId_position_idx" ON "MyClassVocabAssignment"("courseId", "position");
CREATE INDEX "MyClassVocabAssignment_lessonId_position_idx" ON "MyClassVocabAssignment"("lessonId", "position");
CREATE INDEX "MyClassVocabAssignment_vocabSetId_idx" ON "MyClassVocabAssignment"("vocabSetId");

ALTER TABLE "MyClassVocabAssignment"
  ADD CONSTRAINT "MyClassVocabAssignment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MyClassVocabAssignment"
  ADD CONSTRAINT "MyClassVocabAssignment_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "MyClassLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MyClassVocabAssignment"
  ADD CONSTRAINT "MyClassVocabAssignment_vocabSetId_fkey"
  FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

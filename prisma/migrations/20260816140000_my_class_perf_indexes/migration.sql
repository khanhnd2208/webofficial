-- CreateIndex
CREATE INDEX "MyClassCourse_status_updatedAt_idx" ON "MyClassCourse"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "MyClassSectionKnowledgeUnit_knowledgeUnitId_idx" ON "MyClassSectionKnowledgeUnit"("knowledgeUnitId");

-- CreateIndex
CREATE INDEX "KnowledgeUnitRelation_fromId_idx" ON "KnowledgeUnitRelation"("fromId");

-- CreateIndex
CREATE INDEX "KnowledgeUnitRelation_toId_idx" ON "KnowledgeUnitRelation"("toId");

-- CreateIndex
CREATE INDEX "MyClassTestQuestion_questionId_idx" ON "MyClassTestQuestion"("questionId");

-- CreateIndex
CREATE INDEX "MyClassKuProgress_courseId_actorKey_lastViewedAt_idx" ON "MyClassKuProgress"("courseId", "actorKey", "lastViewedAt");

-- AlterTable
ALTER TABLE "MyClassAttemptAnswer" DROP COLUMN IF EXISTS "feedbackSnapshot";

-- CreateEnum
CREATE TYPE "MyClassPublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MyClassRevisionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MyClassQuestionLevel" AS ENUM ('FOUNDATION', 'ACADEMIC', 'EXPERT');

-- CreateEnum
CREATE TYPE "MyClassTestScope" AS ENUM ('COURSE', 'LESSON', 'SECTION');

-- CreateEnum
CREATE TYPE "MyClassMembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED');

-- CreateTable
CREATE TABLE "MyClassCourse" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "MyClassCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyClassLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassSection" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyClassSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeUnit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "currentPublishedRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeUnitRevision" (
    "id" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "foundationHtml" TEXT NOT NULL DEFAULT '',
    "academicHtml" TEXT NOT NULL DEFAULT '',
    "expertHtml" TEXT NOT NULL DEFAULT '',
    "status" "MyClassRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeUnitRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassSectionKnowledgeUnit" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MyClassSectionKnowledgeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeUnitRelation" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeUnitRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassQuestion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctKey" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "level" "MyClassQuestionLevel" NOT NULL DEFAULT 'ACADEMIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MyClassQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassQuestionKnowledgeUnit" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,

    CONSTRAINT "MyClassQuestionKnowledgeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassTest" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "sectionId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "scope" "MyClassTestScope" NOT NULL DEFAULT 'COURSE',
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "MyClassTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassTestQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MyClassTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassTestAttempt" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "userId" TEXT,
    "cohortId" TEXT,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MyClassTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "stemSnapshot" TEXT NOT NULL,
    "optionsSnapshot" JSONB NOT NULL,
    "correctKey" TEXT NOT NULL,
    "chosenKey" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "MyClassAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassAttemptKuEvidence" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "correctCount" DOUBLE PRECISION NOT NULL,
    "questionCount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MyClassAttemptKuEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassKuProgress" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MyClassKuProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassCohort" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "term" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "MyClassPublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MyClassCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyClassMembership" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "userId" TEXT,
    "status" "MyClassMembershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "MyClassMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MyClassCourse_slug_key" ON "MyClassCourse"("slug");

-- CreateIndex
CREATE INDEX "MyClassLesson_courseId_position_idx" ON "MyClassLesson"("courseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassLesson_courseId_slug_key" ON "MyClassLesson"("courseId", "slug");

-- CreateIndex
CREATE INDEX "MyClassSection_lessonId_position_idx" ON "MyClassSection"("lessonId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeUnit_slug_key" ON "KnowledgeUnit"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeUnitRevision_knowledgeUnitId_status_idx" ON "KnowledgeUnitRevision"("knowledgeUnitId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeUnitRevision_knowledgeUnitId_version_key" ON "KnowledgeUnitRevision"("knowledgeUnitId", "version");

-- CreateIndex
CREATE INDEX "MyClassSectionKnowledgeUnit_sectionId_position_idx" ON "MyClassSectionKnowledgeUnit"("sectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassSectionKnowledgeUnit_sectionId_knowledgeUnitId_key" ON "MyClassSectionKnowledgeUnit"("sectionId", "knowledgeUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeUnitRelation_fromId_toId_key" ON "KnowledgeUnitRelation"("fromId", "toId");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassQuestion_slug_key" ON "MyClassQuestion"("slug");

-- CreateIndex
CREATE INDEX "MyClassQuestion_isActive_level_difficulty_idx" ON "MyClassQuestion"("isActive", "level", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassQuestionKnowledgeUnit_questionId_knowledgeUnitId_key" ON "MyClassQuestionKnowledgeUnit"("questionId", "knowledgeUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassTest_slug_key" ON "MyClassTest"("slug");

-- CreateIndex
CREATE INDEX "MyClassTest_courseId_status_idx" ON "MyClassTest"("courseId", "status");

-- CreateIndex
CREATE INDEX "MyClassTest_lessonId_status_idx" ON "MyClassTest"("lessonId", "status");

-- CreateIndex
CREATE INDEX "MyClassTest_sectionId_status_idx" ON "MyClassTest"("sectionId", "status");

-- CreateIndex
CREATE INDEX "MyClassTestQuestion_testId_position_idx" ON "MyClassTestQuestion"("testId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassTestQuestion_testId_questionId_key" ON "MyClassTestQuestion"("testId", "questionId");

-- CreateIndex
CREATE INDEX "MyClassTestAttempt_userId_submittedAt_idx" ON "MyClassTestAttempt"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "MyClassTestAttempt_testId_submittedAt_idx" ON "MyClassTestAttempt"("testId", "submittedAt");

-- CreateIndex
CREATE INDEX "MyClassTestAttempt_cohortId_submittedAt_idx" ON "MyClassTestAttempt"("cohortId", "submittedAt");

-- CreateIndex
CREATE INDEX "MyClassAttemptAnswer_attemptId_idx" ON "MyClassAttemptAnswer"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassAttemptKuEvidence_attemptId_knowledgeUnitId_key" ON "MyClassAttemptKuEvidence"("attemptId", "knowledgeUnitId");

-- CreateIndex
CREATE INDEX "MyClassKuProgress_userId_courseId_idx" ON "MyClassKuProgress"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassKuProgress_courseId_knowledgeUnitId_userId_key" ON "MyClassKuProgress"("courseId", "knowledgeUnitId", "userId");

-- CreateIndex
CREATE INDEX "MyClassCohort_courseId_status_idx" ON "MyClassCohort"("courseId", "status");

-- CreateIndex
CREATE INDEX "MyClassMembership_email_status_idx" ON "MyClassMembership"("email", "status");

-- CreateIndex
CREATE INDEX "MyClassMembership_userId_status_idx" ON "MyClassMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MyClassMembership_cohortId_email_key" ON "MyClassMembership"("cohortId", "email");

-- AddForeignKey
ALTER TABLE "MyClassLesson" ADD CONSTRAINT "MyClassLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassSection" ADD CONSTRAINT "MyClassSection_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "MyClassLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeUnitRevision" ADD CONSTRAINT "KnowledgeUnitRevision_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassSectionKnowledgeUnit" ADD CONSTRAINT "MyClassSectionKnowledgeUnit_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "MyClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassSectionKnowledgeUnit" ADD CONSTRAINT "MyClassSectionKnowledgeUnit_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeUnitRelation" ADD CONSTRAINT "KnowledgeUnitRelation_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "KnowledgeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeUnitRelation" ADD CONSTRAINT "KnowledgeUnitRelation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "KnowledgeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassQuestionKnowledgeUnit" ADD CONSTRAINT "MyClassQuestionKnowledgeUnit_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MyClassQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassQuestionKnowledgeUnit" ADD CONSTRAINT "MyClassQuestionKnowledgeUnit_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassTest" ADD CONSTRAINT "MyClassTest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassTest" ADD CONSTRAINT "MyClassTest_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "MyClassLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassTest" ADD CONSTRAINT "MyClassTest_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "MyClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassTestQuestion" ADD CONSTRAINT "MyClassTestQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "MyClassTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassTestQuestion" ADD CONSTRAINT "MyClassTestQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MyClassQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassTestAttempt" ADD CONSTRAINT "MyClassTestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "MyClassTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassAttemptAnswer" ADD CONSTRAINT "MyClassAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MyClassTestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassAttemptAnswer" ADD CONSTRAINT "MyClassAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MyClassQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassAttemptKuEvidence" ADD CONSTRAINT "MyClassAttemptKuEvidence_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MyClassTestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassAttemptKuEvidence" ADD CONSTRAINT "MyClassAttemptKuEvidence_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassKuProgress" ADD CONSTRAINT "MyClassKuProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassKuProgress" ADD CONSTRAINT "MyClassKuProgress_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassCohort" ADD CONSTRAINT "MyClassCohort_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "MyClassCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyClassMembership" ADD CONSTRAINT "MyClassMembership_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "MyClassCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

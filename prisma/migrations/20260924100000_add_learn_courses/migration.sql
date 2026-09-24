-- CreateEnum
CREATE TYPE "LearnCourseLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LearnSectionType" AS ENUM ('READING', 'QUIZ');

-- CreateTable
CREATE TABLE "LearnCourse" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "level" "LearnCourseLevel" NOT NULL DEFAULT 'BASIC',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "LearnCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnSection" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "LearnSectionType" NOT NULL DEFAULT 'READING',
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "summary" TEXT NOT NULL DEFAULT '',
    "keyTakeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "markdown" TEXT NOT NULL DEFAULT '',
    "checkpoint" JSONB,
    "quiz" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnSectionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "note" TEXT NOT NULL DEFAULT '',
    "quizResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnSectionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnCourse_slug_key" ON "LearnCourse"("slug");

-- CreateIndex
CREATE INDEX "LearnCourse_status_position_idx" ON "LearnCourse"("status", "position");

-- CreateIndex
CREATE INDEX "LearnLesson_courseId_position_idx" ON "LearnLesson"("courseId", "position");

-- CreateIndex
CREATE INDEX "LearnSection_lessonId_position_idx" ON "LearnSection"("lessonId", "position");

-- CreateIndex
CREATE INDEX "LearnSectionProgress_userId_courseId_idx" ON "LearnSectionProgress"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnSectionProgress_userId_sectionId_key" ON "LearnSectionProgress"("userId", "sectionId");

-- AddForeignKey
ALTER TABLE "LearnLesson" ADD CONSTRAINT "LearnLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LearnCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnSection" ADD CONSTRAINT "LearnSection_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LearnLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnSectionProgress" ADD CONSTRAINT "LearnSectionProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LearnCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnSectionProgress" ADD CONSTRAINT "LearnSectionProgress_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "LearnSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;


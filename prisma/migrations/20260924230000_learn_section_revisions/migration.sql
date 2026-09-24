-- Snapshot a section before a later save, an import overwrite, or a restore.

CREATE TABLE "LearnSectionRevision" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "markdown" TEXT NOT NULL DEFAULT '',
    "keyTakeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checkpoint" JSONB,
    "quiz" JSONB,
    "reason" TEXT NOT NULL DEFAULT 'autosave',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnSectionRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LearnSectionRevision_sectionId_createdAt_idx" ON "LearnSectionRevision"("sectionId", "createdAt");

ALTER TABLE "LearnSectionRevision" ADD CONSTRAINT "LearnSectionRevision_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "LearnSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

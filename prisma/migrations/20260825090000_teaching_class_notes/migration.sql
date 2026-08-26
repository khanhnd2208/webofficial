CREATE TABLE "TeachingClassNote" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "draftTitle" TEXT NOT NULL DEFAULT '',
    "draftHtml" TEXT NOT NULL DEFAULT '',
    "publishedTitle" TEXT,
    "publishedHtml" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingClassNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeachingClassNote_classId_displayOrder_idx" ON "TeachingClassNote"("classId", "displayOrder");

ALTER TABLE "TeachingClassNote" ADD CONSTRAINT "TeachingClassNote_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "TeachingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "TeachingClass"
ADD COLUMN "publicSlug" TEXT,
ADD COLUMN "publicTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN "publicSummary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "publicDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN "publicAnnouncement" TEXT NOT NULL DEFAULT '',
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicPublishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TeachingClassPublicLink" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingClassPublicLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeachingClass_publicSlug_key" ON "TeachingClass"("publicSlug");

-- CreateIndex
CREATE INDEX "TeachingClass_isPublic_updatedAt_idx" ON "TeachingClass"("isPublic", "updatedAt");

-- CreateIndex
CREATE INDEX "TeachingClassPublicLink_classId_displayOrder_idx"
ON "TeachingClassPublicLink"("classId", "displayOrder");

-- AddForeignKey
ALTER TABLE "TeachingClassPublicLink"
ADD CONSTRAINT "TeachingClassPublicLink_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "TeachingClass"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

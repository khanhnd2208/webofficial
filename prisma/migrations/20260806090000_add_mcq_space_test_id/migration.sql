-- AlterTable
ALTER TABLE "McqQuestion" ADD COLUMN "spaceTestId" TEXT;

-- CreateIndex
CREATE INDEX "McqQuestion_spaceTestId_isActive_idx" ON "McqQuestion"("spaceTestId", "isActive");

-- AddForeignKey
ALTER TABLE "McqQuestion" ADD CONSTRAINT "McqQuestion_spaceTestId_fkey" FOREIGN KEY ("spaceTestId") REFERENCES "SpaceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

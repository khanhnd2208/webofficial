-- Transitional integrity: existing legacy boards may remain NULL until the data
-- migration succeeds, but new boards must always have a tutorial.
CREATE UNIQUE INDEX IF NOT EXISTS "TeachingGroupBoard_tutorialClassId_key"
  ON "TeachingGroupBoard"("tutorialClassId");
ALTER TABLE "TeachingGroupBoard" ADD CONSTRAINT "TeachingGroupBoard_tutorial_required"
  CHECK ("tutorialClassId" IS NOT NULL) NOT VALID;

-- Independent archive: survives deletion of old boards and their audit rows.
CREATE TABLE "TeachingGroupBoardArchive" (
  "id" TEXT NOT NULL,
  "legacyBoardId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeachingGroupBoardArchive_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeachingGroupBoardArchive_legacyBoardId_key"
  ON "TeachingGroupBoardArchive"("legacyBoardId");

-- Fresh installations can finish immediately; populated ones finish via script.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM "TeachingGroupBoard" WHERE "tutorialClassId" IS NULL) THEN
    ALTER TABLE "TeachingGroupBoard" VALIDATE CONSTRAINT "TeachingGroupBoard_tutorial_required";
    ALTER TABLE "TeachingGroupBoard" ALTER COLUMN "tutorialClassId" SET NOT NULL;
  END IF;
END $$;

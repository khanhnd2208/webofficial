-- Teaching group board: one configurable board per teaching class.
ALTER TABLE "TeachingClass" ADD COLUMN "classCode" TEXT NOT NULL DEFAULT '';
UPDATE "TeachingClass" SET "classCode" = "groupNo" WHERE "classCode" = '';
CREATE UNIQUE INDEX "TeachingClass_courseCode_classCode_term_key" ON "TeachingClass"("courseCode", "classCode", "term");

CREATE TYPE "TeachingGroupAuditActor" AS ENUM ('ADMIN', 'STUDENT', 'SYSTEM');
CREATE TYPE "TeachingGroupAuditAction" AS ENUM ('CONFIGURE', 'OPEN', 'LOCK', 'MOVE', 'TRANSFER_LEADER', 'RANDOMIZE', 'CLEAR', 'RENAME');

CREATE TABLE "TeachingGroupBoard" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "groupCount" INTEGER NOT NULL DEFAULT 0,
  "groupSize" INTEGER NOT NULL DEFAULT 0,
  "isOpen" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 0,
  "claimEpoch" INTEGER NOT NULL DEFAULT 0,
  "openedAt" TIMESTAMP(3),
  "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeachingGroupBoard_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeachingGroupBoard_classId_key" ON "TeachingGroupBoard"("classId");
ALTER TABLE "TeachingGroupBoard" ADD CONSTRAINT "TeachingGroupBoard_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeachingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TeachingGroup" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeachingGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeachingGroup_boardId_displayOrder_key" ON "TeachingGroup"("boardId", "displayOrder");
CREATE INDEX "TeachingGroup_boardId_displayOrder_idx" ON "TeachingGroup"("boardId", "displayOrder");
ALTER TABLE "TeachingGroup" ADD CONSTRAINT "TeachingGroup_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TeachingGroupBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TeachingGroupAssignment" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "slotIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeachingGroupAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeachingGroupAssignment_enrollmentId_key" ON "TeachingGroupAssignment"("enrollmentId");
CREATE UNIQUE INDEX "TeachingGroupAssignment_groupId_slotIndex_key" ON "TeachingGroupAssignment"("groupId", "slotIndex");
CREATE INDEX "TeachingGroupAssignment_boardId_groupId_idx" ON "TeachingGroupAssignment"("boardId", "groupId");
ALTER TABLE "TeachingGroupAssignment" ADD CONSTRAINT "TeachingGroupAssignment_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TeachingGroupBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeachingGroupAssignment" ADD CONSTRAINT "TeachingGroupAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TeachingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeachingGroupAssignment" ADD CONSTRAINT "TeachingGroupAssignment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TeachingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TeachingGroupAudit" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "actor" "TeachingGroupAuditActor" NOT NULL,
  "action" "TeachingGroupAuditAction" NOT NULL,
  "actorEnrollmentId" TEXT,
  "actorUserId" TEXT,
  "enrollmentId" TEXT,
  "fromGroupOrder" INTEGER,
  "fromSlotIndex" INTEGER,
  "toGroupOrder" INTEGER,
  "toSlotIndex" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeachingGroupAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeachingGroupAudit_boardId_createdAt_idx" ON "TeachingGroupAudit"("boardId", "createdAt");
ALTER TABLE "TeachingGroupAudit" ADD CONSTRAINT "TeachingGroupAudit_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TeachingGroupBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

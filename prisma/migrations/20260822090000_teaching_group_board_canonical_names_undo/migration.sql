ALTER TYPE "TeachingGroupAuditAction" ADD VALUE 'UNDO';
ALTER TABLE "TeachingGroup" DROP COLUMN "name";

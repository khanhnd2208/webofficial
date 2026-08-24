-- CreateEnum
CREATE TYPE "TeachingClassStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TeachingEnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TeachingAttendanceMethod" AS ENUM ('ROLL_CALL', 'SHORT_TEST');

-- CreateEnum
CREATE TYPE "TeachingAttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT_UNEXCUSED', 'ABSENT_EXCUSED', 'MAKEUP');

-- CreateTable
CREATE TABLE "TeachingClass" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "groupNo" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "credits" INTEGER,
    "lecturerName" TEXT NOT NULL DEFAULT '',
    "lecturerCode" TEXT NOT NULL DEFAULT '',
    "totalWeeks" INTEGER NOT NULL DEFAULT 10,
    "cpMaxPoints" DECIMAL(4,2) NOT NULL DEFAULT 10,
    "cpPerAbsence" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "maxParticipationPerSession" DECIMAL(4,2) NOT NULL DEFAULT 2,
    "absenceThresholdPercent" INTEGER NOT NULL DEFAULT 20,
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" "TeachingClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingTutorialClass" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "room" TEXT NOT NULL DEFAULT '',
    "scheduleNote" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingTutorialClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingStudent" (
    "id" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "homeClassCode" TEXT NOT NULL DEFAULT '',
    "majorName" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingEnrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "tutorialClassId" TEXT,
    "studentId" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL,
    "status" "TeachingEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "tutorialClassId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "heldOn" DATE,
    "topic" TEXT NOT NULL DEFAULT '',
    "method" "TeachingAttendanceMethod" NOT NULL DEFAULT 'ROLL_CALL',
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "attendanceTakenAt" TIMESTAMP(3),
    "attendanceTakenById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "TeachingAttendanceStatus" NOT NULL,
    "participationPoints" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeachingClass_courseCode_groupNo_term_key" ON "TeachingClass"("courseCode", "groupNo", "term");

-- CreateIndex
CREATE INDEX "TeachingClass_status_updatedAt_idx" ON "TeachingClass"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingTutorialClass_classId_code_key" ON "TeachingTutorialClass"("classId", "code");

-- CreateIndex
CREATE INDEX "TeachingTutorialClass_classId_displayOrder_idx" ON "TeachingTutorialClass"("classId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingStudent_studentCode_key" ON "TeachingStudent"("studentCode");

-- CreateIndex
CREATE INDEX "TeachingStudent_familyName_givenName_idx" ON "TeachingStudent"("familyName", "givenName");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingEnrollment_classId_studentId_key" ON "TeachingEnrollment"("classId", "studentId");

-- CreateIndex
CREATE INDEX "TeachingEnrollment_tutorialClassId_orderNo_idx" ON "TeachingEnrollment"("tutorialClassId", "orderNo");

-- CreateIndex
CREATE INDEX "TeachingEnrollment_classId_status_orderNo_idx" ON "TeachingEnrollment"("classId", "status", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingSession_tutorialClassId_weekNumber_key" ON "TeachingSession"("tutorialClassId", "weekNumber");

-- CreateIndex
CREATE INDEX "TeachingSession_classId_weekNumber_idx" ON "TeachingSession"("classId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingAttendance_sessionId_enrollmentId_key" ON "TeachingAttendance"("sessionId", "enrollmentId");

-- CreateIndex
CREATE INDEX "TeachingAttendance_enrollmentId_idx" ON "TeachingAttendance"("enrollmentId");

-- AddForeignKey
ALTER TABLE "TeachingTutorialClass" ADD CONSTRAINT "TeachingTutorialClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeachingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingEnrollment" ADD CONSTRAINT "TeachingEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeachingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingEnrollment" ADD CONSTRAINT "TeachingEnrollment_tutorialClassId_fkey" FOREIGN KEY ("tutorialClassId") REFERENCES "TeachingTutorialClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingEnrollment" ADD CONSTRAINT "TeachingEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "TeachingStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeachingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_tutorialClassId_fkey" FOREIGN KEY ("tutorialClassId") REFERENCES "TeachingTutorialClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingAttendance" ADD CONSTRAINT "TeachingAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingAttendance" ADD CONSTRAINT "TeachingAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TeachingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

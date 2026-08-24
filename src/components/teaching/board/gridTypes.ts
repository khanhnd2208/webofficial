import type { AttendanceStatus, CpResult } from '@/features/teaching/domain/cp';
import type {
	LearningExperienceChoice,
	TeachingAttendanceMark,
	TeachingParticipationMark,
} from '@/features/teaching/types';

export interface BoardGridStudent {
	enrollmentId: string;
	studentId?: string;
	orderNo: number;
	tutorialClassId: string | null;
	enrolledFromWeek: number;
	status?: string;
	giftCount?: number;
	studentCode: string;
	familyName: string;
	givenName: string;
	homeClassCode?: string;
	majorName?: string;
	dateOfBirth?: string | null;
	email?: string | null;
	note?: string;
	marks: Record<string, TeachingAttendanceMark | { status: AttendanceStatus; note?: string }>;
	participation: Record<string, TeachingParticipationMark>;
	cp: CpResult;
	learningExperience?: LearningExperienceChoice | null;
}

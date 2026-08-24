import {
	ATTENDANCE_MAX_POINTS,
	ABSENCE_DEDUCTION_POINTS,
	CP_MAX_POINTS,
	TOTAL_MAX_POINTS,
	type AttendanceStatus,
	type CpPolicy,
	type CpResult,
} from './domain/cp';
import type { TeachingClassSetupInput } from './schemas';

export type TeachingClassStatus = 'ACTIVE' | 'ARCHIVED';
export type TeachingEnrollmentStatus = 'ACTIVE' | 'WITHDRAWN';
export type TeachingAttendanceMethod = 'ROLL_CALL' | 'SHORT_TEST';
export type LearningExperienceChoice = 'CHALLENGE' | 'SUPPORT';

export interface TeachingClassRecord {
	id: string;
	courseCode: string;
	courseName: string;
	groupNo: string;
	classCode?: string;
	term: string;
	credits: number | null;
	lecturerName: string;
	lecturerCode: string;
	totalWeeks: number;
	absenceThresholdPercent: number;
	lateGraceMinutes: number;
	status: TeachingClassStatus;
	publicSlug: string | null;
	publicTitle: string;
	publicSummary: string;
	publicDescription: string;
	publicAnnouncement: string;
	attendanceVisible: boolean;
	classRules: string;
	createdAt: string;
	updatedAt: string;
}

export interface TeachingClassListItem extends TeachingClassRecord {
	studentCount: number;
	tutorialCount: number;
	sessionsTaken: number;
	sessionCount: number;
	averageAttendance: number | null;
	averageCp: number | null;
	averageTotal: number | null;
	atRiskCount: number;
	bannedCount: number;
}

export interface TeachingTutorialRecord {
	id: string;
	classId: string;
	code: string;
	name: string;
	room: string;
	scheduleNote: string;
	displayOrder: number;
	studentCount: number;
}

export interface TeachingSessionRecord {
	id: string;
	classId: string;
	tutorialClassId: string;
	weekNumber: number;
	heldOn: string | null;
	topic: string;
	method: TeachingAttendanceMethod;
	isCancelled: boolean;
	attendanceTakenAt: string | null;
	attendanceOpen: boolean;
	participationTakenAt: string | null;
	participationOpen: boolean;
}

export interface TeachingAttendanceMark {
	status: AttendanceStatus;
	note: string;
}

export interface TeachingParticipationMark {
	points: number;
	note: string;
}

export interface TeachingGradebookStudent {
	enrollmentId: string;
	studentId: string;
	orderNo: number;
	tutorialClassId: string | null;
	enrolledFromWeek: number;
	status: TeachingEnrollmentStatus;
	giftCount: number;
	studentCode: string;
	familyName: string;
	givenName: string;
	homeClassCode: string;
	majorName: string;
	dateOfBirth: string | null;
	email: string | null;
	note: string;
	marks: Record<string, TeachingAttendanceMark>;
	participation: Record<string, TeachingParticipationMark>;
	cp: CpResult;
}

export interface TeachingGradebook {
	class: TeachingClassRecord;
	policy: CpPolicy;
	tutorials: TeachingTutorialRecord[];
	sessions: TeachingSessionRecord[];
	students: TeachingGradebookStudent[];
	stats: {
		studentCount: number;
		sessionsTaken: number;
		averageAttendance: number | null;
		averageCp: number | null;
		averageTotal: number | null;
		atRiskCount: number;
		bannedCount: number;
	};
}

export interface TeachingAttendanceMutationResult {
	session: TeachingSessionRecord;
	students: TeachingGradebookStudent[];
	stats: TeachingGradebook['stats'];
}

export type TeachingParticipationMutationResult = TeachingAttendanceMutationResult;

export type TeachingGroupAuditAction =
	| 'CONFIGURE'
	| 'OPEN'
	| 'LOCK'
	| 'MOVE'
	| 'UNDO'
	| 'TRANSFER_LEADER'
	| 'RANDOMIZE'
	| 'CLEAR'
	| 'RENAME';

export interface TeachingGroupAssignmentRecord {
	enrollmentId: string;
	groupId: string;
	groupOrder: number;
	slotIndex: number;
	role: 'LEADER' | 'MEMBER';
	studentCode: string;
	familyName: string;
	givenName: string;
	learningExperience?: LearningExperienceChoice | null;
}

export interface TeachingGroupRecord {
	id: string;
	displayOrder: number;
	assignments: TeachingGroupAssignmentRecord[];
}

export interface TeachingGroupBoard {
	classId: string;
	groupCount: number;
	groupSize: number;
	isOpen: boolean;
	version: number;
	claimEpoch: number;
	configured: boolean;
	activeStudentCount: number;
	groups: TeachingGroupRecord[];
	unassigned: Array<
		Pick<
			TeachingGroupAssignmentRecord,
			'enrollmentId' | 'studentCode' | 'familyName' | 'givenName' | 'learningExperience'
		>
	>;
}

export interface PublicTeachingGroupBoard extends Omit<TeachingGroupBoard, 'classId'> {
	slug: string;
	classId?: string;
	viewerEnrollmentId?: string | null;
	undoAvailableCount?: number;
}

export interface TeachingClassSetupResult {
	gradebook: TeachingGradebook;
	createdStudentCount: number;
}

export type TeachingClassSetupDraft = TeachingClassSetupInput;

export interface TeachingRosterStudent {
	enrollmentId: string;
	studentId: string;
	orderNo: number;
	tutorialClassId: string | null;
	enrolledFromWeek: number;
	status: TeachingEnrollmentStatus;
	giftCount: number;
	studentCode: string;
	familyName: string;
	givenName: string;
	homeClassCode: string;
	majorName: string;
	dateOfBirth: string | null;
	email: string | null;
	note: string;
	learningExperience?: LearningExperienceChoice | null;
	learningExperienceChangeCount?: number;
	learningExperienceSelectedAt?: string | null;
}

export interface TeachingPublicLink {
	id: string;
	label: string;
	url: string;
	description: string;
	displayOrder: number;
}

export interface TeachingPublicPageConfig {
	class: TeachingClassRecord;
	links: TeachingPublicLink[];
}

export interface TeachingAttendanceBoardConfig {
	class: TeachingClassRecord;
	attendanceVisible: boolean;
	classRules: string;
	publicPath: string | null;
}

export interface PublicAttendanceBoardStudent {
	enrollmentId: string;
	orderNo: number;
	tutorialClassId: string | null;
	studentCode: string;
	familyName: string;
	givenName: string;
	/** Capability flag only; the birth date value is never exposed publicly. */
	hasDateOfBirth?: boolean;
	enrolledFromWeek: number;
	marks: Record<string, { status: AttendanceStatus; note?: string }>;
	participation: Record<string, TeachingParticipationMark>;
	cp: CpResult;
	learningExperience?: LearningExperienceChoice | null;
}

export interface LearningExperienceSession {
	authenticated: boolean;
	student?: {
		enrollmentId: string;
		studentCode: string;
		fullName: string;
	};
	choice?: LearningExperienceChoice | null;
	selectedAt?: string | null;
	changesRemaining?: number;
	locked?: boolean;
}

export interface TeachingGiftMutationResult {
	student: TeachingGradebookStudent;
	stats: TeachingGradebook['stats'];
}

export interface PublicClassBoard {
	slug: string;
	title: string;
	summary: string;
	description: string;
	announcement: string;
	courseCode: string;
	courseName: string;
	groupNo: string;
	classCode?: string;
	term: string;
	credits: number | null;
	lecturerName: string;
	rules: string;
	updatedAt: string;
	policy: CpPolicy;
	tutorials: TeachingTutorialRecord[];
	sessions: TeachingSessionRecord[];
	students: PublicAttendanceBoardStudent[];
	links: TeachingPublicLink[];
}

export type PublicAttendanceBoard = PublicClassBoard;

export function getCpPolicyText(policy: Pick<CpPolicy, 'absenceThresholdPercent'>): string[] {
	return [
		`Attendance tối đa ${ATTENDANCE_MAX_POINTS} điểm; mỗi buổi vắng không phép, đi muộn hoặc không có trạng thái khi buổi đã bắt đầu bị trừ ${ABSENCE_DEDUCTION_POINTS.toString().replace('.', ',')} điểm Attendance.`,
		`CP hoạt động tối đa ${CP_MAX_POINTS} điểm; mỗi tuần có thể chấm 0,5; 1 hoặc 2 điểm.`,
		`Tổng điểm học phần từ Attendance và CP, tối đa ${TOTAL_MAX_POINTS} điểm.`,
		`Vắng không phép vượt quá ${policy.absenceThresholdPercent}% tổng số buổi sẽ khiến sinh viên không đủ điều kiện thi.`,
		'Vắng có phép không bị trừ điểm Attendance.',
	];
}

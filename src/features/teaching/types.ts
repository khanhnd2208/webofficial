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
	attendanceMaxPoints: number;
	cpMaxPoints: number;
	absenceDeductionPoints: number;
	lateDeductionPoints: number;
	lateCountsTowardAbsenceThreshold: boolean;
	giftDeductionPoints: number;
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
	| 'RENAME'
	| 'ADD_BATCH'
	| 'REMOVE'
	| 'UPDATE_CAPACITY';

export interface TeachingGroupAssignmentRecord {
	enrollmentId: string;
	groupId: string;
	groupOrder: number;
	memberOrder: number;
	studentCode: string;
	familyName: string;
	givenName: string;
	learningExperience?: LearningExperienceChoice | null;
}

export interface TeachingGroupRecord {
	id: string;
	displayOrder: number;
	maxSize: number | null;
	effectiveMaxSize: number;
	assignments: TeachingGroupAssignmentRecord[];
}

export interface TeachingGroupBoard {
	classId: string;
	tutorialClassId: string;
	tutorialCode: string;
	tutorialName: string;
	groupCount: number;
	defaultGroupSize: number;
	version: number;
	configured: boolean;
	activeStudentCount: number;
	assignedCount: number;
	groups: TeachingGroupRecord[];
	unassigned: Array<
		Pick<
			TeachingGroupAssignmentRecord,
			'enrollmentId' | 'studentCode' | 'familyName' | 'givenName' | 'learningExperience'
		>
	>;
}

export interface PublicTeachingGroupBoard extends TeachingGroupBoard {
	slug: string;
}

export type GroupNumbersByTutorial = Record<string, Record<string, number>>;

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

export type TeachingClassNoteStatus = 'DRAFT' | 'PUBLISHED' | 'MODIFIED';

export interface TeachingClassNoteRecord {
	id: string;
	classId: string;
	draftTitle: string;
	draftHtml: string;
	publishedTitle: string | null;
	publishedHtml: string | null;
	displayOrder: number;
	publishedAt: string | null;
	updatedAt: string;
	status: TeachingClassNoteStatus;
}

export interface PublicClassNote {
	id: string;
	title: string;
	html: string;
	publishedAt: string;
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
	accessMode?: LearningExperienceAccessMode;
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

export type LearningExperienceAccessMode = 'OPEN' | 'DOB_PASSWORD';

export interface LearningExperienceStudentOption {
	enrollmentId: string;
	studentCode: string;
	fullName: string;
	accessMode: LearningExperienceAccessMode;
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
	notes?: PublicClassNote[];
}

export type PublicAttendanceBoard = PublicClassBoard;

export function getCpPolicyText(
	policy: Pick<
		CpPolicy,
		| 'absenceThresholdPercent'
		| 'attendanceMaxPoints'
		| 'cpMaxPoints'
		| 'absenceDeductionPoints'
		| 'lateDeductionPoints'
		| 'lateCountsTowardAbsenceThreshold'
		| 'giftDeductionPoints'
	>,
): string[] {
	const attendanceMax = policy.attendanceMaxPoints ?? ATTENDANCE_MAX_POINTS;
	const cpMax = policy.cpMaxPoints ?? CP_MAX_POINTS;
	const absenceDeduction = policy.absenceDeductionPoints ?? ABSENCE_DEDUCTION_POINTS;
	const lateDeduction = policy.lateDeductionPoints ?? ABSENCE_DEDUCTION_POINTS;
	const lateRule = policy.lateCountsTowardAbsenceThreshold ?? true;
	const giftDeduction = policy.giftDeductionPoints ?? 1;
	return [
		`Attendance tối đa ${attendanceMax} điểm; vắng không phép trừ ${absenceDeduction.toString().replace('.', ',')} điểm, đi muộn trừ ${lateDeduction.toString().replace('.', ',')} điểm.`,
		`CP hoạt động tối đa ${cpMax} điểm; mỗi tuần có thể chấm 0,5; 1 hoặc 2 điểm. Gift trừ ${giftDeduction.toString().replace('.', ',')} điểm CP.`,
		`Tổng điểm học phần từ Attendance và CP, tối đa ${TOTAL_MAX_POINTS} điểm.`,
		`${lateRule ? 'Đi muộn được tính vào' : 'Đi muộn không tính vào'} ngưỡng vắng ${policy.absenceThresholdPercent}% để xét điều kiện thi.`,
		`Vắng không phép vượt quá ${policy.absenceThresholdPercent}% tổng số buổi sẽ khiến sinh viên không đủ điều kiện thi.`,
		'Vắng có phép không bị trừ điểm Attendance.',
	];
}

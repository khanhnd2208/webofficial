export type AttendanceStatus =
	| 'PRESENT'
	| 'LATE'
	| 'ABSENT_UNEXCUSED'
	| 'ABSENT_EXCUSED'
	| 'MAKEUP';

export type RecordedAttendanceStatus = AttendanceStatus | null;

export type RiskLevel = 'OK' | 'AT_RISK' | 'BANNED';

export const ATTENDANCE_MAX_POINTS = 5;
export const CP_MAX_POINTS = 5;
export const TOTAL_MAX_POINTS = 10;
export const ABSENCE_DEDUCTION_POINTS = 0.5;

export const TEACHING_SCORE_RULES = Object.freeze({
	attendanceMax: ATTENDANCE_MAX_POINTS,
	cpMax: CP_MAX_POINTS,
	totalMax: TOTAL_MAX_POINTS,
	absenceDeduction: ABSENCE_DEDUCTION_POINTS,
});

export interface CpPolicy {
	totalWeeks: number;
	absenceThresholdPercent: number;
	attendanceMaxPoints?: number;
	cpMaxPoints?: number;
	absenceDeductionPoints?: number;
	lateDeductionPoints?: number;
	lateCountsTowardAbsenceThreshold?: boolean;
	giftDeductionPoints?: number;
}

export interface SessionCpInput {
	isCancelled: boolean;
	attendanceTakenAt: string | Date | null;
	attendanceOpen?: boolean;
	participationTakenAt?: string | Date | null;
	participationOpen?: boolean;
	status: RecordedAttendanceStatus;
}

export interface CpResult {
	takenSessions: number;
	unexcusedAbsences: number;
	excusedAbsences: number;
	lateCount: number;
	presentCount: number;
	makeupCount: number;
	participationTotal: number;
	giftDeduction: number;
	absenceDeduction: number;
	attendanceScore: number;
	banLimit: number;
	banned: boolean;
	examEligible: boolean;
	cp: number;
	totalScore: number;
	riskLevel: RiskLevel;
}

export const DEFAULT_CP_POLICY: CpPolicy = {
	totalWeeks: 10,
	absenceThresholdPercent: 20,
	attendanceMaxPoints: ATTENDANCE_MAX_POINTS,
	cpMaxPoints: CP_MAX_POINTS,
	absenceDeductionPoints: ABSENCE_DEDUCTION_POINTS,
	lateDeductionPoints: ABSENCE_DEDUCTION_POINTS,
	lateCountsTowardAbsenceThreshold: true,
	giftDeductionPoints: 1,
};

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function roundScore(value: number): number {
	return Math.round(value * 100) / 100;
}

export function formatTeachingScore(value: number): string {
	return new Intl.NumberFormat('vi-VN', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(value);
}

export function isAttendanceCounted(
	session: Pick<SessionCpInput, 'isCancelled' | 'attendanceTakenAt' | 'attendanceOpen'>,
): boolean {
	return !session.isCancelled && Boolean(session.attendanceTakenAt) && !session.attendanceOpen;
}

export function isParticipationCounted(
	session: Pick<SessionCpInput, 'isCancelled' | 'participationTakenAt' | 'participationOpen'>,
): boolean {
	return (
		!session.isCancelled && Boolean(session.participationTakenAt) && !session.participationOpen
	);
}

export function resolveSessionStatus(input: SessionCpInput): AttendanceStatus | null {
	if (input.isCancelled || !isAttendanceCounted(input)) return input.status;
	return input.status ?? 'ABSENT_UNEXCUSED';
}

export function sessionsForEnrollment<T extends { weekNumber: number }>(
	sessions: T[],
	enrolledFromWeek: number,
): T[] {
	return sessions.filter((session) => session.weekNumber >= enrolledFromWeek);
}

export function defaultEnrolledFromWeek(
	sessions: Array<{
		weekNumber: number;
		attendanceTakenAt: string | Date | null;
		isCancelled: boolean;
	}>,
	totalWeeks: number,
): number {
	if (sessions.length === 0) return 1;
	const firstOpen = [...sessions]
		.filter((session) => !session.isCancelled)
		.sort((a, b) => a.weekNumber - b.weekNumber)
		.find((session) => !session.attendanceTakenAt);
	return firstOpen?.weekNumber ?? totalWeeks + 1;
}

export function countsAsUnexcusedAbsence(status: AttendanceStatus | null): boolean {
	return status === 'LATE' || status === 'ABSENT_UNEXCUSED';
}

export function banLimitFor(
	policy: Pick<CpPolicy, 'totalWeeks' | 'absenceThresholdPercent'>,
): number {
	return (policy.totalWeeks * policy.absenceThresholdPercent) / 100;
}

export function computeCp(
	policy: CpPolicy,
	sessions: SessionCpInput[],
	participationPoints: number[] = [],
	giftCount = 0,
): CpResult {
	const attendanceMaxPoints = policy.attendanceMaxPoints ?? ATTENDANCE_MAX_POINTS;
	const cpMaxPoints = policy.cpMaxPoints ?? CP_MAX_POINTS;
	const absenceDeductionPoints = policy.absenceDeductionPoints ?? ABSENCE_DEDUCTION_POINTS;
	const lateDeductionPoints = policy.lateDeductionPoints ?? ABSENCE_DEDUCTION_POINTS;
	const lateCountsTowardAbsenceThreshold = policy.lateCountsTowardAbsenceThreshold ?? true;
	const giftDeductionPoints = policy.giftDeductionPoints ?? 1;
	const taken = sessions.filter(isAttendanceCounted);
	let unexcusedAbsences = 0;
	let excusedAbsences = 0;
	let lateCount = 0;
	let presentCount = 0;
	let makeupCount = 0;
	let attendanceDeduction = 0;

	for (const session of taken) {
		const status = resolveSessionStatus(session);
		if (status === 'PRESENT') presentCount += 1;
		else if (status === 'MAKEUP') makeupCount += 1;
		else if (status === 'ABSENT_EXCUSED') excusedAbsences += 1;
		else if (status === 'LATE') {
			lateCount += 1;
			attendanceDeduction += lateDeductionPoints;
			if (lateCountsTowardAbsenceThreshold) unexcusedAbsences += 1;
		} else if (status === 'ABSENT_UNEXCUSED') {
			unexcusedAbsences += 1;
			attendanceDeduction += absenceDeductionPoints;
		}
	}

	const banLimit = banLimitFor(policy);
	const banned = unexcusedAbsences > banLimit;
	const participationTotal = roundScore(
		participationPoints.reduce((sum, points) => sum + points, 0),
	);
	const giftDeduction = roundScore(Math.max(0, Math.trunc(giftCount)) * giftDeductionPoints);
	const absenceDeduction = roundScore(attendanceDeduction);
	const attendanceScore = roundScore(
		clamp(attendanceMaxPoints - absenceDeduction, 0, attendanceMaxPoints),
	);
	const cappedParticipation = clamp(participationTotal, 0, cpMaxPoints);
	const cp = roundScore(clamp(cappedParticipation - giftDeduction, 0, cpMaxPoints));
	const totalScore = roundScore(clamp(attendanceScore + cp, 0, attendanceMaxPoints + cpMaxPoints));
	const riskLevel: RiskLevel = banned
		? 'BANNED'
		: unexcusedAbsences + 1 > banLimit && banLimit > 0
			? 'AT_RISK'
			: 'OK';

	return {
		takenSessions: taken.length,
		unexcusedAbsences,
		excusedAbsences,
		lateCount,
		presentCount,
		makeupCount,
		participationTotal: roundScore(participationTotal),
		giftDeduction,
		absenceDeduction,
		attendanceScore,
		banLimit,
		banned,
		examEligible: !banned,
		cp,
		totalScore,
		riskLevel,
	};
}

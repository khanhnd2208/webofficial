import { formatTeachingScore } from '@/features/teaching/domain/cp';

export function studentIdentityKey(slug: string) {
	return `teaching-public-me:${slug}`;
}

function browserStorage() {
	return globalThis.localStorage;
}

export function readStudentIdentity(slug: string): string | null {
	try {
		return browserStorage().getItem(studentIdentityKey(slug));
	} catch {
		return null;
	}
}

export function writeStudentIdentity(slug: string, enrollmentId: string | null) {
	try {
		const key = studentIdentityKey(slug);
		if (!enrollmentId) browserStorage().removeItem(key);
		else browserStorage().setItem(key, enrollmentId);
	} catch {
		// Private mode and blocked storage must leave the public board usable.
	}
}

export function pinStudent<T extends { enrollmentId: string }>(
	rows: T[],
	enrollmentId: string | null,
): T[] {
	if (!enrollmentId) return rows;
	const index = rows.findIndex((row) => row.enrollmentId === enrollmentId);
	if (index <= 0) return rows;
	return [rows[index], ...rows.slice(0, index), ...rows.slice(index + 1)];
}

export function studentIdentitySummary(
	student: {
		cp: { unexcusedAbsences: number; attendanceScore: number; riskLevel: string };
	},
	totalWeeks: number,
	attendanceMax: number,
) {
	const eligibility =
		student.cp.riskLevel === 'BANNED'
			? 'Cấm thi'
			: student.cp.riskLevel === 'AT_RISK'
				? 'Có nguy cơ'
				: 'Đủ điều kiện';
	return `Bạn: vắng ${student.cp.unexcusedAbsences}/${totalWeeks} · Chuyên cần ${formatTeachingScore(student.cp.attendanceScore)}/${attendanceMax} · ${eligibility}`;
}

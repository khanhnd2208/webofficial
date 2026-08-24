import type { McIconName } from '@/components/myclass/ui';
import type { AttendanceStatus } from '@/features/teaching/domain/cp';
import type { TeachingSessionRecord } from '@/features/teaching/types';

export const STATUS_OPTIONS: Array<{
	status: AttendanceStatus;
	label: string;
	key: string;
	hint: string;
}> = [
	{ status: 'PRESENT', label: 'Có mặt', key: 'P', hint: 'Đúng giờ' },
	{ status: 'LATE', label: 'Muộn', key: 'L', hint: 'Tính là vắng không phép' },
	{ status: 'ABSENT_UNEXCUSED', label: 'Vắng', key: 'A', hint: 'Không phép' },
	{ status: 'ABSENT_EXCUSED', label: 'Vắng có phép', key: 'E', hint: 'Không tính vào vắng không phép' },
	{ status: 'MAKEUP', label: 'Học bù', key: 'M', hint: 'Tính như có mặt' },
];

export const STATUS_ICON: Record<AttendanceStatus, McIconName> = {
	PRESENT: 'check',
	LATE: 'schedule',
	ABSENT_UNEXCUSED: 'close',
	ABSENT_EXCUSED: 'info',
	MAKEUP: 'event_repeat',
};

export const STATUS_GLYPH: Record<AttendanceStatus, string> = {
	PRESENT: '✓',
	LATE: 'L',
	ABSENT_UNEXCUSED: '—',
	ABSENT_EXCUSED: 'E',
	MAKEUP: 'M',
};

export function formatDob(iso: string | null): string {
	if (!iso) return '';
	const [year, month, day] = iso.split('-');
	if (!year || !month || !day) return iso;
	return `${day}/${month}/${year}`;
}

export function sessionDateLabel(heldOn: string | null, emptyLabel = '—'): string {
	if (!heldOn) return emptyLabel;
	const [year, month, day] = heldOn.split('-');
	if (!year || !month || !day) return heldOn;
	return `${day}/${month}/${year.slice(-2)}`;
}

export function studentInitials(familyName: string, givenName: string): string {
	const family = familyName.trim().charAt(0);
	const given = givenName.trim().charAt(0);
	return `${family}${given}`.toUpperCase() || '?';
}

export function weekColumns(sessions: TeachingSessionRecord[], totalWeeks: number) {
	return Array.from({ length: totalWeeks }, (_, index) => {
		const weekNumber = index + 1;
		return {
			weekNumber,
			session: sessions.find((session) => session.weekNumber === weekNumber) ?? null,
		};
	});
}

export function currentWeekNumber(sessions: TeachingSessionRecord[]): number | null {
	const open = sessions.find((session) => !session.isCancelled && session.attendanceOpen);
	if (open) return open.weekNumber;
	const next = sessions.find(
		(session) => !session.isCancelled && !session.attendanceTakenAt && !session.attendanceOpen,
	);
	if (next) return next.weekNumber;
	const lastTaken = [...sessions]
		.reverse()
		.find((session) => !session.isCancelled && session.attendanceTakenAt && !session.attendanceOpen);
	return lastTaken?.weekNumber ?? null;
}

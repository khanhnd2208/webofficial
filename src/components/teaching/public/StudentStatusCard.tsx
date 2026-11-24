'use client';

import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	TOTAL_MAX_POINTS,
	formatTeachingScore,
	type AttendanceStatus,
} from '@/features/teaching/domain/cp';
import type {
	PublicAttendanceBoardStudent,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { STATUS_GLYPH, STATUS_OPTIONS, weekColumns } from '../admin/attendanceLabels';
import { studentEligibility } from './studentIdentity';
import { getPublicSummaryLockStatus } from './StudentSummaryPanel';

const STATUS_LABELS = Object.fromEntries(
	STATUS_OPTIONS.map((option) => [option.status, option.label]),
) as Record<AttendanceStatus, string>;

function statusToneClass(status?: AttendanceStatus): string {
	switch (status) {
		case 'PRESENT':
		case 'MAKEUP':
			return 'border-success/30 bg-success-subtle text-success';
		case 'LATE':
			return 'border-warning/30 bg-warning-subtle text-warning';
		case 'ABSENT_UNEXCUSED':
			return 'border-error/30 bg-error-subtle text-error';
		case 'ABSENT_EXCUSED':
			return 'border-accent/30 bg-accent-subtle text-accent';
		default:
			return 'border-mc-rule bg-surface-sunken text-ink-tertiary';
	}
}

function eligibilityToneClass(riskLevel: string): string {
	if (riskLevel === 'BANNED') return 'bg-error-subtle text-error';
	if (riskLevel === 'AT_RISK') return 'bg-warning-subtle text-warning';
	return 'bg-success-subtle text-success';
}

export function StudentStatusCard({
	student,
	sessions,
	totalWeeks,
	attendanceMaxPoints = ATTENDANCE_MAX_POINTS,
	cpMaxPoints = CP_MAX_POINTS,
	onOpenGradebook,
}: {
	student: PublicAttendanceBoardStudent;
	sessions: TeachingSessionRecord[];
	totalWeeks: number;
	attendanceMaxPoints?: number;
	cpMaxPoints?: number;
	onOpenGradebook: () => void;
}) {
	const studentSessions = student.tutorialClassId
		? sessions.filter((session) => session.tutorialClassId === student.tutorialClassId)
		: sessions;
	const effectiveSessions = studentSessions.length > 0 ? studentSessions : sessions;
	const weeks = weekColumns(effectiveSessions, totalWeeks);
	const summaryLock = getPublicSummaryLockStatus(effectiveSessions, totalWeeks);
	const lockedWeeks = Math.min(summaryLock.lockedAttendanceWeeks, summaryLock.lockedCpWeeks);
	const eligibility = studentEligibility(student.cp.riskLevel);

	return (
		<section className="mc-surface p-4 sm:p-5" aria-label="Tình trạng học tập của bạn">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-xs font-semibold text-ink-secondary">Tình trạng học tập</span>
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${eligibilityToneClass(student.cp.riskLevel)}`}
				>
					{eligibility}
				</span>
			</div>

			<div
				className={`mt-4 grid gap-3 ${summaryLock.unlocked ? 'grid-cols-3' : 'grid-cols-2'}`}
			>
				<div className="rounded-[var(--mc-r-sm)] border border-mc-rule bg-surface-sunken px-3 py-3">
					<p className="text-xs text-ink-secondary">Chuyên cần</p>
					<p className="mc-num mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
						{formatTeachingScore(student.cp.attendanceScore)}
						<span className="text-sm font-normal text-ink-secondary">/{attendanceMaxPoints}</span>
					</p>
				</div>
				<div className="rounded-[var(--mc-r-sm)] border border-mc-rule bg-surface-sunken px-3 py-3">
					<p className="text-xs text-ink-secondary">Điểm CP</p>
					<p className="mc-num mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
						{formatTeachingScore(student.cp.cp)}
						<span className="text-sm font-normal text-ink-secondary">/{cpMaxPoints}</span>
					</p>
				</div>
				{summaryLock.unlocked ? (
					<div className="rounded-[var(--mc-r-sm)] border border-accent/30 bg-accent-subtle px-3 py-3">
						<p className="text-xs text-accent">Tổng kết</p>
						<p className="mc-num mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
							{formatTeachingScore(student.cp.totalScore)}
							<span className="text-sm font-normal text-ink-secondary">/{TOTAL_MAX_POINTS}</span>
						</p>
					</div>
				) : null}
			</div>

			<p className="mc-num mt-3 text-sm text-ink-secondary">
				Vắng <strong className="font-semibold text-ink">{student.cp.unexcusedAbsences}</strong>/
				{totalWeeks} buổi
				{student.cp.excusedAbsences > 0 ? ` · Có phép ${student.cp.excusedAbsences}` : ''}
			</p>

			{weeks.length > 0 ? (
				<div className="mt-4" aria-label="Điểm danh theo tuần">
					<ul className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
						{weeks.map(({ weekNumber, session }) => {
							const mark = session ? student.marks[session.id] : undefined;
							const cancelled = Boolean(session?.isCancelled);
							const status = cancelled ? undefined : mark?.status;
							const glyph = cancelled ? '—' : status ? STATUS_GLYPH[status] : '·';
							const label = cancelled
								? `Tuần ${weekNumber}: Nghỉ`
								: status
									? `Tuần ${weekNumber}: ${STATUS_LABELS[status]}${mark?.note ? ` - ${mark.note}` : ''}`
									: `Tuần ${weekNumber}: Chưa điểm danh`;

							return (
								<li
									key={weekNumber}
									title={label}
									aria-label={label}
									data-week={weekNumber}
									data-status={status ?? (cancelled ? 'CANCELLED' : 'EMPTY')}
									className={`flex flex-col items-center justify-center rounded-[var(--mc-r-sm)] border py-1.5 text-center ${statusToneClass(status)}`}
								>
									<span className="mc-num text-xs leading-tight opacity-80">W{weekNumber}</span>
									<span className="mt-0.5 text-xs font-semibold leading-tight" aria-hidden="true">
										{glyph}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			) : null}

			<div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-mc-rule pt-3">
				{!summaryLock.unlocked ? (
					<p className="mc-num text-xs text-ink-secondary">
						Tổng kết mở khi khoá đủ {summaryLock.totalWeeks} tuần (đã khoá {lockedWeeks}/
						{summaryLock.totalWeeks})
					</p>
				) : (
					<p className="mc-num text-xs text-ink-secondary">
						Đã khoá đủ {summaryLock.totalWeeks}/{summaryLock.totalWeeks} tuần
					</p>
				)}
				<button
					type="button"
					onClick={onOpenGradebook}
					className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
				>
					Xem bảng cả lớp →
				</button>
			</div>
		</section>
	);
}

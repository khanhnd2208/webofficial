'use client';

import type { CSSProperties } from 'react';

import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	TOTAL_MAX_POINTS,
	formatTeachingScore,
} from '@/features/teaching/domain/cp';
import type {
	PublicAttendanceBoardStudent,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { AttendanceGlyph } from './ClassRoster';
import { rosterCells, rosterWeeks } from './classRosterModel';
import { studentEligibility } from './studentIdentity';
import { getPublicSummaryLockStatus } from './StudentSummaryPanel';

function Stat({ label, value, max }: { label: string; value: number; max: number }) {
	return (
		<div className="status-stat">
			<dt>{label}</dt>
			<dd className="mc-num">
				<strong>{formatTeachingScore(value)}</strong>
				<span>/{max}</span>
			</dd>
		</div>
	);
}

/** The student's own standing: scores, one mark per week, and what is still open. */
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
	const weeks = rosterWeeks(effectiveSessions, totalWeeks);
	const cells = rosterCells(student, weeks, 'attendance');
	const summaryLock = getPublicSummaryLockStatus(effectiveSessions, totalWeeks);
	const lockedWeeks = Math.min(summaryLock.lockedAttendanceWeeks, summaryLock.lockedCpWeeks);

	return (
		<section className="teaching-public-section" aria-label="Tình trạng học tập của bạn">
			<div className="teaching-public-section-head">
				<h3>Tình trạng học tập</h3>
				<span className="status-eligibility" data-risk={student.cp.riskLevel}>
					{studentEligibility(student.cp.riskLevel)}
				</span>
			</div>

			<dl className="status-stats">
				<Stat label="Chuyên cần" value={student.cp.attendanceScore} max={attendanceMaxPoints} />
				<Stat label="Điểm CP" value={student.cp.cp} max={cpMaxPoints} />
				{summaryLock.unlocked ? (
					<Stat label="Tổng kết" value={student.cp.totalScore} max={TOTAL_MAX_POINTS} />
				) : null}
			</dl>

			{cells.length > 0 ? (
				<ul
					className="status-weeks"
					aria-label="Điểm danh theo tuần"
					style={{ '--roster-weeks': cells.length } as CSSProperties}
				>
					{cells.map((cell) => (
						<li
							key={cell.weekNumber}
							aria-label={cell.label}
							title={cell.label}
							data-week={cell.weekNumber}
							data-status={
								cell.status ??
								(cell.kind === 'cancelled' ? 'CANCELLED' : cell.kind === 'pending' ? 'EMPTY' : '')
							}
						>
							<span className="roster-cell" data-kind={cell.kind} aria-hidden="true">
								{cell.status ? <AttendanceGlyph status={cell.status} /> : null}
							</span>
							<span className="status-week-num mc-num" aria-hidden="true">
								{cell.weekNumber}
							</span>
						</li>
					))}
				</ul>
			) : null}

			<p className="status-absences mc-num">
				Vắng <strong>{student.cp.unexcusedAbsences}</strong>/{totalWeeks} buổi
				{student.cp.excusedAbsences > 0 ? ` · Có phép ${student.cp.excusedAbsences}` : ''}
			</p>
			<p className="status-lock mc-num">
				{summaryLock.unlocked
					? `Đã khoá đủ ${summaryLock.totalWeeks}/${summaryLock.totalWeeks} tuần`
					: `Tổng kết mở khi khoá đủ ${summaryLock.totalWeeks} tuần (đã khoá ${lockedWeeks}/${summaryLock.totalWeeks})`}
			</p>

			<button type="button" onClick={onOpenGradebook} className="teaching-public-link">
				Xem bảng cả lớp →
			</button>
		</section>
	);
}

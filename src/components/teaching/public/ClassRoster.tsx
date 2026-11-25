'use client';

import { useMemo, useState, type CSSProperties } from 'react';

import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	TOTAL_MAX_POINTS,
	formatTeachingScore,
	type AttendanceStatus,
} from '@/features/teaching/domain/cp';
import { formatStudentCode } from '@/features/teaching/domain/privacy';
import type { TeachingSessionRecord } from '@/features/teaching/types';

import type { BoardGridStudent } from '../board/gridTypes';
import {
	pointsGlyph,
	rosterCells,
	rosterWeeks,
	type RosterCell,
	type RosterView,
} from './classRosterModel';

export type ClassRosterView = RosterView | 'summary';

/** Shape-coded marks, so status never depends on colour alone. */
export function AttendanceGlyph({ status }: { status: AttendanceStatus }) {
	return (
		<svg viewBox="0 0 16 16" className="roster-glyph" data-status={status} aria-hidden="true">
			{status === 'PRESENT' ? <circle cx="8" cy="8" r="4.5" fill="currentColor" /> : null}
			{status === 'LATE' ? <path d="M8 2.75 13.25 8 8 13.25 2.75 8Z" fill="currentColor" /> : null}
			{status === 'ABSENT_UNEXCUSED' ? (
				<path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			) : null}
			{status === 'ABSENT_EXCUSED' ? (
				<circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
			) : null}
			{status === 'MAKEUP' ? (
				<>
					<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
					<circle cx="8" cy="8" r="2" fill="currentColor" />
				</>
			) : null}
		</svg>
	);
}

function StripCell({ cell }: { cell: RosterCell }) {
	return (
		<span
			role="img"
			aria-label={cell.label}
			title={cell.label}
			className="roster-cell"
			data-kind={cell.kind}
			data-points={cell.kind === 'points' ? cell.points : undefined}
			data-note={cell.note ? 'true' : undefined}
		>
			{cell.kind === 'status' && cell.status ? <AttendanceGlyph status={cell.status} /> : null}
			{cell.kind === 'points' ? pointsGlyph(cell.points ?? 0) : null}
		</span>
	);
}

function riskText(riskLevel: string): string | null {
	if (riskLevel === 'BANNED') return 'Cấm thi';
	if (riskLevel === 'AT_RISK') return 'Có nguy cơ';
	return null;
}

function Score({ value, max }: { value: number; max: number }) {
	return (
		<span className="roster-score mc-num">
			<strong>{formatTeachingScore(value)}</strong>
			<span>/{max}</span>
		</span>
	);
}

/**
 * The public class list. One row per student: name, a strip with one mark per week,
 * and the running score. The strip keeps a fixed width however many weeks the course
 * has, so a 15-week term reads as easily as week 2. Tapping a row lists every week
 * with its date and the teacher's note.
 */
export function ClassRoster({
	students,
	sessions,
	totalWeeks,
	view,
	meId,
	attendanceMaxPoints = ATTENDANCE_MAX_POINTS,
	cpMaxPoints = CP_MAX_POINTS,
}: {
	students: BoardGridStudent[];
	sessions: TeachingSessionRecord[];
	totalWeeks: number;
	view: ClassRosterView;
	meId: string | null;
	attendanceMaxPoints?: number;
	cpMaxPoints?: number;
}) {
	const [openId, setOpenId] = useState<string | null>(null);
	const weeks = useMemo(() => rosterWeeks(sessions, totalWeeks), [sessions, totalWeeks]);
	const label =
		view === 'attendance'
			? 'Bảng điểm danh'
			: view === 'cp'
				? 'Bảng điểm CP'
				: 'Bảng điểm tổng kết';

	if (view === 'summary') {
		return (
			<div role="table" aria-label={label} className="roster" data-view="summary" data-testid="summary-grid">
				<div role="rowgroup" className="roster-head-group">
					<div role="row" className="roster-row roster-head">
						<span role="columnheader" className="roster-name">
							Sinh viên
						</span>
						<span role="columnheader" className="roster-num">
							Vắng
						</span>
						<span role="columnheader" className="roster-num">
							Gift
						</span>
						<span role="columnheader" className="roster-num">
							Chuyên cần
						</span>
						<span role="columnheader" className="roster-num">
							CP
						</span>
						<span role="columnheader" className="roster-num roster-total">
							Tổng
						</span>
					</div>
				</div>
				<div role="rowgroup">
					{students.map((student) => {
						const isMe = student.enrollmentId === meId;
						return (
							<div
								key={student.enrollmentId}
								role="row"
								className="roster-row"
								data-me={isMe ? 'true' : undefined}
							>
								<span role="rowheader" className="roster-name">
									<span className="roster-name-text">
										{student.familyName} {student.givenName}
									</span>
									{isMe ? <span className="roster-me">Bạn</span> : null}
									<span className="roster-code mc-num">{formatStudentCode(student.studentCode)}</span>
								</span>
								<span role="cell" className="roster-num mc-num" data-label="Vắng">
									{student.cp.unexcusedAbsences}
								</span>
								<span role="cell" className="roster-num mc-num" data-label="Gift">
									−{formatTeachingScore(student.cp.giftDeduction)}
								</span>
								<span role="cell" className="roster-num mc-num" data-label="Chuyên cần">
									{formatTeachingScore(student.cp.attendanceScore)}
								</span>
								<span role="cell" className="roster-num mc-num" data-label="CP">
									{formatTeachingScore(student.cp.cp)}
								</span>
								<span role="cell" className="roster-num roster-total">
									<Score value={student.cp.totalScore} max={TOTAL_MAX_POINTS} />
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<div
			role="table"
			aria-label={label}
			className="roster"
			data-view={view}
			data-testid={view === 'attendance' ? 'attendance-grid' : 'participation-grid'}
			style={{ '--roster-weeks': weeks.length } as CSSProperties}
		>
			<div role="rowgroup" className="roster-head-group">
				<div role="row" className="roster-row roster-head">
					<span role="columnheader" className="roster-name">
						Sinh viên
					</span>
					<span role="columnheader" className="roster-strip" aria-label="Các tuần">
						{weeks.map(({ weekNumber }) => (
							<span key={weekNumber} className="roster-week mc-num" data-week={weekNumber}>
								{weekNumber}
							</span>
						))}
					</span>
					<span role="columnheader" className="roster-stat">
						{view === 'attendance' ? 'Chuyên cần' : 'Điểm CP'}
					</span>
				</div>
			</div>
			<div role="rowgroup">
				{students.map((student) => {
					const isMe = student.enrollmentId === meId;
					const open = openId === student.enrollmentId;
					const cells = rosterCells(student, weeks, view);
					const detailId = `roster-detail-${student.enrollmentId}`;
					const risk = riskText(student.cp.riskLevel);
					const recorded = cells.filter(
						(cell) => cell.kind !== 'none' && cell.kind !== 'pending',
					);
					return (
						<div
							key={student.enrollmentId}
							role="row"
							className="roster-row"
							data-me={isMe ? 'true' : undefined}
							data-open={open ? 'true' : undefined}
						>
							<span role="rowheader" className="roster-name">
								<button
									type="button"
									className="roster-toggle"
									aria-expanded={open}
									aria-controls={detailId}
									onClick={() => setOpenId(open ? null : student.enrollmentId)}
								>
									<span className="roster-name-text">
										{student.familyName} {student.givenName}
									</span>
								</button>
								{isMe ? <span className="roster-me">Bạn</span> : null}
								<span className="roster-code mc-num">{formatStudentCode(student.studentCode)}</span>
							</span>
							<span role="cell" className="roster-strip">
								{cells.map((cell) => (
									<StripCell key={cell.weekNumber} cell={cell} />
								))}
							</span>
							<span role="cell" className="roster-stat">
								{view === 'attendance' ? (
									<>
										<Score value={student.cp.attendanceScore} max={attendanceMaxPoints} />
										<span className="roster-sub mc-num" data-risk={risk ? 'true' : undefined}>
											{risk ?? `Vắng ${student.cp.unexcusedAbsences}`}
										</span>
									</>
								) : (
									<>
										<Score value={student.cp.cp} max={cpMaxPoints} />
										{student.cp.giftDeduction > 0 ? (
											<span className="roster-sub mc-num">
												Gift −{formatTeachingScore(student.cp.giftDeduction)}
											</span>
										) : null}
									</>
								)}
							</span>
							{open ? (
								<div role="cell" id={detailId} className="roster-detail">
									{recorded.length === 0 ? (
										<p className="text-sm text-ink-secondary">Chưa có tuần nào được ghi.</p>
									) : null}
									<ol>
										{recorded.map((cell) => (
												<li key={cell.weekNumber}>
													<span className="roster-detail-week mc-num">
														Tuần {cell.weekNumber}
														{cell.date ? <small>{cell.date}</small> : null}
													</span>
													<span className="roster-detail-value">
														{cell.kind === 'status' && cell.status ? (
															<AttendanceGlyph status={cell.status} />
														) : null}
														{cell.label.replace(/^Tuần \d+: /, '')}
														{!cell.final && (cell.kind === 'status' || cell.kind === 'points') ? (
															<small> · chưa chốt</small>
														) : null}
													</span>
												</li>
											))}
									</ol>
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { createPortal } from 'react-dom';
import { GridWeekActions } from './GridWeekActions';
import { McIcon } from '@/components/myclass/ui';
import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	TOTAL_MAX_POINTS,
	formatTeachingScore,
} from '@/features/teaching/domain/cp';
import type { SessionLifecycleAction } from '@/features/teaching/schemas';
import type { TeachingSessionRecord } from '@/features/teaching/types';
import type { BoardGridStudent } from '../board/gridTypes';
import type { GradebookSaveState } from './useGradebookMutations';

import { useGridNotePopover } from './useGridNotePopover';
import {
	currentWeekNumber,
	formatDob,
	sessionDateLabel,
	studentInitials,
	weekColumns,
} from './attendanceLabels';
import { scrollGridWeekIntoView, syncGridScrollState, type GridScrollMode } from './gridScroll';

export interface ParticipationGridProps {
	students: BoardGridStudent[];
	sessions: TeachingSessionRecord[];
	totalWeeks: number;
	attendanceMaxPoints?: number;
	cpMaxPoints?: number;
	selectedWeek?: number | null;
	showExtraColumns?: boolean;
	readOnly?: boolean;
	publicCompact?: boolean;
	scrollMode?: GridScrollMode;
	onParticipationChange?: (payload: {
		enrollmentId: string;
		sessionId: string;
		points: 0 | 0.5 | 1 | 2;
		note: string;
	}) => void;
	onGiftChange?: (enrollmentId: string, delta: 1 | -1) => void;
	onSessionToggle?: (sessionId: string, open: boolean) => void;
	onSessionLifecycle?: (sessionId: string, action: SessionLifecycleAction) => void;
	togglingSessionId?: string | null;
	saveState?: (enrollmentId: string, sessionId: string) => GradebookSaveState | undefined;
	onRetry?: (enrollmentId: string, sessionId: string) => void;
	onWeekSelect?: (weekNumber: number) => void;
}

function nextPoints(points: number | undefined): 0 | 0.5 | 1 | 2 {
	if (points === 0.5) return 1;
	if (points === 1) return 2;
	if (points === 2) return 0;
	return 0.5;
}

function pointsLabel(points: number | undefined) {
	return points == null ? '0' : points.toFixed(1).replace('.0', '');
}

function participationTooltip(
	points: number | undefined,
	note: string | undefined,
	started: boolean,
) {
	if (!started) return 'Chưa chấm CP';
	const score = pointsLabel(points);
	return note?.trim() ? `${score} điểm CP - ${note.trim()}` : `${score} điểm CP`;
}

function ParticipationNoteEditor({
	initialNote,
	initialPoints,
	onClose,
	onSave,
	onPoints,
	readOnly = false,
}: {
	initialNote: string;
	initialPoints?: number;
	onClose: () => void;
	onSave: (note: string) => void;
	onPoints?: (points: 0 | 0.5 | 1 | 2) => void;
	readOnly?: boolean;
}) {
	const [note, setNote] = useState(initialNote);
	const { rootRef, textareaRef } = useGridNotePopover(onClose);
	return createPortal(
		<div className="mc mc-studio">
			<div
				ref={rootRef}
				role="dialog"
				aria-label="Ghi chú điểm CP"
				className="mc-grid-note-panel w-64 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-3 text-left shadow-[var(--mc-shadow-2)]"
			>
				<p className="text-xs font-semibold text-ink">Ghi chú điểm CP tuần này</p>
				{readOnly ? (
					<p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">
						{note || 'Không có ghi chú.'}
					</p>
				) : (
					<textarea
						ref={textareaRef}
						value={note}
						onChange={(event) => setNote(event.target.value)}
						placeholder="Nhập ghi chú CP…"
						maxLength={240}
						rows={3}
						className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper p-2 text-sm"
					/>
				)}
				{!readOnly && onPoints ? (
					<div className="mt-2 grid grid-cols-4 gap-1">
						{([0, 0.5, 1, 2] as const).map((points) => (
							<button
								key={points}
								type="button"
								className={`min-h-8 rounded-[var(--mc-r-xs)] border px-1 text-xs font-semibold ${initialPoints === points ? 'border-accent bg-accent-subtle' : 'border-mc-rule'}`}
								onClick={() => onPoints(points)}
							>
								{points}
							</button>
						))}
					</div>
				) : null}
				<div className="mt-3 flex justify-end gap-2">
					<button
						type="button"
						className="min-h-8 px-2 text-xs font-semibold text-ink-secondary"
						onClick={onClose}
					>
						{readOnly ? 'Đóng' : 'Huỷ'}
					</button>
					{!readOnly ? (
						<button
							type="button"
							className="min-h-8 rounded-[var(--mc-r-sm)] bg-ink px-3 text-xs font-semibold text-paper"
							onClick={() => onSave(note)}
						>
							Lưu ghi chú
						</button>
					) : null}
				</div>
			</div>
		</div>,
		document.body,
	);
}

export function ParticipationGrid({
	students,
	sessions,
	totalWeeks,
	attendanceMaxPoints = ATTENDANCE_MAX_POINTS,
	cpMaxPoints = CP_MAX_POINTS,
	selectedWeek = null,
	showExtraColumns = false,
	readOnly = false,
	publicCompact = false,
	scrollMode = 'contained',
	onParticipationChange,
	onGiftChange,
	onSessionToggle,
	onSessionLifecycle,
	togglingSessionId = null,
	saveState,
	onRetry,
	onWeekSelect,
}: ParticipationGridProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const cycleValues = useRef(new Map<string, 0 | 0.5 | 1 | 2>());
	const [noteCell, setNoteCell] = useState<{ enrollmentId: string; sessionId: string } | null>(
		null,
	);
	const weeks = useMemo(() => weekColumns(sessions, totalWeeks), [sessions, totalWeeks]);
	const currentWeek = useMemo(() => currentWeekNumber(sessions), [sessions]);

	useEffect(() => {
		if (!selectedWeek) return;
		scrollGridWeekIntoView(wrapperRef.current, selectedWeek);
	}, [selectedWeek]);
	useEffect(() => {
		if (!publicCompact || selectedWeek || !currentWeek) return;
		scrollGridWeekIntoView(wrapperRef.current, currentWeek);
	}, [currentWeek, publicCompact, selectedWeek]);

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		const update = () => syncGridScrollState(wrapper);
		let resizeFrame = 0;
		const resize = () => {
			window.cancelAnimationFrame(resizeFrame);
			resizeFrame = window.requestAnimationFrame(() => {
				update();
				const week = selectedWeek ?? (publicCompact ? currentWeek : null);
				if (week) scrollGridWeekIntoView(wrapper, week, 'instant');
			});
		};
		const observer = new ResizeObserver(resize);
		observer.observe(wrapper);
		update();
		wrapper.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', resize);
		return () => {
			observer.disconnect();
			window.cancelAnimationFrame(resizeFrame);
			wrapper.removeEventListener('scroll', update);
			window.removeEventListener('resize', resize);
		};
	}, [currentWeek, selectedWeek, publicCompact, scrollMode, weeks.length]);

	function cyclePoints(student: BoardGridStudent, session: TeachingSessionRecord) {
		if (!session.participationOpen) return;
		const key = `${student.enrollmentId}:${session.id}`;
		const current = student.participation[session.id]?.points;
		const savedState = saveState?.(student.enrollmentId, session.id);
		const remembered = cycleValues.current.get(key);
		const basis =
			remembered !== undefined && (savedState === undefined || savedState === 'saving')
				? remembered
				: current;
		const next = nextPoints(basis);
		cycleValues.current.set(key, next);
		onParticipationChange?.({
			enrollmentId: student.enrollmentId,
			sessionId: session.id,
			points: next,
			note: student.participation[session.id]?.note ?? '',
		});
	}

	function saveNote(student: BoardGridStudent, session: TeachingSessionRecord, note: string) {
		onParticipationChange?.({
			enrollmentId: student.enrollmentId,
			sessionId: session.id,
			points: (student.participation[session.id]?.points ?? 0) as 0 | 0.5 | 1 | 2,
			note,
		});
		setNoteCell(null);
	}

	return (
		<>
			<div
				ref={wrapperRef}
				className={`mc-grid-wrap ${publicCompact ? 'mc-grid-wrap-public' : ''}`}
				data-scroll-mode={scrollMode}
				role="region"
				aria-label="Bảng điểm CP"
			>
				<table
					className="mc-grid"
					data-extra={showExtraColumns}
					data-group={false}
					data-mode="participation"
					data-testid="participation-grid"
				>
					<caption className="sr-only">Bảng chấm CP theo tuần</caption>
					<thead>
						<tr>
							<th
								title="Số thứ tự trong danh sách lớp"
								className={`mc-grid-freeze-left mc-grid-stt ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								STT
							</th>
							<th
								title="Mã số sinh viên"
								className={`mc-grid-freeze-left mc-grid-code ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								Mã SV
							</th>
							<th
								title="Họ và tên sinh viên"
								className={`mc-grid-freeze-left mc-grid-name ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								Họ và tên
							</th>
							{publicCompact ? (
								<th
									title="Thông tin sinh viên và điểm tổng hợp"
									className="mc-grid-public-identity mc-grid-mobile-only"
								>
									Sinh viên
								</th>
							) : null}
							{showExtraColumns ? (
								<>
									<th
										title="Mã lớp hành chính"
										className={`mc-grid-freeze-left mc-grid-home ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										Mã lớp
									</th>
									<th
										title="Ngành học của sinh viên"
										className={`mc-grid-freeze-left mc-grid-major ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										Ngành
									</th>
									<th
										title="Ngày sinh của sinh viên"
										className={`mc-grid-freeze-left mc-grid-dob ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										Ngày sinh
									</th>
								</>
							) : null}
							{weeks.map(({ weekNumber, session }) => {
								const isOpen = Boolean(session?.participationOpen);
								const isFinalized = Boolean(session?.participationTakenAt) && !isOpen;
								return (
									<th
										key={weekNumber}
										aria-label={`W${weekNumber}`}
										title={`Điểm CP tuần ${weekNumber}: 0,5 = có tham gia; 1 = đóng góp tốt; 2 = đóng góp nổi bật${session?.heldOn ? ` · ${sessionDateLabel(session.heldOn)}` : ''}`}
										className="mc-grid-week"
										data-week={weekNumber}
										data-selected={selectedWeek === weekNumber}
										data-cp-open={isOpen}
										data-cp-finalized={isFinalized}
									>
										<span className="mc-grid-week-heading">
											{session ? (
												<GridWeekActions
													weekNumber={weekNumber}
													kind="CP"
													open={isOpen}
													finalized={isFinalized}
													cancelled={session.isCancelled}
													busy={togglingSessionId === session.id}
													onLifecycle={
														!readOnly && onSessionLifecycle
															? (action) => onSessionLifecycle(session.id, action)
															: undefined
													}
													onToggle={
														!readOnly && onSessionToggle
															? (open) => onSessionToggle(session.id, open)
															: undefined
													}
												/>
											) : null}
											{onWeekSelect && !readOnly ? (
												<button
													type="button"
													className="mc-grid-week-select"
													aria-label={`Chọn tuần ${weekNumber}`}
													onClick={() => onWeekSelect(weekNumber)}
												>
													W{weekNumber}
												</button>
											) : (
												<span>W{weekNumber}</span>
											)}
										</span>
										<span className="mc-grid-week-sub">
											{sessionDateLabel(session?.heldOn ?? null)}
										</span>
									</th>
								);
							})}
							<th
								aria-label="Gift"
								title="Gift là lượt nhắc nhở/vi phạm; mỗi Gift trừ 1 điểm khỏi tổng CP, nhưng CP không thấp hơn 0"
								className={`mc-grid-freeze-right mc-grid-summary-start mc-grid-gift ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								<span className="mc-grid-summary-heading">Gift</span>
							</th>
							<th
								aria-label={`Attendance /${attendanceMaxPoints}`}
								title={`Điểm chuyên cần tối đa ${attendanceMaxPoints}, được tính từ bảng Điểm danh`}
								className={`mc-grid-freeze-right mc-grid-attendance-score ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								<span className="mc-grid-summary-heading">
									<span>Attendance</span>
									<span>/{attendanceMaxPoints}</span>
								</span>
							</th>
							<th
								aria-label={`CP /${CP_MAX_POINTS}`}
								title={`Điểm CP tối đa ${CP_MAX_POINTS}: tổng điểm CP theo tuần (tối đa ${CP_MAX_POINTS}) trừ số Gift`}
								className={`mc-grid-freeze-right mc-grid-cp ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								<span className="mc-grid-summary-heading">
									<span>CP</span>
									<span>/{CP_MAX_POINTS}</span>
								</span>
							</th>
							<th
								aria-label={`Tổng /${TOTAL_MAX_POINTS}`}
								title={`Tổng điểm = Attendance + CP, tối đa ${TOTAL_MAX_POINTS}`}
								className={`mc-grid-freeze-right mc-grid-total-score ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
							>
								<span className="mc-grid-summary-heading">
									<span>Tổng</span>
									<span>/{TOTAL_MAX_POINTS}</span>
								</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{students.length === 0 ? (
							<tr>
								<td
									colSpan={(publicCompact ? 1 : 3) + (showExtraColumns ? 3 : 0) + weeks.length + 4}
									className="p-8 text-center text-sm text-ink-secondary"
								>
									Không tìm thấy mã sinh viên phù hợp.
								</td>
							</tr>
						) : (
							students.map((student) => (
								<tr key={student.enrollmentId} data-risk={student.cp.riskLevel}>
									<td
										className={`mc-grid-freeze-left mc-grid-stt mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{student.orderNo}
									</td>
									<td
										className={`mc-grid-freeze-left mc-grid-code mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{student.studentCode}
									</td>
									<td
										className={`mc-grid-freeze-left mc-grid-name ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										<span className="inline-flex items-center gap-2">
											<span className="mc-avatar" aria-hidden>
												{studentInitials(student.familyName, student.givenName)}
											</span>
											<span className="font-semibold">
												{student.familyName} {student.givenName}
											</span>
										</span>
									</td>
									{publicCompact ? (
										<td className="mc-grid-public-identity mc-grid-mobile-only">
											<span className="inline-flex min-w-0 items-center gap-2">
												<span className="mc-avatar" aria-hidden>
													{studentInitials(student.familyName, student.givenName)}
												</span>
												<span className="min-w-0">
													<strong className="block truncate">
														{student.familyName} {student.givenName}
													</strong>
													<small className="mc-num mc-grid-public-meta block text-ink-secondary">
														<span className="mc-grid-public-meta-line">
															{student.studentCode} · Gift −{student.cp.giftDeduction}
														</span>
														<span className="mc-grid-public-meta-line">
															Attendance {formatTeachingScore(student.cp.attendanceScore)}/
															{attendanceMaxPoints} · CP {formatTeachingScore(student.cp.cp)}/
															{cpMaxPoints} · Tổng {formatTeachingScore(student.cp.totalScore)}/
															{TOTAL_MAX_POINTS}
														</span>
													</small>
													{!readOnly ? (
														<span className="mc-grid-mobile-gift-actions">
															<button
																type="button"
																disabled={student.giftCount === 0}
																aria-label={`Hoàn tác Gift ${student.studentCode}`}
																onClick={() => onGiftChange?.(student.enrollmentId, -1)}
															>
																−
															</button>
															<button
																type="button"
																aria-label={`Thêm Gift cho ${student.studentCode}`}
																onClick={() => onGiftChange?.(student.enrollmentId, 1)}
															>
																+ Gift
															</button>
														</span>
													) : null}
												</span>
											</span>
										</td>
									) : null}
									{showExtraColumns ? (
										<>
											<td
												className={`mc-grid-freeze-left mc-grid-home ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
											>
												{student.homeClassCode}
											</td>
											<td
												className={`mc-grid-freeze-left mc-grid-major ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
											>
												{student.majorName}
											</td>
											<td
												className={`mc-grid-freeze-left mc-grid-dob mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
											>
												{formatDob(student.dateOfBirth ?? null)}
											</td>
										</>
									) : null}
									{weeks.map(({ weekNumber, session }) => {
										if (!session || weekNumber < student.enrolledFromWeek) {
											return (
												<td key={weekNumber} className="mc-grid-week" data-week={weekNumber}>
													<span className="text-ink-tertiary">–</span>
												</td>
											);
										}
										const started =
											Boolean(session.participationOpen) ||
											Boolean(session.participationTakenAt) ||
											(!readOnly && Boolean(student.participation[session.id]));
										const open = Boolean(session.participationOpen);
										const points = student.participation[session.id]?.points;
										const mark = student.participation[session.id];
										const description = participationTooltip(points, mark?.note, started);
										const state = saveState?.(student.enrollmentId, session.id);
										return (
											<td
												key={session.id}
												className="mc-grid-week relative"
												data-week={weekNumber}
												data-selected={selectedWeek === weekNumber}
												data-save-state={state}
											>
												{readOnly ? (
													<span
														className="mc-grid-cell mc-grid-participation-cell"
														tabIndex={0}
														title={description}
														data-points={started ? (points ?? 0) : ''}
														data-flag={Boolean(mark?.note)}
														aria-label={`${student.studentCode} tuần ${weekNumber}: ${description}`}
													>
														{started ? pointsLabel(points) : '–'}
													</span>
												) : (
													<button
														type="button"
														className="mc-grid-cell mc-grid-participation-cell"
														data-points={started ? (points ?? 0) : ''}
														data-flag={Boolean(mark?.note)}
														disabled={
															session.isCancelled || !open || togglingSessionId === session.id
														}
														aria-label={`${student.studentCode} tuần ${weekNumber} ${open ? `CP ${pointsLabel(points)}; bấm để chuyển mức` : 'chưa chấm CP'}`}
														title={`${description}\n${
															session.isCancelled
																? 'Buổi đã hủy'
																: !open
																	? 'Mở chấm CP tuần này trước'
																	: 'Bấm để chuyển 0,5 → 1 → 2 → 0; chuột phải để thêm ghi chú'
														}`}
														onClick={() => cyclePoints(student, session)}
														onContextMenu={(event) => {
															event.preventDefault();
															if (!session.isCancelled && open)
																setNoteCell({
																	enrollmentId: student.enrollmentId,
																	sessionId: session.id,
																});
														}}
														onKeyDown={(event) => {
															if (
																(event.key === 'ContextMenu' ||
																	(event.key === 'F10' && event.shiftKey)) &&
																!session.isCancelled &&
																open
															) {
																event.preventDefault();
																setNoteCell({
																	enrollmentId: student.enrollmentId,
																	sessionId: session.id,
																});
															}
														}}
													>
														{started ? pointsLabel(points) : '–'}
													</button>
												)}
												{(readOnly ? Boolean(mark?.note) : open) ? (
													<button
														type="button"
														className="mc-grid-note-trigger"
														aria-label="Xem ghi chú CP"
														onClick={(event) => {
															event.stopPropagation();
															setNoteCell({
																enrollmentId: student.enrollmentId,
																sessionId: session.id,
															});
														}}
													>
														<McIcon name="more_horiz" size={16} />
													</button>
												) : null}
												{noteCell?.enrollmentId === student.enrollmentId &&
												noteCell.sessionId === session.id ? (
													<ParticipationNoteEditor
														initialNote={mark?.note ?? ''}
														onClose={() => setNoteCell(null)}
														onSave={(note) => saveNote(student, session, note)}
														onPoints={(points) => {
															onParticipationChange?.({
																enrollmentId: student.enrollmentId,
																sessionId: session.id,
																points,
																note: mark?.note ?? '',
															});
															setNoteCell(null);
														}}
														initialPoints={points}
														readOnly={readOnly}
													/>
												) : null}
												{state === 'saving' ? (
													<span className="mc-grid-save-dot" aria-label="Đang lưu">
														…
													</span>
												) : null}
												{state === 'saved' ? (
													<span className="mc-grid-save-dot" data-tone="saved" aria-label="Đã lưu">
														✓
													</span>
												) : null}
												{state === 'error' ? (
													<button
														type="button"
														className="mc-grid-retry"
														aria-label={`Thử lại CP ${student.studentCode} tuần ${weekNumber}`}
														onClick={() => onRetry?.(student.enrollmentId, session.id)}
													>
														↻
													</button>
												) : null}
											</td>
										);
									})}
									<td
										className={`mc-grid-freeze-right mc-grid-summary-start mc-grid-gift mc-num ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
										data-gifts={student.cp.giftDeduction}
										title={`${student.giftCount} Gift: trừ ${formatTeachingScore(student.cp.giftDeduction)} điểm CP`}
									>
										{readOnly ? (
											<span className="mc-grid-gift-value">−{student.cp.giftDeduction}</span>
										) : (
											<span className="mc-grid-gift-actions">
												<button
													type="button"
													className="mc-grid-gift-undo"
													disabled={student.giftCount === 0}
													aria-label={`Hoàn tác Gift ${student.studentCode}`}
													title="Bớt 1 Gift và hoàn lại tối đa 1 điểm CP"
													onClick={() => onGiftChange?.(student.enrollmentId, -1)}
												>
													−
												</button>
												<span className="mc-grid-gift-count">{student.giftCount}</span>
												<button
													type="button"
													className="mc-grid-gift-add"
													aria-label={`Thêm Gift cho ${student.studentCode}`}
													title="Thêm 1 Gift; Gift này sẽ trừ 1 điểm CP"
													onClick={() => onGiftChange?.(student.enrollmentId, 1)}
												>
													+
												</button>
											</span>
										)}
									</td>
									<td
										className={`mc-grid-freeze-right mc-grid-attendance-score mc-num font-semibold ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{formatTeachingScore(student.cp.attendanceScore)} / {attendanceMaxPoints}
									</td>
									<td
										className={`mc-grid-freeze-right mc-grid-cp mc-num font-semibold ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{formatTeachingScore(student.cp.cp)} / {cpMaxPoints}
									</td>
									<td
										className={`mc-grid-freeze-right mc-grid-total-score mc-num font-bold ${publicCompact ? 'mc-grid-desktop-only' : ''}`}
									>
										{formatTeachingScore(student.cp.totalScore)} / {TOTAL_MAX_POINTS}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<p className="mc-grid-score-context">
				Điểm chỉ tính từ các buổi đã chốt · Điểm danh:{' '}
				{sessions.filter((s) => !s.isCancelled && s.attendanceTakenAt && !s.attendanceOpen).length}{' '}
				buổi · CP:{' '}
				{
					sessions.filter((s) => !s.isCancelled && s.participationTakenAt && !s.participationOpen)
						.length
				}{' '}
				buổi
			</p>
		</>
	);
}

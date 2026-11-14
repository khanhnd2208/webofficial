'use client';

import { useEffect, useMemo, useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { teachingApi } from '@/components/teaching/admin/api';
import { recallVisibleText } from '@/features/active-recall/richText';
import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import type { ArenaHistoryEntry } from './arenaGame';
import { knownArenaRuns } from './arenaRuns';
import { arenaTurnsUrl, entryFromTurn, type RecallArenaTurnDay } from './arenaTurnLog';
import styles from './arena.module.css';

const RESULT_LABEL: Record<ArenaHistoryEntry['result'], string> = {
	pass: 'Đạt',
	fail: 'Chưa đạt',
	skip: 'Bỏ qua',
};

function timeLabel(at: number) {
	return new Date(at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(isoDay: string, todayIso: string) {
	if (isoDay === todayIso) return 'Hôm nay';
	const [year, month, day] = isoDay.split('-');
	return `${day}/${month}/${year}`;
}

export interface ArenaSyncStatus {
	pending: number;
	failed: boolean;
	rejected: number;
	retry: () => void;
}

/** Calls loaded from the server: read-only, with each card's saved wording. */
interface PastDay {
	date: string;
	entries: ArenaHistoryEntry[];
	questions: Map<string, string>;
}

/** Earlier runs of today are picked as `run:<key>`; `run:` alone holds turns saved before runs. */
const RUN_PREFIX = 'run:';

function savedCalls(date: string, turns: readonly RecallArenaTurnRecord[]): PastDay {
	return {
		date,
		entries: turns.map(entryFromTurn),
		questions: new Map(turns.map((turn) => [turn.clientId, turn.question])),
	};
}

/** Today's other runs as picker options, numbered in the order they began. */
function todayRunOptions(
	turns: readonly RecallArenaTurnRecord[],
	runKey: string | null,
	classCodeOf: (sessionId: string) => string,
) {
	const runs = knownArenaRuns(turns, runKey ? [runKey] : []).sort(
		(left, right) => left.startedAt - right.startedAt,
	);
	const options = runs.map((run, index) => {
		const classes = run.sessionIds.map(classCodeOf).filter(Boolean).join(', ');
		const label = `Hôm nay · Phiên ${index + 1} · ${timeLabel(run.startedAt)}${classes ? ` · ${classes}` : ''}`;
		return run.key === runKey
			? { value: '', label: `${label} (đang chơi)` }
			: { value: `${RUN_PREFIX}${run.key}`, label };
	});
	if (turns.some((turn) => !turn.runKey))
		options.unshift({ value: RUN_PREFIX, label: 'Hôm nay · trước khi chia phiên' });
	return options;
}

/** Who was called, newest first, with what was saved; earlier runs and days come from the server. */
export function ArenaHistory({
	entries,
	questionText,
	retryingId,
	onRetry,
	onNewRun,
	newRunBlocked = false,
	runKey,
	classCodeOf,
	onClose,
	courseId,
	todayIso,
	sync,
}: {
	entries: ArenaHistoryEntry[];
	questionText: (cardId: string | null) => string;
	retryingId: string | null;
	onRetry: (entry: ArenaHistoryEntry) => void;
	/** Start a fresh run for the next class period. */
	onNewRun?: () => void;
	/** Calls of this run are still being saved, so a new run must wait. */
	newRunBlocked?: boolean;
	/** The run on screen. */
	runKey: string | null;
	classCodeOf: (sessionId: string) => string;
	onClose: () => void;
	courseId: string;
	todayIso: string;
	sync: ArenaSyncStatus;
}) {
	const [days, setDays] = useState<string[]>([]);
	const [todayTurns, setTodayTurns] = useState<RecallArenaTurnRecord[]>([]);
	const [day, setDay] = useState(todayIso);
	const [past, setPast] = useState<PastDay | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		teachingApi<RecallArenaTurnDay>(arenaTurnsUrl(courseId, todayIso))
			.then((result) => {
				if (cancelled) return;
				setDays(result?.days ?? []);
				setTodayTurns(result?.turns ?? []);
			})
			.catch(() => {
				// Without the list only today is shown.
			});
		return () => {
			cancelled = true;
		};
	}, [courseId, todayIso]);

	useEffect(() => {
		if (day === todayIso || day.startsWith(RUN_PREFIX)) return;
		let cancelled = false;
		teachingApi<RecallArenaTurnDay>(arenaTurnsUrl(courseId, day))
			.then((result) => {
				if (cancelled) return;
				setPast(savedCalls(day, result.turns));
				setLoadError(null);
			})
			.catch((error: unknown) => {
				if (!cancelled)
					setLoadError(error instanceof Error ? error.message : 'Không tải được lịch sử.');
			});
		return () => {
			cancelled = true;
		};
	}, [courseId, day, todayIso]);

	const isToday = day === todayIso;
	const runView = day.startsWith(RUN_PREFIX) ? day.slice(RUN_PREFIX.length) : null;
	const earlierRun = useMemo(
		() =>
			runView == null
				? null
				: savedCalls(
						day,
						todayTurns.filter((turn) => (turn.runKey ?? '') === runView),
					),
		[day, runView, todayTurns],
	);
	const shownCalls = earlierRun ?? (past?.date === day ? past : null);
	const pastReady = !isToday && shownCalls != null;
	const shown = isToday ? entries : (shownCalls?.entries ?? []);
	const answered = shown.filter((entry) => entry.result !== 'skip');
	const passed = shown.filter((entry) => entry.result === 'pass').length;
	const runOptions = todayRunOptions(todayTurns, runKey, classCodeOf);
	const dayOptions = [
		...(runOptions.length
			? runOptions.map((option) => ({ ...option, value: option.value || todayIso }))
			: [{ value: todayIso, label: dayLabel(todayIso, todayIso) }]),
		...days
			.filter((item) => item !== todayIso)
			.map((item) => ({ value: item, label: dayLabel(item, todayIso) })),
	];
	const questionOf = (entry: ArenaHistoryEntry) => {
		if (isToday) return questionText(entry.cardId);
		const saved = shownCalls?.questions.get(entry.id);
		return saved ? recallVisibleText(saved) : 'Câu hỏi riêng';
	};

	return (
		<aside className={styles.history} aria-label="Lịch sử gọi">
			<header className={styles.historyHead}>
				<div>
					<h2>Đã gọi</h2>
					<p>
						{answered.length} lượt · {passed} đạt
					</p>
				</div>
				<button
					type="button"
					className={styles.iconButton}
					onClick={onClose}
					aria-label="Ẩn lịch sử"
					title="Ẩn (Esc)"
				>
					<McIcon name="close" size={20} />
				</button>
			</header>
			<div className={styles.historyTools}>
				<label className={styles.historyDay}>
					<span>Xem</span>
					<select value={day} onChange={(event) => setDay(event.target.value)}>
						{dayOptions.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				{isToday ? (
					<p className={styles.historySync} data-state={sync.failed ? 'error' : 'ok'}>
						{sync.failed ? (
							<>
								{sync.pending} lượt chưa lưu lên máy chủ.{' '}
								<button type="button" className={styles.linkButton} onClick={sync.retry}>
									Lưu lại
								</button>
							</>
						) : sync.pending > 0 ? (
							'Đang lưu lên máy chủ…'
						) : (
							'Đã lưu lên máy chủ'
						)}
						{sync.rejected > 0 ? ` · ${sync.rejected} lượt máy chủ không nhận` : ''}
					</p>
				) : null}
			</div>
			{loadError && !isToday && runView == null ? (
				<p className={styles.historyError}>{loadError}</p>
			) : !isToday && !pastReady ? (
				<p className={styles.historyEmpty}>Đang tải…</p>
			) : shown.length === 0 ? (
				<p className={styles.historyEmpty}>
					{isToday
						? 'Chưa gọi ai trong phiên này.'
						: runView != null
							? 'Phiên này chưa có lượt nào.'
							: 'Ngày này chưa có lượt nào.'}
				</p>
			) : (
				<ol className={styles.historyList}>
					{[...shown].reverse().map((entry) => (
						<li key={entry.id} className={styles.historyItem} data-result={entry.result}>
							<div className={styles.historyRow}>
								<strong>{entry.name}</strong>
								<span className={styles.historyChip} data-result={entry.result}>
									{RESULT_LABEL[entry.result]}
									{entry.result === 'pass' && entry.award ? ` +${entry.award}` : ''}
									{entry.result === 'pass' && entry.award === 0 ? ' · Vừa đủ qua' : ''}
								</span>
							</div>
							<p className={styles.historyQuestion}>{questionOf(entry)}</p>
							<p className={styles.historyMeta}>
								{timeLabel(entry.at)}
								{entry.cpAfter != null ? ` · CP tuần: ${entry.cpAfter}` : ''}
								{entry.giftAfter != null ? ` · Gift: ${entry.giftAfter}` : ''}
							</p>
							{isToday && entry.saveError ? (
								<p className={styles.historyError}>
									Chưa ghi CP: {entry.saveError}{' '}
									<button
										type="button"
										className={styles.linkButton}
										disabled={retryingId === entry.id}
										onClick={() => onRetry(entry)}
									>
										{retryingId === entry.id ? 'Đang ghi…' : 'Ghi lại'}
									</button>
								</p>
							) : null}
						</li>
					))}
				</ol>
			)}
			{isToday && onNewRun ? (
				<footer className={styles.historyFoot}>
					<button
						type="button"
						className={styles.linkButton}
						onClick={onNewRun}
						disabled={newRunBlocked}
						title={
							newRunBlocked
								? 'Đang lưu lượt gọi của phiên này, đợi lưu xong.'
								: 'Gọi lại mọi sinh viên, dùng lại toàn bộ câu hỏi, Boss về 1.'
						}
					>
						Bắt đầu phiên mới
					</button>
				</footer>
			) : null}
		</aside>
	);
}

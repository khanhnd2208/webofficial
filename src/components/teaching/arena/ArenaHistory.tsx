'use client';

import { useEffect, useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { teachingApi } from '@/components/teaching/admin/api';
import { recallVisibleText } from '@/features/active-recall/richText';

import type { ArenaHistoryEntry } from './arenaGame';
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

/** A past game day loaded from the server: read-only, with each card's saved wording. */
interface PastDay {
	date: string;
	entries: ArenaHistoryEntry[];
	questions: Map<string, string>;
}

/** Who was called, newest first, with what was saved; earlier days come from the server. */
export function ArenaHistory({
	entries,
	questionText,
	retryingId,
	onRetry,
	onReset,
	onClose,
	courseId,
	todayIso,
	sync,
}: {
	entries: ArenaHistoryEntry[];
	questionText: (cardId: string | null) => string;
	retryingId: string | null;
	onRetry: (entry: ArenaHistoryEntry) => void;
	onReset?: () => void;
	onClose: () => void;
	courseId: string;
	todayIso: string;
	sync: ArenaSyncStatus;
}) {
	const [days, setDays] = useState<string[]>([]);
	const [day, setDay] = useState(todayIso);
	const [past, setPast] = useState<PastDay | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		teachingApi<RecallArenaTurnDay>(arenaTurnsUrl(courseId, todayIso))
			.then((result) => {
				if (!cancelled) setDays(result?.days ?? []);
			})
			.catch(() => {
				// Without the list only today is shown.
			});
		return () => {
			cancelled = true;
		};
	}, [courseId, todayIso]);

	useEffect(() => {
		if (day === todayIso) return;
		let cancelled = false;
		teachingApi<RecallArenaTurnDay>(arenaTurnsUrl(courseId, day))
			.then((result) => {
				if (cancelled) return;
				setPast({
					date: day,
					entries: result.turns.map(entryFromTurn),
					questions: new Map(result.turns.map((turn) => [turn.clientId, turn.question])),
				});
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
	const pastReady = !isToday && past?.date === day;
	const shown = isToday ? entries : pastReady ? past.entries : [];
	const answered = shown.filter((entry) => entry.result !== 'skip');
	const passed = shown.filter((entry) => entry.result === 'pass').length;
	const dayOptions = [todayIso, ...days.filter((item) => item !== todayIso)];
	const questionOf = (entry: ArenaHistoryEntry) => {
		if (isToday) return questionText(entry.cardId);
		const saved = past?.questions.get(entry.id);
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
					<span>Ngày</span>
					<select value={day} onChange={(event) => setDay(event.target.value)}>
						{dayOptions.map((item) => (
							<option key={item} value={item}>
								{dayLabel(item, todayIso)}
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
			{loadError && !isToday ? (
				<p className={styles.historyError}>{loadError}</p>
			) : !isToday && !pastReady ? (
				<p className={styles.historyEmpty}>Đang tải…</p>
			) : shown.length === 0 ? (
				<p className={styles.historyEmpty}>
					{isToday ? 'Chưa gọi ai trong buổi này.' : 'Ngày này chưa có lượt nào.'}
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
			{isToday && onReset ? (
				<footer className={styles.historyFoot}>
					<button type="button" className={styles.linkButton} onClick={onReset}>
						Chơi lại từ Boss 1
					</button>
				</footer>
			) : null}
		</aside>
	);
}

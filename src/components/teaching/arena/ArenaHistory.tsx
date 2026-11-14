'use client';

import { useEffect, useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { teachingApi } from '@/components/teaching/admin/api';
import { recallVisibleText } from '@/features/active-recall/richText';

import {
	arenaCardFate,
	isAssistTurn,
	latestCardTurns,
	type ArenaCardFate,
	type ArenaHistoryEntry,
} from './arenaGame';
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

/** The select's first option: this browser's running phiên, not a server day. */
const LIVE = 'phien';

function dayLabel(isoDay: string, todayIso: string) {
	if (isoDay === LIVE) return 'Phiên này';
	if (isoDay === todayIso) return 'Hôm nay (cả ngày)';
	const [year, month, day] = isoDay.split('-');
	return `${day}/${month}/${year}`;
}

/** Today's latest turn on a question: its fate, and the switch to change it. */
function CardFateToggle({
	fate,
	onChange,
}: {
	fate: ArenaCardFate;
	onChange: (fate: ArenaCardFate) => void;
}) {
	const hidden = fate === 'hide';
	return (
		<p className={styles.historyFate} data-fate={fate}>
			<McIcon name={hidden ? 'visibility_off' : 'flag'} size={14} />
			{hidden ? 'Câu đã ẩn' : 'Câu đang giữ, sẽ hỏi lại'}
			<button
				type="button"
				className={styles.linkButton}
				onClick={() => onChange(hidden ? 'keep' : 'hide')}
			>
				{hidden ? 'Đưa câu trở lại' : 'Ẩn câu'}
			</button>
		</p>
	);
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
	onSetCardFate,
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
	/** Hide a kept question or bring a hidden one back, on today's latest turn for it. */
	onSetCardFate: (entryId: string, fate: ArenaCardFate) => void;
	onReset?: () => void;
	onClose: () => void;
	courseId: string;
	todayIso: string;
	sync: ArenaSyncStatus;
}) {
	const [days, setDays] = useState<string[]>([]);
	const [day, setDay] = useState(LIVE);
	const [past, setPast] = useState<PastDay | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		teachingApi<RecallArenaTurnDay>(arenaTurnsUrl(courseId, todayIso))
			.then((result) => {
				if (!cancelled) setDays(result?.days ?? []);
			})
			.catch(() => {
				// Without the list only this phiên is shown.
			});
		return () => {
			cancelled = true;
		};
	}, [courseId, todayIso]);

	useEffect(() => {
		if (day === LIVE) return;
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

	const isLive = day === LIVE;
	const pastReady = !isLive && past?.date === day;
	const shown = isLive ? entries : pastReady ? past.entries : [];
	const answered = shown.filter((entry) => entry.result !== 'skip');
	const passed = shown.filter((entry) => entry.result === 'pass' && entry.award !== 0).length;
	const dayOptions = [LIVE, ...days];
	const latestTurns = isLive ? latestCardTurns(entries) : null;
	const kept = latestTurns
		? [...latestTurns.values()].filter((entry) => arenaCardFate(entry) === 'keep').length
		: 0;
	const questionOf = (entry: ArenaHistoryEntry) => {
		if (isLive) return questionText(entry.cardId);
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
						{kept ? ` · ${kept} câu đang giữ` : ''}
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
							<option key={item} value={item}>
								{dayLabel(item, todayIso)}
							</option>
						))}
					</select>
				</label>
				{isLive ? (
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
			{loadError && !isLive ? (
				<p className={styles.historyError}>{loadError}</p>
			) : !isLive && !pastReady ? (
				<p className={styles.historyEmpty}>Đang tải…</p>
			) : shown.length === 0 ? (
				<p className={styles.historyEmpty}>
					{isLive ? 'Chưa gọi ai trong phiên này.' : 'Ngày này chưa có lượt nào.'}
				</p>
			) : (
				<ol className={styles.historyList}>
					{[...shown].reverse().map((entry) => (
						<li key={entry.id} className={styles.historyItem} data-result={entry.result}>
							<div className={styles.historyRow}>
								<strong>{entry.name}</strong>
								<span
									className={styles.historyChip}
									data-result={entry.result === 'pass' && entry.award === 0 ? 'bare' : entry.result}
								>
									{entry.result === 'pass' && entry.award === 0
										? 'Không điểm'
										: RESULT_LABEL[entry.result]}
									{entry.result === 'pass' && entry.award ? ` +${entry.award}` : ''}
									{isAssistTurn(entry) ? ' · Trả lời thay' : ''}
								</span>
							</div>
							<p className={styles.historyQuestion}>{questionOf(entry)}</p>
							{latestTurns && entry.cardId && latestTurns.get(entry.cardId) === entry ? (
								<CardFateToggle
									fate={arenaCardFate(entry)!}
									onChange={(fate) => onSetCardFate(entry.id, fate)}
								/>
							) : null}
							<p className={styles.historyMeta}>
								{timeLabel(entry.at)}
								{entry.cpAfter != null ? ` · CP tuần: ${entry.cpAfter}` : ''}
								{entry.giftAfter != null ? ` · Gift: ${entry.giftAfter}` : ''}
							</p>
							{isLive && entry.saveError ? (
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
			{isLive && onReset ? (
				<footer className={styles.historyFoot}>
					<button type="button" className={styles.linkButton} onClick={onReset}>
						Chơi lại từ Boss 1
					</button>
				</footer>
			) : null}
		</aside>
	);
}

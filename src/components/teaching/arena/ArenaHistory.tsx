'use client';

import type { ArenaHistoryEntry } from './arenaGame';
import styles from './arena.module.css';

const RESULT_LABEL: Record<ArenaHistoryEntry['result'], string> = {
	pass: 'Đạt',
	fail: 'Chưa đạt',
	skip: 'Bỏ qua',
};

function timeLabel(at: number) {
	return new Date(at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Who was called this session, newest first, with what was saved to CP. */
export function ArenaHistory({
	entries,
	questionText,
	retryingId,
	onRetry,
	onReset,
	onClose,
}: {
	entries: ArenaHistoryEntry[];
	questionText: (cardId: string | null) => string;
	retryingId: string | null;
	onRetry: (entry: ArenaHistoryEntry) => void;
	onReset: () => void;
	onClose: () => void;
}) {
	const answered = entries.filter((entry) => entry.result !== 'skip');
	const passed = entries.filter((entry) => entry.result === 'pass').length;
	return (
		<aside className={styles.history} aria-label="Lịch sử gọi">
			<header className={styles.historyHead}>
				<div>
					<h2>Đã gọi</h2>
					<p>
						{answered.length} lượt · {passed} đạt
					</p>
				</div>
				<button type="button" className={styles.ghostButton} onClick={onClose}>
					Ẩn
				</button>
			</header>
			{entries.length === 0 ? (
				<p className={styles.historyEmpty}>Chưa gọi ai trong buổi này.</p>
			) : (
				<ol className={styles.historyList}>
					{[...entries].reverse().map((entry) => (
						<li key={entry.id} className={styles.historyItem} data-result={entry.result}>
							<div className={styles.historyRow}>
								<strong>{entry.name}</strong>
								<span className={styles.historyChip} data-result={entry.result}>
									{RESULT_LABEL[entry.result]}
									{entry.result === 'pass' && entry.award ? ` +${entry.award}` : ''}
								</span>
							</div>
							<p className={styles.historyQuestion}>{questionText(entry.cardId)}</p>
							<p className={styles.historyMeta}>
								{timeLabel(entry.at)}
								{entry.cpAfter != null ? ` · CP tuần: ${entry.cpAfter}` : ''}
							</p>
							{entry.saveError ? (
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
			<footer className={styles.historyFoot}>
				<button type="button" className={styles.linkButton} onClick={onReset}>
					Bắt đầu lượt mới (xóa lịch sử trên máy này)
				</button>
			</footer>
		</aside>
	);
}

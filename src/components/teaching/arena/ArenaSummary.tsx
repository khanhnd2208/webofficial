'use client';

import Link from 'next/link';
import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';

import type { ArenaProgress } from './arenaGame';
import {
	arenaSummaryRows,
	arenaSummaryText,
	arenaSummaryTotals,
	summaryOutcome,
	type ArenaSummaryRow,
} from './arenaSummaryRows';
import styles from './arena.module.css';
import summary from './arenaSummary.module.css';
import { useArenaDialogFocus } from './useArenaDialogFocus';

const RESULT_LABEL: Record<ArenaSummaryRow['result'], string> = {
	pass: 'Đạt',
	fail: 'Chưa đạt',
	waiting: 'Chưa gọi',
};

export interface ArenaSummarySync {
	loading: boolean;
	/** Answers this browser has not saved to the server yet. */
	pending: number;
	failed: boolean;
	retry: () => void;
}

function cpCell(row: ArenaSummaryRow) {
	if (row.result !== 'pass' || row.guest) return '–';
	if (row.cpBefore != null && row.cpAfter != null && row.cpBefore !== row.cpAfter)
		return `${row.cpBefore} → ${row.cpAfter}`;
	return row.cpAfter ?? '–';
}

function gainCell(row: ArenaSummaryRow) {
	if (row.result !== 'pass' || row.guest) return '–';
	if (row.award === 0) return 'Vừa đủ qua';
	if (row.cpGain == null) return row.award ? `+${row.award}` : '–';
	return row.cpGain > 0 ? `+${row.cpGain}` : '+0';
}

/**
 * End of the session: who took part, what each student gained (CP) or was
 * given (Gift), and whether every mark reached the server, so the lecturer
 * can leave knowing nothing is lost.
 */
export function ArenaSummary({
	title,
	players,
	progress,
	names,
	classHref,
	sync,
	onContinue,
}: {
	/** Course and classes, used as the first line of the copied report. */
	title: string;
	/** Everyone on the floor; students who answered and left are added from the history. */
	players: ReadonlyArray<{ enrollmentId: string }>;
	progress: ArenaProgress;
	names: ReadonlyMap<string, string>;
	classHref: string;
	sync: ArenaSummarySync;
	onContinue: () => void;
}) {
	const dialogRef = useArenaDialogFocus(onContinue);
	const [copied, setCopied] = useState(false);
	const rows = arenaSummaryRows(
		players,
		progress.history,
		(id, fallback) => names.get(id) ?? fallback,
	);
	const totals = arenaSummaryTotals(rows);
	const bossesDefeated = progress.round - 1 + (progress.hp === 0 ? 1 : 0);
	// Grades are saved before a turn ends; only bare passes and skips can still be queued.
	const unsaved = sync.pending;
	const stats = [
		{ label: 'Đã trả lời', value: `${totals.answered}/${rows.length}` },
		{ label: 'Đạt', value: String(totals.passed) },
		{ label: 'Chưa đạt', value: String(totals.failed) },
		{ label: 'CP đã cộng', value: `+${totals.cpGained}` },
		{ label: 'Gift', value: `+${totals.giftsAdded}` },
		{ label: 'Boss bị hạ', value: String(bossesDefeated) },
	];

	async function copyReport() {
		try {
			await navigator.clipboard.writeText(arenaSummaryText(title, rows, totals));
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}

	return (
		<div className={styles.setupBackdrop}>
			<section
				ref={dialogRef}
				tabIndex={-1}
				className={summary.panel}
				role="dialog"
				aria-modal="true"
				aria-labelledby="arena-summary-title"
			>
				<header className={styles.setupHead}>
					<h2 id="arena-summary-title">Tổng kết phiên</h2>
					<button
						type="button"
						className={styles.iconButton}
						onClick={onContinue}
						aria-label="Đóng tổng kết"
						title="Đóng (Esc)"
					>
						<McIcon name="close" size={20} />
					</button>
				</header>
				<dl className={summary.stats}>
					{stats.map((item) => (
						<div key={item.label} className={summary.stat}>
							<dt>{item.label}</dt>
							<dd>{item.value}</dd>
						</div>
					))}
				</dl>
				<p
					className={summary.saveState}
					data-state={unsaved ? (sync.failed ? 'error' : 'pending') : 'ok'}
					role="status"
				>
					<McIcon name={unsaved ? 'warning' : 'check_circle'} size={18} />
					{unsaved ? (
						<span>
							{sync.failed
								? `${unsaved} lượt chưa lưu lên hệ thống (mất kết nối). `
								: `Đang lưu ${unsaved} lượt… `}
							Giữ trang này mở cho tới khi lưu xong.
							{sync.failed ? (
								<>
									{' '}
									<button type="button" className={styles.linkButton} onClick={sync.retry}>
										Thử lại
									</button>
								</>
							) : null}
						</span>
					) : (
						<span>
							Đã lưu hết lên hệ thống. CP và Gift được ghi ngay khi chấm từng bạn, nên thoát trang
							không làm mất điểm. Mở lại trong hôm nay vẫn thấy lịch sử này.
						</span>
					)}
				</p>
				{rows.length ? (
					<div className={summary.tableWrap}>
						<table className={summary.table}>
							<thead>
								<tr>
									<th scope="col">#</th>
									<th scope="col">Sinh viên</th>
									<th scope="col">Kết quả</th>
									<th scope="col">CP cộng</th>
									<th scope="col">CP tuần</th>
									<th scope="col">Gift</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row, index) => (
									<tr key={row.enrollmentId} data-result={row.result} title={summaryOutcome(row)}>
										<td>{index + 1}</td>
										<th scope="row">{row.name}</th>
										<td>
											<span className={summary.chip} data-result={row.result}>
												{RESULT_LABEL[row.result]}
											</span>
											{row.guest && row.result !== 'waiting' ? (
												<span className={summary.note}> · không ghi điểm</span>
											) : null}
										</td>
										<td data-gain={(row.cpGain ?? 0) > 0 || undefined}>{gainCell(row)}</td>
										<td>{cpCell(row)}</td>
										<td data-gift={row.giftAdded > 0 || undefined}>
											{row.giftAdded ? `+${row.giftAdded} (${row.giftAfter})` : '–'}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className={summary.empty}>Chưa có ai trong trận.</p>
				)}
				<footer className={styles.setupFoot}>
					<button
						type="button"
						className={`${styles.linkButton} ${summary.copy}`}
						onClick={() => void copyReport()}
					>
						<McIcon name="content_copy" size={16} />
						{copied ? 'Đã chép' : 'Chép báo cáo'}
					</button>
					<span className={summary.actions}>
						<Link href={classHref} className={`${styles.textButton} ${summary.link}`}>
							{unsaved ? 'Vẫn thoát' : 'Thoát về trang lớp'}
						</Link>
						<button
							type="button"
							className={styles.startButton}
							onClick={onContinue}
							data-dialog-initial-focus
						>
							Tiếp tục chơi
						</button>
					</span>
				</footer>
			</section>
		</div>
	);
}

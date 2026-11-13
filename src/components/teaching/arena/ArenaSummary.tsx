'use client';

import Link from 'next/link';

import { McIcon } from '@/components/myclass/ui';

import type { ArenaSummaryRow } from './arenaSummaryRows';
import styles from './arena.module.css';
import summary from './arenaSummary.module.css';
import { useArenaDialogFocus } from './useArenaDialogFocus';

const RESULT_LABEL: Record<ArenaSummaryRow['result'], string> = {
	pass: 'Đạt',
	fail: 'Chưa đạt',
	waiting: 'Chưa gọi',
};

/** End of the session: who took part, how they did, and the CP they earned. */
export function ArenaSummary({
	rows,
	bossesDefeated,
	classHref,
	onContinue,
}: {
	rows: ArenaSummaryRow[];
	bossesDefeated: number;
	classHref: string;
	onContinue: () => void;
}) {
	const dialogRef = useArenaDialogFocus(onContinue);
	const answered = rows.filter((row) => row.result !== 'waiting').length;
	const passed = rows.filter((row) => row.result === 'pass').length;
	const totalCp = rows.reduce((sum, row) => sum + (row.award ?? 0), 0);
	const stats = [
		{ label: 'Đã trả lời', value: `${answered}/${rows.length}` },
		{ label: 'Đạt', value: String(passed) },
		{ label: 'Chưa đạt', value: String(answered - passed) },
		{ label: 'CP đã cộng', value: String(totalCp) },
		{ label: 'Boss bị hạ', value: String(bossesDefeated) },
	];

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
								</tr>
							</thead>
							<tbody>
								{rows.map((row, index) => (
									<tr key={row.enrollmentId} data-result={row.result}>
										<td>{index + 1}</td>
										<th scope="row">{row.name}</th>
										<td>
											<span className={summary.chip} data-result={row.result}>
												{RESULT_LABEL[row.result]}
											</span>
										</td>
										<td>
											{row.award ? `+${row.award}` : row.result === 'pass' ? 'Vừa đủ qua' : '–'}
										</td>
										<td>
											{row.cpAfter ?? '–'}
											{row.giftAfter != null ? ` · Gift ${row.giftAfter}` : ''}
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
					<Link href={classHref} className={`${styles.textButton} ${summary.link}`}>
						Về trang lớp
					</Link>
					<button
						type="button"
						className={styles.startButton}
						onClick={onContinue}
						data-dialog-initial-focus
					>
						Tiếp tục chơi
					</button>
				</footer>
			</section>
		</div>
	);
}

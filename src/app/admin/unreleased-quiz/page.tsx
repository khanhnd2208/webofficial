import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStat } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';
import { routes } from '@/config/routes';
import { QUESTIONS } from '@/features/unreleased-quiz/content/questions';
import { MISMATCH_NOTES, resultCopy } from '@/features/unreleased-quiz/content/results';
import type { GroupId, QuestionId } from '@/features/unreleased-quiz/domain/quiz';
import { getQuizReport } from '@/features/unreleased-quiz/services/responseService';

export const dynamic = 'force-dynamic';

const GROUPS: GroupId[] = ['chua-chon-bai', 'ban-nhap', 'doi-giong', 'dung-bai'];
const QUESTION_IDS: QuestionId[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];

const VARIANT_LABELS: Record<string, string> = {
	'no-direction': 'Chưa có hướng ứng tuyển',
	'no-jd': 'Có hướng, chưa đọc kỹ JD',
	'unclear-job': 'Đã đọc JD, chưa rõ công việc',
	'unclear-requirements': 'Đã đọc JD, chưa rõ yêu cầu',
};

const number = (value: number) => value.toLocaleString('vi-VN');
const percent = (part: number, whole: number) =>
	whole ? `${Math.round((part / whole) * 100)}%` : '—';

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
	timeZone: 'Asia/Ho_Chi_Minh',
	day: '2-digit',
	month: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
});

function Bar({ share }: { share: number }) {
	return (
		<span className="block h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-hairline">
			<span className="block h-full bg-accent" style={{ width: `${Math.round(share * 100)}%` }} />
		</span>
	);
}

export default async function UnreleasedQuizAdminPage() {
	const { report, recent } = await getQuizReport();
	const people = report.people;

	return (
		<div className={`${styles.page} ${styles.wide}`}>
			<AdminPageHeader
				title="Quiz UNRELEASED"
				description="Kết quả ẩn danh từ /unreleased. Nhóm và phân bố đáp án tính theo lần làm gần nhất của mỗi người; không lưu tên, email hay IP."
				actions={
					<>
						<a
							href={routes.admin.unreleasedQuizExport}
							className={`${styles.button} ${styles.secondary}`}
						>
							Tải CSV
						</a>
						<a
							href={routes.unreleased}
							target="_blank"
							rel="noopener noreferrer"
							className={`${styles.button} ${styles.quiet}`}
						>
							Mở quiz
						</a>
					</>
				}
			/>

			{report.responses === 0 ? (
				<div className="mt-8">
					<AdminEmptyState
						icon="analytics"
						title="Chưa có ai làm quiz"
						description="Kết quả sẽ hiện ở đây ngay khi người đầu tiên làm xong."
					/>
				</div>
			) : (
				<>
					<section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
						<AdminStat
							label="Người làm quiz"
							value={number(people)}
							note="Mỗi trình duyệt tính là một người"
						/>
						<AdminStat
							label="Lượt hoàn thành"
							value={number(report.responses)}
							note={`${number(report.retakes)} lượt làm lại`}
						/>
						<AdminStat
							label="Bấm Đăng ký sau quiz"
							value={number(report.registerClickPeople)}
							note={`${percent(report.registerClickPeople, people)} số người làm quiz`}
						/>
						<AdminStat
							label="Nhóm đông nhất"
							value={
								resultCopy(
									GROUPS.reduce((top, id) => (report.groups[id] > report.groups[top] ? id : top)),
									null,
								).name
							}
							note="Theo lần làm gần nhất"
						/>
					</section>

					<div className="mt-9 grid gap-9 lg:grid-cols-2">
						<section>
							<h2 className={styles.sectionTitle}>Bốn điểm xuất phát</h2>
							<div className={`${styles.tableWrap} mt-3`}>
								<table className={styles.table}>
									<thead>
										<tr>
											<th>Nhóm</th>
											<th className={styles.numeric}>Người</th>
											<th className={styles.numeric}>Tỷ lệ</th>
										</tr>
									</thead>
									<tbody>
										{GROUPS.map((id) => (
											<tr key={id}>
												<td>
													<strong>{resultCopy(id, null).name}</strong>
													{id === 'chua-chon-bai' ? (
														<ul className="mt-1 space-y-0.5 text-xs text-muted">
															{Object.entries(VARIANT_LABELS).map(([variant, label]) => (
																<li key={variant}>
																	{label}: {number(report.variants[variant] ?? 0)}
																</li>
															))}
														</ul>
													) : null}
												</td>
												<td className={styles.numeric}>{number(report.groups[id])}</td>
												<td className={styles.numeric}>{percent(report.groups[id], people)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<h2 className={`${styles.sectionTitle} mt-8`}>Câu trả lời lệch nhau</h2>
							<p className="mt-1 text-sm text-muted">Chỉ tính ở ba nhóm có chấm điểm (câu 5–7).</p>
							<ul className="mt-3 space-y-1.5 text-sm">
								{Object.entries(MISMATCH_NOTES).map(([key, note]) => (
									<li key={key} className="flex justify-between gap-4">
										<span>{note.title}</span>
										<span className="tabular-nums">{number(report.notes[key] ?? 0)}</span>
									</li>
								))}
							</ul>
						</section>

						<section>
							<h2 className={styles.sectionTitle}>Lượt hoàn thành theo ngày</h2>
							<div className={`${styles.tableWrap} mt-3`}>
								<table className={styles.table}>
									<thead>
										<tr>
											<th>Ngày</th>
											<th className={styles.numeric}>Lượt</th>
										</tr>
									</thead>
									<tbody>
										{[...report.daily].reverse().map((row) => (
											<tr key={row.day}>
												<td>{row.day.split('-').reverse().join('/')}</td>
												<td className={styles.numeric}>{number(row.responses)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>
					</div>

					<section className="mt-10">
						<h2 className={styles.sectionTitle}>Phân bố đáp án</h2>
						<p className="mt-1 text-sm text-muted">
							Câu 2 và câu 5–7 chỉ hỏi người đi đúng nhánh, nên tổng số người mỗi câu khác nhau.
						</p>
						<div className="mt-4 grid gap-6 lg:grid-cols-2">
							{QUESTION_IDS.map((id, index) => {
								const counts = report.answers[id];
								const answered = Object.values(counts).reduce((sum, value) => sum + value, 0);
								return (
									<div key={id} className={styles.panel}>
										<p className={styles.meta}>
											Câu {index + 1} · {number(answered)} người trả lời
										</p>
										<p className="mt-1 font-semibold">{QUESTIONS[id].prompt}</p>
										<ul className="mt-3 space-y-2 text-sm">
											{QUESTIONS[id].options.map((option) => {
												const count = counts[option.key] ?? 0;
												return (
													<li
														key={option.key}
														className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1"
													>
														<span className="font-semibold">{option.key}</span>
														<span>{option.text}</span>
														<span className="tabular-nums">
															{number(count)} · {percent(count, answered)}
														</span>
														<span />
														<Bar share={answered ? count / answered : 0} />
													</li>
												);
											})}
										</ul>
									</div>
								);
							})}
						</div>
					</section>

					<section className="mt-10">
						<h2 className={styles.sectionTitle}>50 lượt gần nhất</h2>
						<div className={`${styles.tableWrap} mt-3`}>
							<table className={`${styles.table} ${styles.tableMedium}`}>
								<thead>
									<tr>
										<th>Lúc</th>
										<th>Nhóm</th>
										<th>Đáp án (câu 1–7)</th>
										<th>Đăng ký</th>
										<th>Người</th>
									</tr>
								</thead>
								<tbody>
									{recent.map((row) => (
										<tr key={row.id}>
											<td className="whitespace-nowrap">{timeFormatter.format(row.createdAt)}</td>
											<td>
												{resultCopy(row.group as GroupId, null).name}
												{row.variant ? (
													<span className="block text-xs text-muted">
														{VARIANT_LABELS[row.variant] ?? row.variant}
													</span>
												) : null}
											</td>
											<td className="font-mono">
												{QUESTION_IDS.map((id) => row[id] ?? '–').join(' ')}
											</td>
											<td>{row.registerClickedAt ? 'Đã bấm' : ''}</td>
											<td className="font-mono text-xs text-muted">
												{row.respondentId.slice(0, 8)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				</>
			)}
		</div>
	);
}

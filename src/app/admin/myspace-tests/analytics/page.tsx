import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { myspaceTestsService } from '@/features/myspace-tests';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Thống kê Tests | Admin',
};

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
	return (
		<div className="border border-border bg-surface p-5">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
			<p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
			{sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
		</div>
	);
}

function formatWhen(iso: string) {
	return new Date(iso).toLocaleString('vi-VN', {
		timeZone: 'Asia/Ho_Chi_Minh',
		dateStyle: 'short',
		timeStyle: 'short',
	});
}

export default async function AdminMyspaceTestAnalyticsPage() {
	const overview = await myspaceTestsService.getAnalyticsOverview(30);
	const { totals, byTest, daily, recentCompletions } = overview;
	const completionRate =
		totals.engaged > 0 ? Math.round((totals.completed / totals.engaged) * 1000) / 10 : null;

	const maxDaily = Math.max(1, ...daily.map((d) => Math.max(d.opened, d.engaged, d.completed)));

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<AdminPageHeader
				eyebrow="My Space"
				title="Thống kê làm bài"
				description="Đã làm = trả lời ≥ 1 câu. Hoàn thành / điểm TB / thời gian TB chỉ tính phiên ≥ 5 phút."
				actions={
					<Link
						href={routes.admin.myspaceTests}
						className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
					>
						← Tests
					</Link>
				}
			/>

			<section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Stat label="Đã làm" value={totals.engaged} sub="trả lời ≥ 1 câu" />
				<Stat label="Hoàn thành" value={totals.completed} sub="đã nộp bài" />
				<Stat
					label="Tỷ lệ nộp"
					value={completionRate != null ? `${completionRate}%` : '—'}
					sub="hoàn thành / đã làm"
				/>
				<Stat
					label="Điểm TB"
					value={totals.avgScorePercent != null ? `${totals.avgScorePercent}%` : '—'}
					sub="trên bài đã nộp"
				/>
			</section>

			<p className="mt-3 text-xs text-muted">
				Lượt mở trang (thô): {totals.opened.toLocaleString('vi-VN')} — chỉ mang tính tham khảo.
			</p>

			<section className="mt-10">
				<h2 className="text-sm font-bold uppercase tracking-widest text-muted">Theo bài test</h2>
				<div className="mt-4 divide-y divide-border border border-border">
					{byTest.length === 0 ? (
						<div className="p-4">
							<AdminEmptyState
								title="Chưa có dữ liệu"
								description="Chưa có lượt làm bài để thống kê."
							/>
						</div>
					) : (
						byTest.map((t) => {
							const rate = t.engaged > 0 ? Math.round((t.completed / t.engaged) * 1000) / 10 : null;
							return (
								<div
									key={t.spaceTestId}
									className="flex flex-wrap items-center justify-between gap-3 p-4"
								>
									<div className="min-w-0">
										<p className="text-sm font-bold text-foreground">{t.title}</p>
										<p className="mt-0.5 text-xs text-muted">/{t.slug}</p>
									</div>
									<div className="flex flex-wrap gap-4 text-right text-xs">
										<div>
											<p className="font-bold text-foreground">{t.engaged}</p>
											<p className="text-muted">Đã làm</p>
										</div>
										<div>
											<p className="font-bold text-foreground">{t.completed}</p>
											<p className="text-muted">Hoàn thành</p>
										</div>
										<div>
											<p className="font-bold text-foreground">{rate != null ? `${rate}%` : '—'}</p>
											<p className="text-muted">Nộp</p>
										</div>
										<div>
											<p className="font-bold text-foreground">
												{t.avgScorePercent != null ? `${t.avgScorePercent}%` : '—'}
											</p>
											<p className="text-muted">Điểm TB</p>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</section>

			<section className="mt-10">
				<h2 className="text-sm font-bold uppercase tracking-widest text-muted">
					30 ngày gần đây (UTC)
				</h2>
				<div className="mt-4 overflow-x-auto border border-border p-4">
					<div className="flex h-32 items-end gap-1" style={{ minWidth: daily.length * 18 }}>
						{daily.map((d) => (
							<div
								key={d.date}
								className="group relative flex flex-1 flex-col items-center justify-end gap-0.5"
								title={`${d.date}: mở ${d.opened}, làm ${d.engaged}, nộp ${d.completed}`}
							>
								<div
									className="w-full bg-foreground/15"
									style={{ height: `${(d.opened / maxDaily) * 100}%`, minHeight: d.opened ? 2 : 0 }}
								/>
								<div
									className="w-full bg-foreground/40"
									style={{
										height: `${(d.engaged / maxDaily) * 100}%`,
										minHeight: d.engaged ? 2 : 0,
									}}
								/>
								<div
									className="w-full bg-foreground"
									style={{
										height: `${(d.completed / maxDaily) * 100}%`,
										minHeight: d.completed ? 2 : 0,
									}}
								/>
							</div>
						))}
					</div>
					<p className="mt-3 text-[10px] text-muted">
						Cột: mở (nhạt) · đã làm (vừa) · hoàn thành (đậm). Hover để xem số.
					</p>
				</div>
			</section>

			<section className="mt-10">
				<h2 className="text-sm font-bold uppercase tracking-widest text-muted">Nộp bài gần đây</h2>
				<div className="mt-4 divide-y divide-border border border-border">
					{recentCompletions.length === 0 ? (
						<div className="p-4">
							<AdminEmptyState title="Chưa có ai nộp bài" />
						</div>
					) : (
						recentCompletions.map((r) => (
							<div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
								<div>
									<p className="text-sm font-bold text-foreground">{r.title}</p>
									<p className="mt-0.5 text-xs text-muted">{formatWhen(r.submittedAt)}</p>
								</div>
								<p className="text-sm font-bold text-foreground">
									{r.score}/{r.total}{' '}
									<span className="font-normal text-muted">
										({Math.round((r.score / r.total) * 100)}%)
									</span>
								</p>
							</div>
						))
					)}
				</div>
			</section>
		</div>
	);
}

import Link from 'next/link';

import { auth } from '@/lib/auth';
import { listMyVocabSets } from '@/services/vocabSetService';
import { getUserWordStats } from '@/services/wordStatsService';
import { getStreak } from '@/services/streakService';
import StreakFire from '@/components/StreakFire';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
	const session = await auth();
	const user = session?.user;
	const userId = user?.id ?? '';

	const [mySets, wordStats, streakData] = await Promise.all([
		userId ? listMyVocabSets(userId) : Promise.resolve([]),
		userId ? getUserWordStats(userId) : Promise.resolve([]),
		userId ? getStreak(userId) : Promise.resolve({ currentStreak: 0, longestStreak: 0, lastLoginDate: '', recentDays: [] as string[] }),
	]);

	const totalTerms = mySets.reduce((sum, s) => sum + s.termCount, 0);
	const totalPracticed = wordStats.length;
	const avgAccuracy = totalPracticed > 0
		? Math.round(wordStats.reduce((sum, w) => sum + w.accuracy, 0) / totalPracticed)
		: 0;
	const totalAttempts = wordStats.reduce((sum, w) => sum + w.totalAttempts, 0);

	// Mastered = accuracy >= 80% and at least 3 attempts
	const masteredCount = wordStats.filter((w) => w.accuracy >= 80 && w.totalAttempts >= 3).length;

	return (
		<main className="min-h-screen pb-16">
			{/* ─── Hero Header ─── */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
					<div className="flex items-start justify-between gap-6">
						<div className="min-w-0 flex-1">
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
								Dashboard
							</p>
							<h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
								Xin chào{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
							</h1>
							<p className="mt-1.5 text-sm text-foreground-secondary">
								Tổng quan tiến trình học tập của bạn.
							</p>
						</div>
						<div className="shrink-0">
							{user?.image ? (
								<img
									src={user.image}
									alt={user.name ?? 'Avatar'}
									className="h-14 w-14 rounded-full ring-2 ring-border"
									referrerPolicy="no-referrer"
								/>
							) : (
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-lg font-black text-background">
									{(user?.name ?? 'U')[0]}
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* ─── Stats Overview + Streak ─── */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-6">
					<div className="grid grid-cols-2 lg:grid-cols-5">
						{/* Streak — prominent left card */}
						<div className="col-span-2 flex items-center justify-center border-b border-border py-8 lg:col-span-1 lg:border-b-0 lg:border-r lg:py-10">
							<StreakFire />
						</div>

						{/* Stat numbers */}
						<div className="col-span-2 grid grid-cols-2 lg:col-span-4 lg:grid-cols-4">
							{[
								{
									value: mySets.length,
									label: 'Bộ từ vựng',
									icon: (
										<svg className="inline-block h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
											<defs><linearGradient id="stat-books" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--rose)" /></linearGradient></defs>
											<path d="M4 19V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" fill="url(#stat-books)" opacity="0.2" stroke="url(#stat-books)" strokeWidth="1.5" />
											<path d="M14 3v6h6" stroke="url(#stat-books)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
											<path d="M8 13h8M8 17h5" stroke="url(#stat-books)" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
									),
								},
								{
									value: totalTerms,
									label: 'Tổng từ vựng',
									icon: (
										<svg className="inline-block h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
											<defs><linearGradient id="stat-terms" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--indigo)" /><stop offset="100%" stopColor="var(--purple)" /></linearGradient></defs>
											<rect x="3" y="3" width="18" height="18" rx="3" fill="url(#stat-terms)" opacity="0.15" stroke="url(#stat-terms)" strokeWidth="1.5" />
											<path d="M7 8h4M7 12h10M7 16h7" stroke="url(#stat-terms)" strokeWidth="1.5" strokeLinecap="round" />
											<circle cx="17" cy="8" r="2" fill="url(#stat-terms)" opacity="0.5" />
										</svg>
									),
								},
								{
									value: totalPracticed,
									label: 'Đã luyện tập',
									icon: (
										<svg className="inline-block h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
											<defs><linearGradient id="stat-target" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--teal)" /><stop offset="100%" stopColor="var(--success)" /></linearGradient></defs>
											<circle cx="12" cy="12" r="10" fill="url(#stat-target)" opacity="0.12" stroke="url(#stat-target)" strokeWidth="1.5" />
											<circle cx="12" cy="12" r="6" fill="none" stroke="url(#stat-target)" strokeWidth="1.5" />
											<circle cx="12" cy="12" r="2.5" fill="url(#stat-target)" />
										</svg>
									),
								},
								{
									value: `${avgAccuracy}%`,
									label: 'Chính xác TB',
									icon: (
										<svg className="inline-block h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
											<defs><linearGradient id="stat-chart" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--warning)" /></linearGradient></defs>
											<rect x="3" y="14" width="4" height="7" rx="1" fill="url(#stat-chart)" opacity="0.4" />
											<rect x="10" y="9" width="4" height="12" rx="1" fill="url(#stat-chart)" opacity="0.6" />
											<rect x="17" y="3" width="4" height="18" rx="1" fill="url(#stat-chart)" opacity="0.85" />
											<path d="M5 13L12 7l7 3" stroke="url(#stat-chart)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
										</svg>
									),
								},
							].map((stat, i) => (
								<div
									key={stat.label}
									className={`flex flex-col justify-center px-5 py-6 sm:px-6 ${i > 0 ? 'border-l border-border' : ''} ${i >= 2 ? 'border-t border-border lg:border-t-0' : ''}`}
								>
									<div className="text-lg font-black tabular-nums tracking-tight text-foreground sm:text-2xl">
										{stat.value}
									</div>
									<div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
										{stat.icon} {stat.label}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<div className="mx-auto max-w-6xl px-6 pt-10">
				{/* ─── Section: Truy cập nhanh ─── */}
				<section>
					<div className="flex items-center gap-3">
						<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
							Truy cập nhanh
						</h2>
						<div className="h-px flex-1 bg-border" />
					</div>

					<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{[
							{
								href: '/vocabulary',
								title: 'Từ vựng của tôi',
								desc: 'Quản lý & ôn tập bộ từ vựng',
								color: 'text-accent',
								bg: 'bg-accent-subtle',
								icon: (
									<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
										<path d="M4 5a2 2 0 012-2h5l2 2h5a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" fill="currentColor" opacity="0.15" />
										<path d="M4 5a2 2 0 012-2h5l2 2h5a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5" />
										<path d="M9 13h6M9 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
								),
							},
							{
								href: '/vocabulary/create',
								title: 'Tạo bộ từ mới',
								desc: 'Thêm bộ từ vựng mới để học',
								color: 'text-success',
								bg: 'bg-success-subtle',
								icon: (
									<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
										<circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
										<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
										<path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
									</svg>
								),
							},
							{
								href: '/vocabulary/database',
								title: 'Kho từ vựng',
								desc: 'Tra cứu & phân tích tất cả từ',
								color: 'text-indigo',
								bg: 'bg-indigo-subtle',
								icon: (
									<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
										<ellipse cx="12" cy="6" rx="8" ry="3" fill="currentColor" opacity="0.2" />
										<ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" />
										<path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" strokeWidth="1.5" />
										<path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.5" />
										<ellipse cx="12" cy="12" rx="8" ry="3" fill="currentColor" opacity="0.08" />
									</svg>
								),
							},
							{
								href: '/vocabulary/store',
								title: 'Cửa hàng từ vựng',
								desc: 'Tải bộ từ có sẵn từ cộng đồng',
								color: 'text-rose',
								bg: 'bg-rose-subtle',
								icon: (
									<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
										<path d="M3 9l1.5-5h15L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										<path d="M3 9h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" />
										<path d="M9 9c0 1.66.9 3 2 3h2c1.1 0 2-1.34 2-3" stroke="currentColor" strokeWidth="1.5" />
										<path d="M10 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
								),
							},
							{
								href: '/blog',
								title: 'Blog & Tài liệu',
								desc: 'Đọc bài viết và tài liệu học',
								color: 'text-purple',
								bg: 'bg-purple-subtle',
								icon: (
									<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
										<path d="M4 4h7a1 1 0 011 1v14a1 1 0 01-1 1H4V4z" fill="currentColor" opacity="0.15" />
										<path d="M12 4h7v16h-7V4z" fill="currentColor" opacity="0.08" />
										<path d="M12 4H5a1 1 0 00-1 1v14a1 1 0 001 1h7m0-16h7a1 1 0 011 1v14a1 1 0 01-1 1h-7m0-16v16" stroke="currentColor" strokeWidth="1.5" />
										<path d="M7 8h3M7 11h3M14 8h3M14 11h3M14 14h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
									</svg>
								),
							},
							{
								href: '/dashboard/vocabulary',
								title: 'Tiến trình ôn tập',
								desc: 'Xem lịch sử luyện tập chi tiết',
								color: 'text-teal',
								bg: 'bg-teal-subtle',
								icon: (
									<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
										<path d="M3 20V10l4-3v13H3z" fill="currentColor" opacity="0.15" />
										<path d="M9 20V7l4-4v17H9z" fill="currentColor" opacity="0.25" />
										<path d="M15 20V8l4-2v14h-4z" fill="currentColor" opacity="0.35" />
										<rect x="3" y="10" width="4" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
										<rect x="9" y="6" width="4" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
										<rect x="15" y="3" width="4" height="17" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
										<path d="M5 9l5-3.5 5 2L21 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2" />
									</svg>
								),
							},
						].map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="group flex items-center gap-4 border border-border p-4 transition-all hover:border-border-hover hover:bg-surface-hover active:scale-[0.99]"
							>
								<div className={`flex h-10 w-10 shrink-0 items-center justify-center ${item.bg} ${item.color} transition-colors`}>
									{item.icon}
								</div>
								<div className="min-w-0">
									<div className={`text-sm font-bold ${item.color}`}>{item.title}</div>
									<div className="mt-0.5 text-[11px] text-muted">{item.desc}</div>
								</div>
							</Link>
						))}
					</div>
				</section>

				{/* ─── Section: Tiến trình học tập ─── */}
				{totalPracticed > 0 && (
					<section className="mt-12">
						<div className="flex items-center gap-3">
							<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
								Tiến trình học tập
							</h2>
							<div className="h-px flex-1 bg-border" />
						</div>

						<div className="mt-5 grid gap-3 sm:grid-cols-3">
							{/* Mastered */}
							<div className="border border-border p-5">
								<div className="flex items-center gap-2 text-success">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
										<circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
										<path d="M8 12.5l2.5 3L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="text-[10px] font-bold uppercase tracking-widest">Đã thành thạo</span>
								</div>
								<div className="mt-3 text-2xl font-black tabular-nums text-foreground">{masteredCount}</div>
								<div className="text-[11px] text-muted">trong tổng {totalPracticed} từ đã học</div>
								{totalPracticed > 0 && (
									<div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
										<div
											className="h-full rounded-full bg-success transition-all duration-500"
											style={{ width: `${Math.round((masteredCount / totalPracticed) * 100)}%` }}
										/>
									</div>
								)}
							</div>

							{/* Total Attempts */}
							<div className="border border-border p-5">
								<div className="flex items-center gap-2 text-indigo">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
										<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										<path d="M22 12A10 10 0 0012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" />
										<path d="M17 8l5-1-1 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<span className="text-[10px] font-bold uppercase tracking-widest">Tổng lượt luyện</span>
								</div>
								<div className="mt-3 text-2xl font-black tabular-nums text-foreground">{totalAttempts}</div>
								<div className="text-[11px] text-muted">lượt luyện tập</div>
							</div>

							{/* Accuracy */}
							<div className="border border-border p-5">
								<div className="flex items-center gap-2 text-accent">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
										<path d="M12 2l2.4 5.8 6.1.5-4.6 4 1.5 6L12 15.5 6.6 18.3l1.5-6-4.6-4 6.1-.5L12 2z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
									</svg>
									<span className="text-[10px] font-bold uppercase tracking-widest">Độ chính xác</span>
								</div>
								<div className="mt-3 text-2xl font-black tabular-nums text-foreground">{avgAccuracy}%</div>
								<div className="text-[11px] text-muted">trung bình tất cả từ</div>
								{avgAccuracy > 0 && (
									<div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
										<div
											className="h-full rounded-full bg-accent transition-all duration-500"
											style={{ width: `${avgAccuracy}%` }}
										/>
									</div>
								)}
							</div>
						</div>
					</section>
				)}

				{/* ─── Section: Bộ từ gần đây ─── */}
				{mySets.length > 0 && (
					<section className="mt-12">
						<div className="flex items-center gap-3">
							<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
								Bộ từ gần đây
							</h2>
							<div className="h-px flex-1 bg-border" />
							<Link href="/vocabulary" className="text-[10px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground">
								Tất cả →
							</Link>
						</div>

						<div className="mt-5 divide-y divide-border border border-border">
							{mySets.slice(0, 5).map((set) => (
								<Link
									key={set.id}
									href={`/vocabulary/${set.id}`}
									className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-hover"
								>
									<div className="min-w-0 flex-1">
										<div className="text-sm font-bold text-foreground transition-colors group-hover:text-accent">
											{set.title}
										</div>
										<div className="mt-0.5 text-[11px] text-muted">{set.termCount} từ</div>
									</div>
									<div className="flex shrink-0 items-center gap-3">
										<time className="text-[11px] tabular-nums text-muted" suppressHydrationWarning>
											{new Date(set.updatedAt).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
										</time>
										<svg className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
										</svg>
									</div>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* ─── Section: Chuỗi đăng nhập (chi tiết) ─── */}
				{streakData.recentDays.length > 0 && (
					<section className="mt-12">
						<div className="flex items-center gap-3">
							<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
								Lịch sử đăng nhập
							</h2>
							<div className="h-px flex-1 bg-border" />
						</div>

						<div className="mt-5 border border-border p-5">
							<div className="flex items-center justify-between">
								<div>
									<div className="text-sm font-bold text-foreground">
										Chuỗi hiện tại: <span className="text-accent">{streakData.currentStreak} ngày</span>
									</div>
									<div className="mt-0.5 text-[11px] text-muted">
										Kỷ lục: {streakData.longestStreak} ngày
									</div>
								</div>
							</div>

							{/* Mini heatmap — last 30 days */}
							<div className="mt-4 flex flex-wrap gap-1">
								{Array.from({ length: 30 }, (_, i) => {
									const d = new Date();
									d.setUTCDate(d.getUTCDate() - (29 - i));
									const dateStr = d.toISOString().slice(0, 10);
									const active = streakData.recentDays.includes(dateStr);
									const isToday = i === 29;
									return (
										<div
											key={dateStr}
											title={dateStr}
											className={`h-3.5 w-3.5 rounded-sm transition-colors ${
												active
													? isToday
														? 'bg-accent ring-1 ring-accent/50'
														: 'bg-accent/70'
													: 'bg-surface-hover'
											}`}
										/>
									);
								})}
							</div>
							<div className="mt-2 flex items-center justify-between text-[10px] text-muted">
								<span>30 ngày trước</span>
								<span>Hôm nay</span>
							</div>
						</div>
					</section>
				)}

				{/* ─── Section: Tài khoản ─── */}
				{user && (
					<section className="mt-12">
						<div className="flex items-center gap-3">
							<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
								Tài khoản
							</h2>
							<div className="h-px flex-1 bg-border" />
						</div>

						<div className="mt-5 border border-border">
							<div className="flex items-center justify-between p-5">
								<div className="flex items-center gap-4">
									{user.image ? (
										<img
											src={user.image}
											alt={user.name ?? 'Avatar'}
											className="h-10 w-10 rounded-full"
											referrerPolicy="no-referrer"
										/>
									) : (
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-black text-background">
											{(user.name ?? 'U')[0]}
										</div>
									)}
									<div>
										<div className="text-sm font-bold text-foreground">{user.name ?? 'Người dùng'}</div>
										<div className="mt-0.5 text-[11px] text-muted">{user.email ?? '—'}</div>
									</div>
								</div>
								<span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
									{user.role === 'admin' ? 'Admin' : 'Học viên'}
								</span>
							</div>

							{/* Admin link */}
							{user.role === 'admin' && (
								<Link
									href="/admin"
									className="flex items-center justify-between border-t border-border p-5 transition-colors hover:bg-surface-hover"
								>
									<div className="flex items-center gap-3">
										<svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none">
											<circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" />
											<path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
										<span className="text-sm font-bold text-foreground">Quản trị hệ thống</span>
									</div>
									<svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
									</svg>
								</Link>
							)}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}

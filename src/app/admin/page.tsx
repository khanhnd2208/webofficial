import Link from 'next/link';

import { getAdminOverviewStats } from '@/services/adminDashboardService';

export const dynamic = 'force-dynamic';

function Stat({
	label,
	value,
	sub,
	accent,
}: {
	label: string;
	value: string | number;
	sub?: string;
	accent?: boolean;
}) {
	return (
		<div className="rounded-xl border border-border bg-surface p-5">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
			<p className={`mt-2 text-3xl font-black tracking-tight ${accent ? 'text-accent' : 'text-foreground'}`}>
				{value}
			</p>
			{sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
		</div>
	);
}

function QuickAction({
	href,
	label,
	description,
	icon,
	primary,
}: {
	href: string;
	label: string;
	description: string;
	icon: React.ReactNode;
	primary?: boolean;
}) {
	return (
		<Link
			href={href}
			className={`group flex items-start gap-4 rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
				primary
					? 'border-foreground bg-foreground text-background hover:bg-foreground/90'
					: 'border-border bg-surface hover:border-border-hover'
			}`}
		>
			<div
				className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
					primary ? 'bg-background/10' : 'bg-surface-hover'
				}`}
			>
				{icon}
			</div>
			<div className="min-w-0">
				<p className={`text-sm font-bold ${primary ? 'text-background' : 'text-foreground'}`}>{label}</p>
				<p className={`mt-0.5 text-xs leading-relaxed ${primary ? 'text-background/60' : 'text-muted'}`}>
					{description}
				</p>
			</div>
		</Link>
	);
}

export default async function AdminHomePage() {
	const stats = await getAdminOverviewStats();

	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
		<div className="space-y-10">
			{/* Header */}
			<div>
				<p className="text-xs font-bold uppercase tracking-widest text-muted">Quản trị</p>
				<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Tổng quan</h1>
			</div>

			{/* Stats grid */}
			<section>
				<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted/70">Số liệu</p>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					<Stat label="Bài đã đăng" value={stats.posts.published} />
					<Stat label="Bản nháp" value={stats.posts.drafts} />
					<Stat label="Tổng lượt xem" value={stats.posts.totalViews.toLocaleString('vi-VN')} />
					<Stat
						label="Tin nhắn mới"
						value={stats.messages.pending}
						sub={`${stats.messages.total} tổng`}
						accent={stats.messages.pending > 0}
					/>
					<Stat label="Học viên" value={stats.users.total} sub="đã đăng ký" />
				</div>
			</section>

			{/* Quick actions */}
			<section>
				<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted/70">Thao tác nhanh</p>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<QuickAction
						href="/admin/posts/create"
						label="Viết bài mới"
						description="Soạn và xuất bản bài viết blog."
						primary
						icon={
							<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-background">
								<path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
							</svg>
						}
					/>
					<QuickAction
						href="/admin/posts"
						label="Quản lý bài viết"
						description="Xem, sửa, publish, xoá bài."
						icon={
							<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-foreground-secondary">
								<path d="M4 4.5A1.5 1.5 0 015.5 3h9A1.5 1.5 0 0116 4.5v11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5V4.5z" stroke="currentColor" strokeWidth="1.4" />
								<path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
							</svg>
						}
					/>
					<QuickAction
						href="/admin/feedback/messages"
						label={`Hộp thư${stats.messages.pending > 0 ? ` (${stats.messages.pending} mới)` : ''}`}
						description="Đọc và trả lời phản hồi từ học viên."
						icon={
							<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-foreground-secondary">
								<path d="M2 4.5C2 3.67 2.67 3 3.5 3h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13C2.67 15 2 14.33 2 13.5v-9z" stroke="currentColor" strokeWidth="1.4" />
								<path d="M2 4.5l8 5.25L18 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
							</svg>
						}
					/>
					<QuickAction
						href="/admin/learning"
						label="Khoá học & Bài học"
						description="Quản lý Course → Unit → Lesson → Vocab."
						icon={
							<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-foreground-secondary">
								<path d="M10 2L2 6l8 4 8-4-8-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
								<path d="M2 10l8 4 8-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						}
					/>
					<QuickAction
						href="/blog"
						label="Xem Blog công khai"
						description="Mở trang blog như người dùng thấy."
						icon={
							<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-foreground-secondary">
								<path d="M11 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
								<path d="M15 2l3 3-7 7H8v-3l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						}
					/>
					<QuickAction
						href="/dashboard"
						label="Dashboard học viên"
						description="Xem giao diện dashboard như user."
						icon={
							<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-foreground-secondary">
								<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
								<rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
								<rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
								<rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
							</svg>
						}
					/>
				</div>
			</section>
		</div>
		</div>
	);
}

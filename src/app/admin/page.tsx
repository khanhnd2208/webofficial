import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getAdminOverviewStats } from '@/services/adminDashboardService';
import { routes } from '@/config/routes';

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
	primary,
}: {
	href: string;
	label: string;
	description: string;
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
			<div className="space-y-8">
				<AdminPageHeader
					eyebrow="Quản trị"
					title="Tổng quan"
					description="Luồng đang dùng: Website và Active Recall."
				/>

				<section>
					<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted/70">Số liệu</p>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						<Stat
							label="Inquiry mới"
							value={stats.website.newInquiries}
							accent
							sub="hộp thư Website"
						/>
						<Stat
							label="Bộ Active Recall"
							value={stats.activeRecall.decks}
							sub={`${stats.activeRecall.published} đang công khai`}
						/>
					</div>
				</section>

				<section>
					<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted/70">Thao tác nhanh</p>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<QuickAction
							href={routes.admin.activeRecall}
							label="Mở Active Recall"
							description="Tạo và xuất bản bộ thẻ hỏi–đáp."
							primary
						/>
						<QuickAction
							href={routes.admin.website}
							label="Website"
							description="Xem trang thương hiệu và hộp thư liên hệ."
						/>
						<QuickAction
							href={routes.admin.inquiries}
							label="Hộp thư liên hệ"
							description="Đọc lời nhắn gửi từ trang Liên hệ."
						/>
						<QuickAction
							href={routes.admin.activeRecallNew}
							label="Tạo bộ thẻ"
							description="Soạn bộ Active Recall mới."
						/>
					</div>
				</section>
			</div>
		</div>
	);
}

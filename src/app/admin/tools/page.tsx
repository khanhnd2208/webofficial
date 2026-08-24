import Link from 'next/link';

import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

const TOOLS = [
	{
		href: routes.admin.vocabulary,
		label: 'Vocabulary',
		description: 'Quản lý bộ từ vựng — chỉ dành cho admin.',
	},
	{
		href: routes.admin.luckyCard,
		label: 'Lucky Card',
		description: 'Tạo bộ thẻ may mắn — lật thẻ để xem nội dung bí ẩn.',
	},
	{
		href: routes.admin.activeRecall,
		label: 'Active Recall',
		description: 'Tạo và xuất bản bộ thẻ hỏi–đáp công khai.',
	},
	{
		href: routes.admin.messages,
		label: 'Lời nhắn',
		description: 'Tạo và quản lý lời nhắn; người nhận mở qua /m/[slug].',
	},
];

export default function ToolsPage() {
	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<div className="space-y-8">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Admin</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Công cụ</h1>
					<p className="mt-3 text-sm text-muted leading-relaxed max-w-xl">
						Công cụ mặc định chỉ dành cho admin. Chỉ đầu ra được thiết kế riêng mới công khai.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{TOOLS.map((tool) => (
						<Link
							key={tool.href}
							href={tool.href}
							className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-border-hover"
						>
							<div className="relative">
								<h3 className="text-lg font-black text-foreground">{tool.label}</h3>
								<p className="mt-1.5 text-sm text-muted leading-relaxed">{tool.description}</p>
								<div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-accent">
									<span>Mở tool</span>
									<svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none">
										<path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}

import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TOOLS = [
	{
		href: '/admin/tools/lucky-card',
		label: 'Lucky Card',
		description: 'Tạo bộ thẻ may mắn — lật thẻ để xem nội dung bí ẩn bên trong!',
		emoji: '🃏',
		gradient: 'from-amber-500 via-orange-500 to-rose-500',
	},
	{
		href: '/personality-test',
		label: 'Personality Test',
		description: 'Bài đánh giá tính cách kép — BFI-2-S (OCEAN) + Dark Triad (SD3). Phân tích sâu cho phát triển nghề nghiệp.',
		emoji: '🧠',
		gradient: 'from-indigo-500 via-purple-500 to-rose-500',
	},
];

export default function ToolsPage() {
	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<div className="space-y-8">
				{/* Header */}
				<div>
					<div className="flex items-center gap-3">
						<span className="text-3xl">✨</span>
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">Admin Tools</p>
							<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
								Magical Tools
							</h1>
						</div>
					</div>
					<p className="mt-3 text-sm text-muted leading-relaxed max-w-xl">
						Bộ sưu tập công cụ thú vị dành riêng cho admin — gamification, tạo tương tác, và nhiều hơn nữa.
					</p>
				</div>

				{/* Tools Grid */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{TOOLS.map((tool) => (
						<Link
							key={tool.href}
							href={tool.href}
							className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-border-hover"
						>
							{/* Gradient glow on hover */}
							<div
								className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.04]`}
							/>
							<div className="relative">
								<div className="text-4xl mb-3">{tool.emoji}</div>
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

					{/* Coming soon placeholder */}
					<div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-6 min-h-[180px]">
						<div className="text-center">
							<span className="text-2xl opacity-40">🔮</span>
							<p className="mt-2 text-xs font-bold text-muted/60">Sắp ra mắt...</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

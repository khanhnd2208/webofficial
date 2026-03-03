import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Game Hanoicam | Hanoicam',
	description: 'Các game thú vị mang hơi thở Hà Nội — chơi và tích điểm!',
};

const GAMES = [
	{
		href: '/games/suika',
		label: 'Rồng Thăng Long',
		description: 'Thả trái cây, ghép đôi để tạo ra Rồng Thăng Long huyền thoại! Physics siêu mượt, combo multiplier, hiệu ứng rung màn hình cực đã.',
		emoji: '🐉',
		gradient: 'from-red-500 via-orange-500 to-yellow-400',
		badge: 'Mới',
	},
];

export default function GamesPage() {
	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<div className="space-y-10">
				{/* Header */}
				<div className="text-center">
					<div className="inline-flex items-center justify-center gap-3 mb-4">
						<span className="text-4xl">🎮</span>
						<div className="text-left">
							<p className="text-xs font-bold uppercase tracking-widest text-muted">
								Game Hanoicam
							</p>
							<h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">
								Mini Games
							</h1>
						</div>
					</div>
					<p className="mt-2 text-sm text-muted leading-relaxed max-w-lg mx-auto">
						Bộ sưu tập mini game vui nhộn mang hơi thở Hà Nội — chơi, tích điểm, và chinh phục bảng xếp hạng!
					</p>
				</div>

				{/* Games Grid */}
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{GAMES.map((game) => (
						<Link
							key={game.href}
							href={game.href}
							className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border-hover"
						>
							{/* Gradient background glow */}
							<div
								className={`absolute inset-0 bg-linear-to-br ${game.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]`}
							/>							<div className="relative">
								{/* Badge */}
								{game.badge && (
									<span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent mb-3">
										{game.badge}
									</span>
								)}

								<div className="text-5xl mb-4">{game.emoji}</div>

								<h3 className="text-xl font-black text-foreground group-hover:text-accent transition-colors">
									{game.label}
								</h3>
								<p className="mt-2 text-sm text-muted leading-relaxed">{game.description}</p>

								<div className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
									Chơi ngay
									<svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
									</svg>
								</div>
							</div>
						</Link>
					))}

					{/* Coming soon placeholder */}
					<div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-surface/40 p-6 opacity-60">
						<div className="text-5xl mb-4">🏮</div>
						<h3 className="text-xl font-black text-foreground">Sắp ra mắt...</h3>
						<p className="mt-2 text-sm text-muted leading-relaxed">
							Thêm nhiều game mới đang được phát triển. Hãy quay lại sau nhé!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

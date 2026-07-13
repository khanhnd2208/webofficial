import Link from 'next/link';

import { routes } from '@/config/routes';

/**
 * Quiet footer — sunk wordmark, light links.
 * Teaching / learning omitted while those areas are temporarily closed.
 */
export default function SiteFooter() {
	return (
		<footer className="border-t border-hairline bg-canvas">
			<div className="shell flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-12">
				<p className="font-display text-sm tracking-[0.35em] text-ink-secondary/50">HANOICAM</p>
				<nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Chân trang">
					<Link
						href={routes.posts}
						className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
					>
						Bài viết
					</Link>
					<Link
						href="/#gioi-thieu"
						className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
					>
						Giới thiệu
					</Link>
				</nav>
			</div>
		</footer>
	);
}

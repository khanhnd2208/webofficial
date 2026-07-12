import Link from 'next/link';

import { routes } from '@/config/routes';

/**
 * Quiet footer — sunk wordmark, light links.
 * Homepage Closing Frame carries the manifesto; footer stays restrained.
 */
export default function SiteFooter() {
	return (
		<footer className="border-t border-hairline bg-canvas">
			<div className="shell flex flex-col gap-8 py-12 sm:flex-row sm:items-end sm:justify-between sm:py-16">
				<p className="font-display text-sm tracking-[0.35em] text-ink-secondary/50">HANOICAM</p>
				<nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Chân trang">
					<Link
						href={routes.posts}
						className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
					>
						Bài viết
					</Link>
					<Link
						href={routes.teaching}
						className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
					>
						Giảng dạy
					</Link>
					<Link
						href={routes.about}
						className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
					>
						Giới thiệu
					</Link>
				</nav>
			</div>
		</footer>
	);
}

import Link from 'next/link';

import SectionReveal from '@/components/motion/SectionReveal';
import { routes } from '@/config/routes';

/**
 * Hồi 5 — Closing Frame: short manifesto + two paths before quiet footer.
 */
export default function ClosingFrame() {
	return (
		<section className="border-t border-hairline">
			<div className="shell py-[var(--section-space)]">
				<SectionReveal className="max-w-2xl">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Kết</p>
					<p className="mt-4 font-display type-section font-medium text-ink">
						Viết để hiểu sâu.
						<br />
						Dạy để cùng tiến xa.
					</p>
					<p className="mt-5 max-w-md text-base leading-relaxed text-ink-secondary">
						Hai lối đi — chọn một và bắt đầu.
					</p>
					<div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
						<Link
							href={routes.posts}
							className="inline-flex min-h-11 items-center text-sm font-semibold text-vermilion transition-colors hover:text-accent-hover"
						>
							Đọc tiếp
						</Link>
						<Link
							href={routes.teaching}
							className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary transition-colors hover:text-ink"
						>
							Bắt đầu học
						</Link>
					</div>
				</SectionReveal>
			</div>
		</section>
	);
}

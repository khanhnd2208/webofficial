import Link from 'next/link';

import { getPublishedFooterGroups } from '@/config/navigation';
import { SITE_NAME } from '@/config/site';

/**
 * Footer — four IA groups, only published links.
 * Draft service/lab/policy routes stay hidden until content ships.
 */
export default function SiteFooter() {
	const groups = getPublishedFooterGroups();

	return (
		<footer className="border-t border-hairline bg-canvas">
			<div className="shell py-10 sm:py-12">
				<div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
					<p className="font-display text-sm tracking-[0.2em] text-ink-secondary/50">{SITE_NAME}</p>
					<nav
						className="grid flex-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10"
						aria-label="Chân trang"
					>
						{groups.map((group) => (
							<div key={group.id}>
								<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-secondary">
									{group.title}
								</p>
								<ul className="mt-3 space-y-2">
									{group.links.map((link) => (
										<li key={`${group.id}-${link.href}`}>
											<Link
												href={link.href}
												className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</nav>
				</div>
			</div>
		</footer>
	);
}

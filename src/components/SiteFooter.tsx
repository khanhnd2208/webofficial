import Link from 'next/link';

import { getPublishedFooterGroups } from '@/config/navigation';
import { SITE_DESCRIPTION, SITE_NAME, siteProfile } from '@/config/site';

/**
 * Compact footer — name, short description, real contact/social when present, utility links.
 */
export default function SiteFooter() {
	const groups = getPublishedFooterGroups();
	const email = siteProfile.contactEmail?.trim();
	const social = siteProfile.socialLinks?.filter((s) => s.href && s.label) ?? [];

	return (
		<footer className="border-t border-hairline bg-canvas">
			<div className="shell section-space-sm">
				<div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
					<div className="max-w-sm">
						<p className="font-display text-lg font-medium tracking-tight text-ink">{SITE_NAME}</p>
						<p className="mt-3 text-sm leading-relaxed text-ink-secondary">
							{siteProfile.shortBio || SITE_DESCRIPTION}
						</p>
						{(email || social.length > 0) && (
							<ul className="mt-5 space-y-2">
								{email ? (
									<li>
										<a
											href={`mailto:${email}`}
											className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-accent"
										>
											{email}
										</a>
									</li>
								) : null}
								{social.map((item) => (
									<li key={item.href}>
										<a
											href={item.href}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-accent"
										>
											{item.label}
										</a>
									</li>
								))}
							</ul>
						)}
					</div>
					<nav
						className="grid flex-1 gap-8 sm:grid-cols-2 lg:max-w-xl lg:gap-10"
						aria-label="Chân trang"
					>
						{groups.map((group) => (
							<div key={group.id}>
								<p className="text-sm font-medium text-ink">
									{group.title}
								</p>
								<ul className="mt-3 space-y-2">
									{group.links.map((link) => (
										<li key={`${group.id}-${link.href}`}>
											<Link
												href={link.href}
												className="text-sm text-ink-secondary transition-colors hover:text-ink"
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

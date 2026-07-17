import Link from 'next/link';

import ContactLink from '@/components/contact/ContactLink';
import { getPublishedFooterGroups } from '@/config/navigation';
import { routes } from '@/config/routes';
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
				<div className="flex flex-col gap-7 lg:flex-row lg:justify-between lg:gap-12">
					<div className="max-w-sm">
						<p className="font-display text-lg font-medium tracking-tight text-ink">{SITE_NAME}</p>
						<p className="mt-2.5 text-sm leading-relaxed text-ink-secondary">
							{siteProfile.shortBio || SITE_DESCRIPTION}
						</p>
						{(email || social.length > 0) && (
							<ul className="mt-4 space-y-1.5">
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
						className="grid flex-1 grid-cols-2 gap-4 sm:gap-6 lg:max-w-xl lg:gap-8"
						aria-label="Chân trang"
					>
						{groups.map((group) => (
							<div key={group.id}>
								<p className="text-sm font-medium text-ink">{group.title}</p>
								<ul className="mt-2.5 space-y-1.5">
									{group.links.map((link) => (
										<li key={`${group.id}-${link.href}`}>
											{link.href === routes.contact ? (
												<ContactLink
													href={link.href}
													contactContext={{ campaignParams: { ref: 'footer' } }}
													className="text-sm text-ink-secondary transition-colors hover:text-ink"
												>
													{link.label}
												</ContactLink>
											) : (
												<Link
													href={link.href}
													className="text-sm text-ink-secondary transition-colors hover:text-ink"
												>
													{link.label}
												</Link>
											)}
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

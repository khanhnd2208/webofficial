import Link from 'next/link';

import { getPublishedFooterGroups } from '@/config/navigation';
import { routes } from '@/config/routes';
import { SITE_NAME, SITE_POSITIONING, siteProfile } from '@/config/site';

export default function SiteFooter() {
	const email = siteProfile.contactEmail?.trim();
	const social = siteProfile.socialLinks?.filter((item) => item.href && item.label) ?? [];
	const footerLinks = getPublishedFooterGroups()[0]?.links.filter(
		(link) => link.href !== routes.home,
	) ?? [
		{ href: routes.about, label: 'Giới thiệu' },
		{ href: routes.experiences, label: 'Trải nghiệm' },
		{ href: routes.contact, label: 'Liên hệ' },
	];

	return (
		<footer className="border-t border-hairline bg-paper">
			<div className="shell py-16 sm:py-20">
				<div className="grid gap-12 md:grid-cols-12">
					<div className="md:col-span-5">
						<Link href={routes.home} className="font-display text-2xl font-medium text-ink">
							{SITE_NAME}
						</Link>
						<p className="mt-4 max-w-sm text-base leading-[1.7] text-ink-secondary">
							{SITE_POSITIONING}
						</p>
					</div>
					<nav
						className="grid grid-cols-2 gap-x-8 gap-y-4 md:col-span-3 md:col-start-7"
						aria-label="Chân trang"
					>
						{footerLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-base text-ink-secondary transition-colors hover:text-accent"
							>
								{link.label}
							</Link>
						))}
					</nav>
					{email || social.length > 0 ? (
						<div className="space-y-3 md:col-span-3">
							<p className="editorial-label">Kết nối</p>
							{email ? (
								<a
									href={`mailto:${email}`}
									className="block text-base text-ink-secondary hover:text-accent"
								>
									{email}
								</a>
							) : null}
							{social.map((item) => (
								<a
									key={item.href}
									href={item.href}
									target="_blank"
									rel="noopener noreferrer"
									className="block text-base text-ink-secondary hover:text-accent"
								>
									{item.label}
								</a>
							))}
						</div>
					) : null}
				</div>
				<p className="mt-14 border-t border-hairline pt-6 text-sm tracking-[0.02em] text-ink-secondary">
					© 2026 {SITE_NAME}.
				</p>
			</div>
		</footer>
	);
}

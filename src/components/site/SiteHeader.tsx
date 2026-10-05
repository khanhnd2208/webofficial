'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import QuickContactPanel from '@/components/contact/QuickContactPanel';
import SiteAuthChip from '@/components/site/SiteAuthChip';
import {
	CONTACT_CTA,
	getSiteTrail,
	isSiteHeaderPath,
	isTocPath,
	type SiteCrumb,
} from '@/config/navigation';
import { routes } from '@/config/routes';
import { SITE_NAME } from '@/config/site';

function useNarrowHeader(): boolean {
	const [narrow, setNarrow] = useState(false);
	useEffect(() => {
		const media = window.matchMedia('(max-width: 639px)');
		const sync = () => setNarrow(media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	}, []);
	return narrow;
}

function Crumb({ crumb, current }: { crumb: SiteCrumb; current: boolean }) {
	const className =
		'inline-flex min-h-11 max-w-[10rem] items-center truncate text-footnote sm:max-w-[16rem]';
	if (crumb.href && !current) {
		return (
			<Link
				href={crumb.href}
				className={`${className} text-ink-secondary transition-colors duration-(--dur-1) ease-(--ease-out) hover:text-ink`}
			>
				{crumb.label}
			</Link>
		);
	}
	return (
		<span aria-current={current ? 'page' : undefined} className={`${className} text-ink`}>
			{crumb.label}
		</span>
	);
}

/**
 * One sticky bar for public pages: wordmark, trail, one contact action, account.
 * Transparent at the top of the page; glass once the sentinel has scrolled away.
 * On Mục lục it floats over the painting.
 */
export default function SiteHeader() {
	const pathname = usePathname() || routes.home;
	const narrow = useNarrowHeader();
	const [panelOpen, setPanelOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const show = isSiteHeaderPath(pathname);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- close the panel when the page changes
		setPanelOpen(false);
	}, [pathname]);

	useEffect(() => {
		const sentinel = document.querySelector('[data-site-header-sentinel]');
		if (!sentinel) return;
		const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
			threshold: 1,
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [pathname, show]);

	if (!show) return null;

	const trail = getSiteTrail(pathname);
	const onToc = isTocPath(pathname);
	const showContact = pathname !== routes.contact;

	return (
		<>
			<div data-site-header-sentinel="" aria-hidden="true" className="h-2 w-full" />
			<header
				data-testid="site-header"
				data-scrolled={scrolled ? 'true' : 'false'}
				className={`${onToc ? 'fixed inset-x-0 top-0' : 'sticky top-0 -mt-2'} z-50 border-b pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] transition-[background-color,border-color,backdrop-filter] duration-(--dur-2) ease-(--ease-out) motion-reduce:transition-none ${
					scrolled
						? 'border-hairline bg-canvas/72 backdrop-blur-xl backdrop-saturate-150'
						: 'border-transparent bg-transparent'
				}`}
			>
				<div className="flex h-(--site-header-height) items-center justify-between gap-3">
					<nav aria-label="Đường dẫn" className="flex min-w-0 items-center gap-2">
						<Link
							href={routes.toc}
							data-testid="site-header-home"
							className="inline-flex min-h-11 shrink-0 items-center font-serif text-title-3 text-ink"
						>
							{SITE_NAME}
						</Link>
						<ol className="flex min-w-0 items-center">
							{trail.map((crumb, index) => {
								const last = index === trail.length - 1;
								return (
									<li
										key={`${crumb.label}-${index}`}
										className={`${last ? 'flex' : 'hidden sm:flex'} min-w-0 items-center gap-2`}
									>
										<span aria-hidden="true" className="text-footnote text-ink-secondary/40">
											/
										</span>
										<Crumb crumb={crumb} current={last && !crumb.href} />
									</li>
								);
							})}
						</ol>
					</nav>
					<div className="flex shrink-0 items-center gap-1 sm:gap-3">
						{showContact ? (
							<button
								type="button"
								data-testid="site-header-contact"
								className="inline-flex min-h-11 items-center px-2 text-subhead text-ink-secondary transition-colors duration-(--dur-1) ease-(--ease-out) hover:text-ink"
								onClick={() => setPanelOpen(true)}
							>
								{narrow ? 'Nhắn tin' : CONTACT_CTA.label}
							</button>
						) : null}
						<SiteAuthChip variant="bar" showSignIn={pathname !== routes.login} />
					</div>
				</div>
			</header>
			{showContact ? (
				<QuickContactPanel
					open={panelOpen}
					onClose={() => setPanelOpen(false)}
					sourcePage={pathname}
				/>
			) : null}
		</>
	);
}

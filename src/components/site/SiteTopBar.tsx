import BrandWordmark from './BrandWordmark';
import Link from 'next/link';

import { routes } from '@/config/routes';

import SiteAuthChip from './SiteAuthChip';

export type SiteCrumb = { label: string; href?: string };

/**
 * Wayfinding bar for pages outside the public book (account, Board Game): where you are, measured
 * from Mục lục, plus the account chip. Every area answers "how do I get back?" the same way.
 */
export default function SiteTopBar({
	crumbs,
	className = '',
	showSignIn = true,
}: {
	crumbs: SiteCrumb[];
	className?: string;
	/** Hide the redundant sign-in action on the login page itself. */
	showSignIn?: boolean;
}) {
	return (
		<header
			className={`grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-label tracking-[0.02em] ${className}`}
		>
			<Link
				href={routes.home}
				className="shrink-0 whitespace-nowrap font-display text-body font-semibold tracking-tight text-current transition-opacity duration-150 hover:opacity-70"
			>
				<BrandWordmark />
			</Link>
			<nav aria-label="Đường dẫn" className="flex min-w-0 items-center justify-center gap-1.5">
				<Link
					href={routes.toc}
					className="inline-flex min-h-10 shrink-0 items-center opacity-60 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100"
					data-testid="site-trail-toc"
				>
					Mục lục
				</Link>
				{crumbs.map((crumb) => (
					<span key={crumb.label} className="hidden min-w-0 items-center gap-1.5 sm:flex">
						<span aria-hidden="true" className="opacity-40">
							/
						</span>
						{crumb.href ? (
							<Link
								href={crumb.href}
								className="inline-flex min-h-10 items-center truncate opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
							>
								{crumb.label}
							</Link>
						) : (
							<span aria-current="page" className="truncate">
								{crumb.label}
							</span>
						)}
					</span>
				))}
			</nav>
			<div className="flex justify-end whitespace-nowrap">
				<SiteAuthChip variant="bar" showSignIn={showSignIn} />
			</div>
		</header>
	);
}

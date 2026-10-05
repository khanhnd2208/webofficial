import Link from 'next/link';

import type { SiteCrumb } from '@/config/navigation';
import { routes } from '@/config/routes';

import SiteAuthChip from './SiteAuthChip';

export type { SiteCrumb };

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
			className={`flex min-h-14 items-center justify-between gap-4 text-xs tracking-[0.14em] uppercase ${className}`}
		>
			<nav aria-label="Đường dẫn" className="flex min-w-0 items-center gap-2">
				<Link
					href={routes.toc}
					className="inline-flex min-h-10 shrink-0 items-center opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
					data-testid="site-trail-toc"
				>
					Mục lục
				</Link>
				{crumbs.map((crumb) => (
					<span key={crumb.label} className="flex min-w-0 items-center gap-2">
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
			<SiteAuthChip variant="bar" className="tracking-normal normal-case" showSignIn={showSignIn} />
		</header>
	);
}

import Link from 'next/link';
import type { ReactNode } from 'react';

import SiteAuthChip from '@/components/site/SiteAuthChip';
import { routes } from '@/config/routes';

import { LearnIcon } from './LearnIcon';

/** Top bar for the catalog and course overview (the player has its own focused bar). */
export default function LearnAppBar({
	crumbs = [],
	actions,
}: {
	crumbs?: Array<{ label: string; href?: string }>;
	actions?: ReactNode;
}) {
	return (
		<header className="ln-appbar">
			<div className="ln-appbar__inner">
				<Link href={routes.learnCourses} className="ln-appbar__brand">
					<span className="ln-appbar__logo">
						<LearnIcon name="book" size={17} />
					</span>
					<span>Khóa học</span>
				</Link>
				<nav aria-label="Đường dẫn" className="ln-appbar__crumbs">
					{crumbs.map((crumb) => (
						<span key={crumb.label} className="ln-appbar__crumb">
							<LearnIcon name="chevronRight" size={14} />
							{crumb.href ? (
								<Link href={crumb.href}>{crumb.label}</Link>
							) : (
								<span aria-current="page">{crumb.label}</span>
							)}
						</span>
					))}
				</nav>
				<div className="ln-appbar__actions">
					{actions}
					<Link href={routes.toc} className="ln-btn ln-btn--ghost ln-btn--sm">
						Mục lục
					</Link>
					<SiteAuthChip variant="bar" />
				</div>
			</div>
		</header>
	);
}

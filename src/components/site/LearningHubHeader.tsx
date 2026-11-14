import Link from 'next/link';
import type { ReactNode } from 'react';

import { routes } from '@/config/routes';

export type LearningHubTab = 'courses' | 'classes';

const TABS: Array<{ id: LearningHubTab; label: string; href: string }> = [
	{ id: 'courses', label: 'Khóa học', href: routes.learnCourses },
	{ id: 'classes', label: 'Lớp học', href: routes.classes },
];

/**
 * Top of the Học tập area. Khóa học and Lớp học live in different areas of the code, so each is
 * its own route; this shared header makes them read as two tabs of one page.
 */
export default function LearningHubHeader({
	active,
	title,
	lead,
	actions,
}: {
	active: LearningHubTab;
	title: string;
	lead?: ReactNode;
	/** Admin-only controls, shown at the end of the tab row. */
	actions?: ReactNode;
}) {
	return (
		<header data-testid="learning-hub-header">
			<h1 className="max-w-3xl font-display text-title-1 leading-tight tracking-tight">{title}</h1>
			{lead ? (
				<p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-secondary">{lead}</p>
			) : null}
			<div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-hairline">
				<nav aria-label="Học tập" className="-mb-px flex gap-6">
					{TABS.map((tab) => {
						const current = tab.id === active;
						return (
							<Link
								key={tab.id}
								href={tab.href}
								aria-current={current ? 'page' : undefined}
								data-testid={`learning-tab-${tab.id}`}
								className={`inline-flex min-h-11 items-center border-b-2 text-subhead font-medium transition-colors duration-(--dur-1) ease-(--ease-out) ${
									current
										? 'border-ink text-ink'
										: 'border-transparent text-ink-secondary hover:text-ink'
								}`}
							>
								{tab.label}
							</Link>
						);
					})}
				</nav>
				{actions ? <div className="flex flex-wrap items-center gap-2 pb-2">{actions}</div> : null}
			</div>
		</header>
	);
}

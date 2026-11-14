'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import {
	RECENT_CLASSES_KEY,
	type RecentClass,
	readRecentClasses,
	withRecentClass,
} from '@/lib/recentClasses';

function load(): RecentClass[] {
	try {
		return readRecentClasses(window.localStorage.getItem(RECENT_CLASSES_KEY));
	} catch {
		return [];
	}
}

/** Remembers this class page on the device so /lop can offer it again. Renders nothing. */
export function RememberClassVisit({ slug, title, code }: Omit<RecentClass, 'visitedAt'>) {
	useEffect(() => {
		try {
			const next = withRecentClass(load(), { slug, title, code, visitedAt: Date.now() });
			window.localStorage.setItem(RECENT_CLASSES_KEY, JSON.stringify(next));
		} catch {
			// Private mode or blocked storage: the class link itself still works.
		}
	}, [slug, title, code]);
	return null;
}

/**
 * "Lớp bạn đã mở": class pages opened before on this device, as a list. Shows `empty` once the
 * browser has been checked and there are none.
 */
export default function RecentClasses({
	className = '',
	empty = null,
}: {
	className?: string;
	empty?: ReactNode;
}) {
	const [classes, setClasses] = useState<RecentClass[] | null>(null);
	useEffect(() => {
		// Storage only exists in the browser, so the list appears after hydration.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setClasses(load());
	}, []);
	if (classes === null) return null;
	if (!classes.length) return <>{empty}</>;
	return (
		<section
			aria-labelledby="recent-classes-title"
			className={className}
			data-testid="recent-classes"
		>
			<h2 id="recent-classes-title" className="editorial-label">
				Lớp bạn đã mở
			</h2>
			<ul className="mt-3 border-t border-hairline">
				{classes.map((entry) => (
					<li key={entry.slug} className="border-b border-hairline">
						<Link
							href={routes.teachingPublicClass(entry.slug)}
							className="group flex min-h-14 items-center gap-4 py-3 text-ink transition-colors duration-(--dur-1) ease-(--ease-out) hover:text-accent focus-visible:text-accent focus-visible:outline-none"
						>
							<span className="w-24 shrink-0 text-footnote tabular-nums text-ink-secondary">
								{entry.code}
							</span>
							<span className="min-w-0 flex-1 truncate font-display text-title-3">
								{entry.title}
							</span>
							<span aria-hidden="true" className="text-ink-secondary group-hover:text-accent">
								→
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

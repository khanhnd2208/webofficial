'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

/** Remembers this class page on the device so Mục lục can offer it again. Renders nothing. */
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

/** "Lớp của bạn" shortcuts to class pages opened before on this device; hidden when none. */
export default function RecentClasses({ className = '' }: { className?: string }) {
	const [classes, setClasses] = useState<RecentClass[]>([]);
	useEffect(() => {
		// Storage only exists in the browser, so the list appears after hydration.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setClasses(load());
	}, []);
	if (!classes.length) return null;
	return (
		<section aria-label="Lớp bạn đã mở" className={className} data-testid="recent-classes">
			<p className="text-[0.6875rem] tracking-[0.16em] text-ink/55 uppercase">Lớp bạn đã mở</p>
			<ul className="mt-2 flex flex-wrap gap-2">
				{classes.map((entry) => (
					<li key={entry.slug}>
						<Link
							href={routes.teachingPublicClass(entry.slug)}
							className="inline-flex min-h-10 max-w-[22rem] items-center gap-2 rounded-full border border-hairline bg-canvas/80 px-4 text-sm text-ink transition-colors hover:border-ink/30 hover:bg-paper"
						>
							<span className="font-mono text-xs text-ink-secondary">{entry.code}</span>
							<span className="truncate">{entry.title}</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

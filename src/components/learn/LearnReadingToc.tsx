'use client';

import { useEffect, useState } from 'react';

import type { ReadingHeading } from '@/features/learn/outline';

/**
 * "Trong mục này" as a rail beside the article on wide screens. It marks the heading the
 * reader is in, like the on-page navigation of MDN or Stripe Docs.
 */
export default function LearnReadingToc({ headings }: { headings: ReadingHeading[] }) {
	const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

	useEffect(() => {
		const targets = headings
			.map((heading) => document.getElementById(heading.id))
			.filter((node): node is HTMLElement => Boolean(node));
		if (!targets.length) return;
		const update = () => {
			const offset = window.innerHeight * 0.25;
			let current = targets[0].id;
			for (const target of targets) {
				if (target.getBoundingClientRect().top - offset <= 0) current = target.id;
				else break;
			}
			setActiveId(current);
		};
		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	}, [headings]);

	return (
		<nav className="ln-rail" aria-label="Trong mục này">
			<p className="ln-rail__label">Trong mục này</p>
			<ol>
				{headings.map((heading) => (
					<li key={heading.id} data-level={heading.level}>
						<a
							href={`#${heading.id}`}
							aria-current={heading.id === activeId ? 'location' : undefined}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}

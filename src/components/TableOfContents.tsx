'use client';

import { useEffect, useState } from 'react';

interface Heading {
	id: string;
	text: string;
	level: number;
}

interface TableOfContentsProps {
	headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
	const [activeId, setActiveId] = useState('');

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				// Find the first intersecting heading
				const visible = entries.filter((e) => e.isIntersecting);
				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{ rootMargin: '-80px 0px -70% 0px', threshold: 0 }
		);

		const elements = headings
			.map((h) => document.getElementById(h.id))
			.filter(Boolean) as HTMLElement[];

		elements.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [headings]);

	if (headings.length === 0) return null;

	return (
		<nav className="sticky top-24" aria-label="Table of contents">
			<p className="text-[10px] font-bold uppercase tracking-widest text-muted">
				Mục lục
			</p>
			<ul className="mt-3 space-y-1.5 border-l border-border">
				{headings.map((h) => (
					<li key={h.id}>
						<a
							href={`#${h.id}`}
							onClick={(e) => {
								e.preventDefault();
								const el = document.getElementById(h.id);
								if (el) {
									el.scrollIntoView({ behavior: 'smooth', block: 'start' });
									setActiveId(h.id);
								}
							}}
							className={`block border-l-2 py-0.5 text-xs leading-relaxed transition-all ${
								h.level === 1 ? 'pl-3' : h.level === 2 ? 'pl-5' : 'pl-7'
							} ${
								activeId === h.id
									? 'border-accent font-bold text-accent'
									: 'border-transparent text-muted hover:border-border-hover hover:text-foreground-secondary'
							}`}
						>
							{h.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}

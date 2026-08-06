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

function TocList({
	headings,
	activeId,
	setActiveId,
}: {
	headings: Heading[];
	activeId: string;
	setActiveId: (id: string) => void;
}) {
	return (
		<ul className="mt-3 space-y-1.5 border-l border-hairline">
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
						className={`block border-l-2 py-1 text-xs leading-relaxed transition-colors duration-200 ${
							h.level === 1 ? 'pl-3' : h.level === 2 ? 'pl-5' : 'pl-7'
						} ${
							activeId === h.id
								? 'border-vermilion font-semibold text-vermilion'
								: 'border-transparent text-ink-secondary hover:border-hairline hover:text-ink'
						}`}
					>
						{h.text}
					</a>
				</li>
			))}
		</ul>
	);
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
	const [activeId, setActiveId] = useState('');
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((e) => e.isIntersecting);
				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{ rootMargin: '-80px 0px -70% 0px', threshold: 0 },
		);

		const elements = headings
			.map((h) => document.getElementById(h.id))
			.filter(Boolean) as HTMLElement[];

		elements.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [headings]);

	if (headings.length === 0) return null;

	return (
		<>
			<details
				className="mb-8 rounded-[10px] border border-hairline bg-paper lg:hidden"
				open={open}
				onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
			>
				<summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink">
					Trong bài này
				</summary>
				<div className="border-t border-hairline px-4 pb-4">
					<TocList headings={headings} activeId={activeId} setActiveId={setActiveId} />
				</div>
			</details>

			<nav className="sticky top-24 hidden lg:block" aria-label="Mục lục">
				<p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-secondary">
					Trong bài này
				</p>
				<TocList headings={headings} activeId={activeId} setActiveId={setActiveId} />
			</nav>
		</>
	);
}

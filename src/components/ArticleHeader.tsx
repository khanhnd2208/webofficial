'use client';

import type { ReactNode } from 'react';
import { m } from 'framer-motion';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease, stagger } from '@/components/motion/tokens';
import { displayCategoryLabel } from '@/features/posts/publicAdapter';

type ArticleHeaderProps = {
	chapterNumber?: string | number | null;
	category?: string | null;
	title: string;
	summary: string;
	meta: ReactNode;
};

/**
 * Three-beat header: category → title → summary/meta.
 * Motion is enhancement only; content is always in the DOM and readable.
 */
export default function ArticleHeader({
	chapterNumber,
	category,
	title,
	summary,
	meta,
}: ArticleHeaderProps) {
	const { allowsReveal, reduced } = useMotionTier();
	const animate = allowsReveal && !reduced;
	const categoryLabel = displayCategoryLabel(category);

	const beat = (delay: number) =>
		animate
			? {
					initial: { opacity: 0.88, y: 10 },
					animate: { opacity: 1, y: 0 },
					transition: { duration: duration.section, ease: ease.reveal, delay },
				}
			: {};

	return (
		<header className="shell max-w-3xl pt-10 sm:pt-16 lg:max-w-4xl">
			<m.div {...beat(0)}>
				<div className="flex flex-wrap items-center gap-2">
					{chapterNumber ? (
						<span className="font-mono text-xs font-semibold uppercase tracking-widest text-vermilion">
							Chương {chapterNumber}
						</span>
					) : null}
					{categoryLabel ? (
						<>
							{chapterNumber ? <span className="text-hairline">·</span> : null}
							<span className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">
								{categoryLabel}
							</span>
						</>
					) : null}
				</div>
			</m.div>

			<m.h1
				className="mt-4 font-display text-[clamp(2rem,5vw,3.75rem)] font-medium leading-[1.1] tracking-tight text-ink"
				{...beat(stagger.default)}
			>
				{title}
			</m.h1>

			<m.div {...beat(stagger.default * 2)}>
				{summary ? (
					<p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-ink-secondary">{summary}</p>
				) : null}
				<div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-xs text-ink-secondary sm:gap-3">
					{meta}
				</div>
			</m.div>
		</header>
	);
}

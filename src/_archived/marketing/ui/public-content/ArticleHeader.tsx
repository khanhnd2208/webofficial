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
		<header className="shell max-w-2xl pt-8 sm:pt-12">
			<m.div {...beat(0)}>
				<div className="flex flex-wrap items-center gap-2">
					{chapterNumber ? (
						<span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
							Chương {chapterNumber}
						</span>
					) : null}
					{categoryLabel ? (
						<>
							{chapterNumber ? <span className="text-hairline">·</span> : null}
							<span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
								{categoryLabel}
							</span>
						</>
					) : null}
				</div>
			</m.div>

			<m.h1
				className="mt-3 font-display type-page-title font-medium text-ink"
				{...beat(stagger.default)}
			>
				{title}
			</m.h1>

			<m.div {...beat(stagger.default * 2)}>
				{summary ? (
					<p className="type-lead mt-4 max-w-[68ch] text-ink-secondary">{summary}</p>
				) : null}
				<div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-ink-secondary sm:gap-3">
					{meta}
				</div>
			</m.div>
		</header>
	);
}

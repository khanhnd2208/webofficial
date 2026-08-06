'use client';

import type { ReactNode } from 'react';
import { m } from 'framer-motion';

import { useMotionTier } from './MotionProvider';
import { duration, ease, heroTimeline } from './tokens';

type MaskTextProps = {
	children: ReactNode;
	as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
	className?: string;
	delay?: number;
	id?: string;
};

/**
 * Semantic text always present and readable.
 * Visual line mask is aria-hidden enhancement only (full/lite reveal tiers).
 */
export default function MaskText({
	children,
	as = 'p',
	className,
	delay = heroTimeline.wordmark,
	id,
}: MaskTextProps) {
	const { allowsReveal, reduced } = useMotionTier();

	const Tag = as;

	if (!allowsReveal || reduced) {
		return (
			<Tag id={id} className={className}>
				{children}
			</Tag>
		);
	}

	return (
		<Tag id={id} className={className}>
			<span className="sr-only">{children}</span>
			<span className="block overflow-hidden" aria-hidden>
				<m.span
					className="block"
					initial={{ y: '100%', opacity: 0.9 }}
					animate={{ y: '0%', opacity: 1 }}
					transition={{ duration: duration.textMask, ease: ease.reveal, delay }}
				>
					{children}
				</m.span>
			</span>
		</Tag>
	);
}

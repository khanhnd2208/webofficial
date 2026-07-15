import type { ReactNode } from 'react';

type SectionHeadingProps = {
	eyebrow?: string;
	title: string;
	description?: string;
	align?: 'left' | 'center';
	children?: ReactNode;
};

/**
 * Shared marketing section heading — hairline editorial, not card chrome.
 */
export function SectionHeading({
	eyebrow,
	title,
	description,
	align = 'left',
	children,
}: SectionHeadingProps) {
	const alignment = align === 'center' ? 'mx-auto text-center' : '';

	return (
		<header className={`max-w-2xl ${alignment}`}>
			{eyebrow ? (
				<p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-secondary">{eyebrow}</p>
			) : null}
			<h2 className={`font-display type-section font-medium text-ink ${eyebrow ? 'mt-3' : ''}`}>
				{title}
			</h2>
			{description ? (
				<p className="mt-4 text-base leading-relaxed text-ink-secondary">{description}</p>
			) : null}
			{children}
		</header>
	);
}

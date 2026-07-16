import type { ReactNode } from 'react';

type SectionHeadingProps = {
	id?: string;
	eyebrow?: string;
	title: string;
	description?: string;
	align?: 'left' | 'center';
	level?: 2 | 3;
	variant?: 'major' | 'compact';
	children?: ReactNode;
};

/**
 * Shared marketing section heading — hairline editorial, not card chrome.
 */
export function SectionHeading({
	id,
	eyebrow,
	title,
	description,
	align = 'left',
	level = 2,
	variant = 'major',
	children,
}: SectionHeadingProps) {
	const alignment = align === 'center' ? 'mx-auto text-center' : '';
	const descriptionAlignment = align === 'center' ? 'mx-auto' : '';
	const Heading = level === 3 ? 'h3' : 'h2';
	const headingStyle =
		variant === 'compact'
			? 'font-sans text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl'
			: 'font-display type-section font-medium';

	return (
		<header className={`${variant === 'major' ? 'max-w-3xl' : 'max-w-2xl'} ${alignment}`}>
			{eyebrow ? (
				<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
					{eyebrow}
				</p>
			) : null}
			<Heading id={id} className={`${headingStyle} text-ink ${eyebrow ? 'mt-3' : ''}`}>
				{title}
			</Heading>
			{description ? (
				<p
					className={`mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary sm:text-[1.0625rem] ${descriptionAlignment}`}
				>
					{description}
				</p>
			) : null}
			{children}
		</header>
	);
}

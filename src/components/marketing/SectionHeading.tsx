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
			? 'font-sans text-base font-semibold leading-snug tracking-[-0.01em] sm:text-lg'
			: 'font-display type-section font-medium';

	return (
		<header className={`${variant === 'major' ? 'max-w-2xl' : 'max-w-xl'} ${alignment}`}>
			{eyebrow ? <p className="editorial-label">{eyebrow}</p> : null}
			<Heading id={id} className={`${headingStyle} text-ink ${eyebrow ? 'mt-2.5' : ''}`}>
				{title}
			</Heading>
			{description ? (
				<p className={`premium-lead mt-3 max-w-xl ${descriptionAlignment}`}>{description}</p>
			) : null}
			{children}
		</header>
	);
}

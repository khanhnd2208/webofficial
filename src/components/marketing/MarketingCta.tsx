import Link from 'next/link';
import type { ReactNode } from 'react';

type MarketingCtaProps = {
	href: string;
	children: ReactNode;
	variant?: 'primary' | 'secondary' | 'text';
	className?: string;
};

const variantClass = {
	primary:
		'inline-flex min-h-11 items-center rounded-[4px] bg-ink px-5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors duration-200 hover:bg-ink/90',
	secondary:
		'inline-flex min-h-11 items-center rounded-[4px] border border-hairline px-5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors duration-200 hover:border-ink',
	text: 'inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink',
} as const;

/**
 * Marketing CTA — square corners, ink/accent system. Prefer over generic Button pills.
 */
export function MarketingCta({
	href,
	children,
	variant = 'primary',
	className = '',
}: MarketingCtaProps) {
	return (
		<Link href={href} className={`${variantClass[variant]} ${className}`}>
			{children}
		</Link>
	);
}

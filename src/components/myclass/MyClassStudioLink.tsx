import type { ReactNode } from 'react';
import Link from 'next/link';
import { McIcon } from '@/components/myclass/ui';

type StudioLinkVariant = 'solid' | 'outline' | 'quiet' | 'inverse';

const variantClass: Record<StudioLinkVariant, string> = {
	solid: 'bg-ink text-paper hover:bg-inverse-surface',
	outline: 'border border-mc-rule bg-paper text-ink hover:bg-surface-sunken',
	quiet: 'border border-mc-rule bg-transparent text-ink-secondary hover:bg-surface-sunken hover:text-ink',
	inverse:
		'border border-paper/20 bg-paper/10 text-paper hover:bg-paper/18 focus-visible:ring-offset-ink',
};

export default function MyClassStudioLink({
	href,
	children,
	variant = 'outline',
	className = '',
	'aria-label': ariaLabel,
}: {
	href: string;
	children: ReactNode;
	variant?: StudioLinkVariant;
	className?: string;
	'aria-label'?: string;
}) {
	return (
		<Link
			href={href}
			aria-label={ariaLabel}
			className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--mc-r-sm)] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${variantClass[variant]} ${className}`}
		>
			<McIcon name="edit" size={16} />
			{children}
		</Link>
	);
}

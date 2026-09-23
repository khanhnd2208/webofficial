'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { routes } from '@/config/routes';

type SiteAuthChipProps = {
	variant?: 'chrome' | 'intro' | 'introMobile';
	className?: string;
};

const variantClass = {
	chrome:
		'text-[0.6875rem] tracking-[0.16em] text-ink/55 hover:text-ink focus-visible:text-ink',
	intro:
		'font-display text-sm tracking-[0.2em] text-ink/70 hover:text-ink focus-visible:text-ink',
	introMobile:
		'font-mono text-[0.8125rem] tracking-[0.18em] text-ink-secondary hover:text-ink focus-visible:text-ink',
} as const;

export default function SiteAuthChip({ variant = 'chrome', className = '' }: SiteAuthChipProps) {
	const pathname = usePathname();
	const { data: session } = useSession();

	const signedIn = Boolean(session?.user);
	const isAdmin = session?.user?.role === 'admin';
	const href = !signedIn
		? `${routes.login}?from=${encodeURIComponent(pathname || '/')}`
		: isAdmin
			? routes.mySpaceTeaching
			: routes.account;
	const label = !signedIn ? 'Đăng nhập' : isAdmin ? 'Teaching' : 'Tài khoản';

	return (
		<Link
			href={href}
			data-testid="site-auth-chip"
			className={`inline-flex min-h-10 items-center transition-colors duration-300 focus-visible:outline-none ${variantClass[variant]} ${className}`}
		>
			{label}
		</Link>
	);
}

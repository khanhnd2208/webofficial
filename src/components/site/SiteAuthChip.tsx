'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useId, useRef, useState } from 'react';

import { afterSignOutPath } from '@/config/navigation';
import { routes } from '@/config/routes';
import { signOutTo } from '@/lib/auth/signOutTo';
import { inAppBrowserName } from '@/lib/auth/inAppBrowser';
import { rememberReturnPosition } from '@/lib/auth/returnPosition';
import { startGoogleSignIn } from '@/lib/auth/startGoogleSignIn';

type SiteAuthChipProps = {
	/**
	 * `bar` sits inside an app header (courses, games, account), `badge` is the narrow form for
	 * game rooms; the others float on public pages.
	 */
	variant?: 'chrome' | 'intro' | 'introMobile' | 'bar' | 'badge';
	className?: string;
	/** False inside a game room: signing in there is never needed, so only show who is signed in. */
	showSignIn?: boolean;
};

const variantClass = {
	chrome: 'text-caption tracking-[0.08em] text-ink-secondary hover:text-ink focus-visible:text-ink',
	intro:
		'font-display text-subhead tracking-[0.08em] text-ink/70 hover:text-ink focus-visible:text-ink',
	introMobile:
		'text-footnote tracking-[0.08em] text-ink-secondary hover:text-ink focus-visible:text-ink',
	bar: 'text-subhead whitespace-nowrap text-current opacity-80 hover:opacity-100 focus-visible:opacity-100',
	badge:
		'text-caption whitespace-nowrap text-current opacity-80 hover:opacity-100 focus-visible:opacity-100',
} as const;

/** Vietnamese names end with the given name: "Nguyễn Duy Khánh" → "Khánh". */
function shortName(name: string | null | undefined, email: string | null | undefined): string {
	const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
	if (words.length) return words[words.length - 1]!;
	return (email ?? 'Tài khoản').split('@')[0]!;
}

function currentLocation(pathname: string): string {
	if (typeof window === 'undefined') return pathname || routes.home;
	return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * The one sign-in indicator on the site. Signed out it starts Google sign-in and returns here;
 * signed in it names the account, marks admins, and opens a menu with the places an account
 * unlocks and "Đăng xuất".
 */
export default function SiteAuthChip({
	variant = 'chrome',
	className = '',
	showSignIn = true,
}: SiteAuthChipProps) {
	const pathname = usePathname() || routes.home;
	const { data: session, status } = useSession();
	const router = useRouter();
	const [signingIn, setSigningIn] = useState(false);
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const panelId = useId();

	useEffect(() => {
		if (!open) return;
		function onPointer(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		}
		function onKey(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			setOpen(false);
			buttonRef.current?.focus();
		}
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- close on pathname change
		setOpen(false);
	}, [pathname]);

	useEffect(() => {
		const reset = (event: PageTransitionEvent) => {
			if (event.persisted) setSigningIn(false);
		};
		window.addEventListener('pageshow', reset);
		return () => window.removeEventListener('pageshow', reset);
	}, []);

	async function handleSignIn() {
		const destination = currentLocation(pathname);
		const loginHref = `${routes.login}?from=${encodeURIComponent(destination)}`;
		try {
			rememberReturnPosition(window.sessionStorage, {
				path: `${window.location.pathname}${window.location.search}`,
				y: Math.round(window.scrollY),
			});
		} catch {
			// Blocked storage still permits sign-in and a return to the page.
		}
		if (inAppBrowserName(navigator.userAgent)) {
			router.push(loginHref);
			return;
		}
		setSigningIn(true);
		try {
			await startGoogleSignIn(destination);
		} catch {
			setSigningIn(false);
			router.push(loginHref);
		}
	}

	const base = `inline-flex min-h-11 items-center whitespace-nowrap transition-colors duration-(--dur-2) ease-(--ease-out) focus-visible:outline-none ${variantClass[variant]} ${className}`;

	if (status === 'loading') {
		// Hold the space without flashing "Đăng nhập" at someone who is signed in.
		return <span aria-hidden="true" className={`${base} invisible`} data-auth-state="loading" />;
	}

	if (!session?.user) {
		if (!showSignIn) return null;
		return (
			<button
				type="button"
				disabled={signingIn}
				onClick={() => void handleSignIn()}
				data-testid="site-auth-chip"
				data-auth-state="signed-out"
				className={`${base} disabled:cursor-wait`}
			>
				{signingIn ? 'Đang mở Google…' : 'Đăng nhập'}
			</button>
		);
	}

	const isAdmin = session.user.role === 'admin';
	const name = shortName(session.user.name, session.user.email);
	const items: Array<{ href: string; label: string }> = [
		...(isAdmin
			? [
					{ href: routes.mySpaceTeaching, label: 'Lớp học' },
					{ href: routes.admin.home, label: 'Quản trị' },
				]
			: []),
		{ href: '/my-space/courses', label: 'Khóa học của tôi' },
		{ href: routes.account, label: 'Tài khoản' },
	];

	return (
		<div
			ref={rootRef}
			className="relative"
			onBlur={(event) => {
				// Tabbing past the last link closes the panel, like any disclosure.
				if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
			}}
		>
			<button
				ref={buttonRef}
				type="button"
				data-testid="site-auth-chip"
				data-auth-state={isAdmin ? 'admin' : 'signed-in'}
				aria-expanded={open}
				aria-controls={panelId}
				aria-label={`Tài khoản ${session.user.name ?? name}${isAdmin ? ' (admin)' : ''}`}
				onClick={() => setOpen((value) => !value)}
				className={`${base} gap-2`}
			>
				<span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
				{variant === 'badge' && isAdmin ? null : (
					<span
						className={`truncate tracking-normal normal-case ${variant === 'badge' ? 'max-w-[4.5rem]' : 'max-w-[9rem]'}`}
					>
						{name}
					</span>
				)}
				{isAdmin ? (
					<span className="rounded-full border border-current px-1.5 py-px text-caption leading-none tracking-[0.08em] uppercase">
						Admin
					</span>
				) : null}
				<span aria-hidden="true" className="text-caption">
					▾
				</span>
			</button>

			{open ? (
				<div
					id={panelId}
					aria-label="Tài khoản"
					role="group"
					className="absolute top-full right-0 z-[60] mt-2 w-60 overflow-hidden rounded-lg border border-hairline bg-canvas text-left text-subhead tracking-normal text-ink normal-case shadow-lg"
				>
					<div className="border-b border-hairline px-4 py-3">
						<p className="truncate font-medium">{session.user.name ?? name}</p>
						<p className="truncate text-caption text-ink-secondary">{session.user.email}</p>
						<p className="mt-1 text-caption text-ink-secondary">
							{isAdmin ? 'Đang đăng nhập với quyền admin' : 'Đang đăng nhập'}
						</p>
					</div>
					<ul className="py-1">
						{items.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="block px-4 py-2.5 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
								>
									{item.label}
								</Link>
							</li>
						))}
						<li className="border-t border-hairline">
							<button
								type="button"
								data-testid="site-sign-out"
								onClick={() => void signOutTo(afterSignOutPath(currentLocation(pathname)))}
								className="block w-full px-4 py-2.5 text-left hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
							>
								Đăng xuất
							</button>
						</li>
					</ul>
				</div>
			) : null}
		</div>
	);
}

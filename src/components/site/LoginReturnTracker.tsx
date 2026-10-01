'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { routes } from '@/config/routes';
import {
	loginHrefFrom,
	rememberReturnPosition,
	takeReturnPosition,
} from '@/lib/auth/returnPosition';

/** Give late content (images, client data) this long to grow before scrolling back. */
const RESTORE_WINDOW_MS = 2000;

function pathWithQuery(): string {
	return `${window.location.pathname}${window.location.search}`;
}

function loginAnchor(target: EventTarget | null): HTMLAnchorElement | null {
	const anchor = target instanceof Element ? target.closest('a[href]') : null;
	if (!(anchor instanceof HTMLAnchorElement)) return null;
	const url = new URL(anchor.href, window.location.href);
	if (url.origin !== window.location.origin || url.pathname !== routes.login) return null;
	return anchor;
}

function isPlainClick(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return false;
	}
	return !anchor.target || anchor.target === '_self';
}

function scrollBackTo(y: number) {
	const started = performance.now();
	const step = () => {
		const reachable = document.documentElement.scrollHeight - window.innerHeight >= y;
		if (reachable || performance.now() - started > RESTORE_WINDOW_MS) {
			window.scrollTo({ top: y, behavior: 'instant' });
			return;
		}
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
}

/**
 * One rule for every "Đăng nhập" link on the site: after signing in, the person lands on the page
 * (query and #section included) and scroll position where they pressed it. Links keep their
 * server-rendered `from` as a fallback; this replaces it with the live location on click.
 */
export default function LoginReturnTracker() {
	const router = useRouter();
	const pathname = usePathname();
	const { status } = useSession();

	useEffect(() => {
		if (status !== 'authenticated') return;
		let y: number | null = null;
		try {
			y = takeReturnPosition(window.sessionStorage, pathWithQuery());
		} catch {
			return;
		}
		if (y !== null && y > 0) scrollBackTo(y);
	}, [status, pathname]);

	useEffect(() => {
		function onClick(event: MouseEvent) {
			if (event.defaultPrevented || window.location.pathname === routes.login) return;
			const anchor = loginAnchor(event.target);
			if (!anchor) return;

			const { pathname: path, search, hash } = window.location;
			const href = loginHrefFrom(routes.login, `${path}${search}${hash}`);
			try {
				rememberReturnPosition(window.sessionStorage, {
					path: `${path}${search}`,
					y: Math.round(window.scrollY),
				});
			} catch {
				// Storage unavailable: the page still returns, just at the top.
			}
			// New tabs and copied links use the attribute; plain clicks navigate here.
			anchor.setAttribute('href', href);
			if (!isPlainClick(event, anchor)) return;
			event.preventDefault();
			router.push(href);
		}

		document.addEventListener('click', onClick, true);
		return () => document.removeEventListener('click', onClick, true);
	}, [router]);

	return null;
}

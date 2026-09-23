'use client';

import { useEffect } from 'react';

const VERSION_URL = '/api/health/version';
const MIN_CHECK_GAP_MS = 60_000;
const POLL_MS = 10 * 60_000;

function isEditing() {
	const el = document.activeElement;
	if (!(el instanceof HTMLElement)) return false;
	return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/**
 * Next.js only hard-reloads on version skew during client navigation. Tabs that
 * stay open (phones resuming a tab, bfcache restores) keep the old bundle, so
 * learners miss new features until they clear cache. Compare the page's
 * `data-dpl-id` with the live release and reload when they differ.
 */
export default function DeploymentRefresh() {
	useEffect(() => {
		const loaded = document.documentElement.dataset.dplId;
		if (!loaded) return;

		let lastCheck = 0;
		let pendingReload = false;

		const reloadWhenSafe = () => {
			if (document.visibilityState === 'hidden' || isEditing()) {
				pendingReload = true;
				return;
			}
			window.location.reload();
		};

		const check = async (force = false) => {
			if (pendingReload) return reloadWhenSafe();
			const now = Date.now();
			if (!force && now - lastCheck < MIN_CHECK_GAP_MS) return;
			lastCheck = now;
			try {
				const res = await fetch(VERSION_URL, { cache: 'no-store' });
				if (!res.ok) return;
				const body = (await res.json()) as { data?: { deploymentId?: string | null } };
				const live = body.data?.deploymentId;
				if (live && live !== loaded) reloadWhenSafe();
			} catch {
				// Offline or mid-deploy; try again on the next trigger.
			}
		};

		const onVisible = () => {
			if (document.visibilityState === 'visible') void check();
		};
		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted) void check(true);
		};

		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('pageshow', onPageShow);
		window.addEventListener('focus', onVisible);
		const timer = window.setInterval(onVisible, POLL_MS);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('pageshow', onPageShow);
			window.removeEventListener('focus', onVisible);
			window.clearInterval(timer);
		};
	}, []);

	return null;
}

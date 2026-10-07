'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { LearnPendingMark } from './LearnLinkPending';

/** Thin bar under the player's top bar showing how far the learner has scrolled. */
export function LearnScrollProgress() {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let frame = 0;
		function update() {
			frame = 0;
			const doc = document.documentElement;
			const max = doc.scrollHeight - window.innerHeight;
			setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
		}
		function schedule() {
			if (!frame) frame = window.requestAnimationFrame(update);
		}
		update();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);
		return () => {
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<div className="ln-scroll-progress" aria-hidden="true">
			<span style={{ transform: `scaleX(${progress})` }} />
		</div>
	);
}

function isTyping(target: EventTarget | null) {
	const element = target as HTMLElement | null;
	if (!element) return false;
	return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}

function shouldIgnore(target: EventTarget | null) {
	if (isTyping(target)) return true;
	const element = target as HTMLElement | null;
	if (element?.closest('[role="radio"], [role="radiogroup"], .ln-table, [data-ln-stepper]'))
		return true;
	if (document.querySelector('dialog[open], [aria-modal="true"]')) return true;
	return false;
}

/** ← / → (or J / K) move between sections, O returns to the course overview. */
export function LearnKeyboardNav({
	previousHref,
	nextHref,
	overviewHref,
}: {
	previousHref: string | null;
	nextHref: string | null;
	overviewHref: string;
}) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if (
				event.defaultPrevented ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				shouldIgnore(event.target)
			)
				return;
			const key = event.key.toLowerCase();
			if ((key === 'arrowleft' || key === 'k') && previousHref) {
				event.preventDefault();
				startTransition(() => router.push(previousHref));
			} else if ((key === 'arrowright' || key === 'j') && nextHref) {
				event.preventDefault();
				startTransition(() => router.push(nextHref));
			} else if (key === 'o') {
				event.preventDefault();
				startTransition(() => router.push(overviewHref));
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [router, previousHref, nextHref, overviewHref]);

	return <LearnPendingMark pending={pending} />;
}

'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Full-screen presentation for projecting a deck in class. Uses the browser
 * Fullscreen API when it answers within half a second, otherwise a fixed
 * overlay that locks page scroll and traps focus like a dialog.
 */
export function usePresentationMode(rootRef: RefObject<HTMLElement | null>, onEnter?: () => void) {
	const [presentation, setPresentation] = useState(false);
	const [nativeFullscreen, setNativeFullscreen] = useState(false);
	const restoreFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const onFullscreen = () => {
			const ours = document.fullscreenElement === rootRef.current;
			setNativeFullscreen(ours);
			if (ours) setPresentation(true);
			else if (!document.fullscreenElement) setPresentation(false);
		};
		document.addEventListener('fullscreenchange', onFullscreen);
		return () => document.removeEventListener('fullscreenchange', onFullscreen);
	}, [rootRef]);

	const leavePresentation = useCallback(async () => {
		try {
			if (document.fullscreenElement === rootRef.current) {
				await document.exitFullscreen?.();
			}
		} catch {
			// Check the actual fullscreen state below; a browser can reject while completing
			// the exit, or reject while still keeping the player fullscreen.
		}
		if (document.fullscreenElement === rootRef.current) return;
		setNativeFullscreen(false);
		setPresentation(false);
		window.requestAnimationFrame(() => restoreFocusRef.current?.focus?.());
	}, [rootRef]);

	const enterPresentation = useCallback(async () => {
		const root = rootRef.current;
		if (!root) return;
		onEnter?.();
		restoreFocusRef.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (root.requestFullscreen) {
			let timer = 0;
			try {
				await Promise.race([
					root.requestFullscreen(),
					new Promise((_, reject) => {
						timer = window.setTimeout(() => reject(new Error('fullscreen-timeout')), 500);
					}),
				]);
			} catch {
				// Fall through to the visual fallback below.
			} finally {
				window.clearTimeout(timer);
			}
		}
		setPresentation(true);
	}, [onEnter, rootRef]);

	const togglePresentation = useCallback(async () => {
		if (presentation || document.fullscreenElement === rootRef.current) {
			await leavePresentation();
			return;
		}
		await enterPresentation();
	}, [enterPresentation, leavePresentation, presentation, rootRef]);

	useEffect(() => {
		if (!presentation || nativeFullscreen) return;
		const previousOverflow = document.body.style.overflow;
		const previousPadding = document.body.style.paddingRight;
		const scrollbar = window.innerWidth - document.documentElement.clientWidth;
		document.body.style.overflow = 'hidden';
		if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
		return () => {
			document.body.style.overflow = previousOverflow;
			document.body.style.paddingRight = previousPadding;
		};
	}, [nativeFullscreen, presentation]);

	useEffect(() => {
		if (!presentation || nativeFullscreen) return;
		const root = rootRef.current;
		if (!root) return;

		const focusable = () =>
			Array.from(
				root.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
				),
			).filter((element) => element.offsetParent !== null);

		focusable()[0]?.focus();

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab') return;
			const items = focusable();
			if (items.length === 0) return;
			const first = items[0]!;
			const last = items[items.length - 1]!;
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener('keydown', onKeyDown, true);
		return () => document.removeEventListener('keydown', onKeyDown, true);
	}, [nativeFullscreen, presentation, rootRef]);

	return {
		presentation,
		/** The overlay fallback, not the browser's own fullscreen. */
		fallbackPresentation: presentation && !nativeFullscreen,
		enterPresentation,
		leavePresentation,
		togglePresentation,
	};
}

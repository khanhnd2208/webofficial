'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
	'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

/** Keep keyboard focus in an Arena overlay and return it to its trigger. */
export function useArenaDialogFocus(onEscape?: () => void) {
	const ref = useRef<HTMLElement>(null);
	const escapeRef = useRef(onEscape);
	useEffect(() => {
		escapeRef.current = onEscape;
	}, [onEscape]);
	useEffect(() => {
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const dialog = ref.current;
		if (!dialog) return;
		(
			dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]') ??
			dialog.querySelector<HTMLElement>(FOCUSABLE) ??
			dialog
		).focus();
		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape' && escapeRef.current) {
				event.preventDefault();
				event.stopImmediatePropagation();
				escapeRef.current();
				return;
			}
			if (event.key !== 'Tab' || !dialog) return;
			const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
				(item) => item.getClientRects().length > 0,
			);
			if (!items.length) {
				event.preventDefault();
				dialog.focus();
				return;
			}
			const first = items[0]!;
			const last = items[items.length - 1]!;
			if (
				event.shiftKey &&
				(document.activeElement === first || !dialog.contains(document.activeElement))
			) {
				event.preventDefault();
				last.focus();
			} else if (
				!event.shiftKey &&
				(document.activeElement === last || !dialog.contains(document.activeElement))
			) {
				event.preventDefault();
				first.focus();
			}
		}
		window.addEventListener('keydown', onKey, true);
		return () => {
			window.removeEventListener('keydown', onKey, true);
			previous?.focus();
		};
	}, []);
	return ref;
}

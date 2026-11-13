'use client';

import { useEffect } from 'react';

/**
 * Keyboard: Space hunts; in a question, keys press the matching button.
 * Escape closes setup (once a game has started) or the history panel.
 */
export function useArenaKeyboard({
	setupOpen,
	onCloseSetup,
	paused = false,
	historyOpen,
	onCloseHistory,
	phase,
	onHunt,
	onNewBoss,
}: {
	setupOpen: boolean;
	/** Undefined until a game has started: setup cannot be closed before that. */
	onCloseSetup?: () => void;
	/** Another dialog handles its own keys. */
	paused?: boolean;
	historyOpen: boolean;
	onCloseHistory: () => void;
	phase: string;
	onHunt: () => void;
	onNewBoss: () => void;
}) {
	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest('input, select, textarea, [contenteditable="true"]')
			)
				return;
			if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
			if (setupOpen) {
				if (event.key === 'Escape') onCloseSetup?.();
				return;
			}
			if (paused) return;
			const key = event.key.toLowerCase();
			if (key === 'escape' && historyOpen && phase !== 'caught') {
				onCloseHistory();
				return;
			}
			if (
				(key === ' ' || key === 'enter') &&
				target instanceof Element &&
				target.closest('button, a')
			)
				return;
			if (phase === 'idle' && (key === ' ' || key === 'enter')) {
				event.preventDefault();
				onHunt();
				return;
			}
			if (phase === 'victory' && (key === ' ' || key === 'enter')) {
				event.preventDefault();
				onNewBoss();
				return;
			}
			if (phase === 'caught') {
				// An exiting catch dialog can remain mounted while the next one opens.
				const button = Array.from(
					document.querySelectorAll<HTMLButtonElement>(
						`[role="dialog"][aria-modal="true"] [data-arena-key="${CSS.escape(key)}"]`,
					),
				).at(-1);
				if (button && !button.disabled) {
					event.preventDefault();
					button.click();
				}
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
}

'use client';

import { useEffect } from 'react';

/** Warn before leaving a dirty editor. Pair with a visible Save control. */
export function useUnsavedChanges(dirty: boolean) {
	useEffect(() => {
		if (!dirty) return;
		function onBeforeUnload(event: BeforeUnloadEvent) {
			event.preventDefault();
			event.returnValue = '';
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);
}

export function useSaveShortcut(enabled: boolean, onSave: () => void) {
	useEffect(() => {
		if (!enabled) return;
		function onKey(event: KeyboardEvent) {
			if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
			event.preventDefault();
			onSave();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [enabled, onSave]);
}

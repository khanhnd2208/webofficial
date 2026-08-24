'use client';

import { useEffect, useRef } from 'react';

/** Escape, outside click, autofocus, and restore focus for gradebook note popovers. */
export function useGridNotePopover(onClose: () => void) {
	const rootRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		textareaRef.current?.focus();

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
			}
		}

		function onPointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) onClose();
		}

		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown);
			previous?.focus();
		};
		// Bind once for this popover instance.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { rootRef, textareaRef };
}

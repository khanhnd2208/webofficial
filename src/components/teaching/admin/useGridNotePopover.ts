'use client';

import { useEffect, useRef } from 'react';

import { useTeachingDismissible } from '@/components/teaching/TeachingPopover';

/** Escape, outside click, autofocus, and restore focus for gradebook note popovers. */
export function useGridNotePopover(onClose: () => void) {
	const rootRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const triggerRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		textareaRef.current?.focus();
	}, []);

	useTeachingDismissible({
		open: true,
		onClose,
		rootRef,
		triggerRef,
	});

	return { rootRef, textareaRef };
}

'use client';

import { useEffect, useRef } from 'react';

import { useTeachingDismissible } from '@/components/teaching/TeachingPopover';

/** Escape, outside click, autofocus, and restore focus for gradebook note popovers. */
export function useGridNotePopover(onClose: () => void) {
	const rootRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const triggerRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		triggerRef.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const trigger = triggerRef.current;
		const position = () => {
			if (!rootRef.current || !trigger) return;
			const rect = trigger.getBoundingClientRect();
			const box = rootRef.current.getBoundingClientRect();
			rootRef.current.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - box.width - 8))}px`;
			rootRef.current.style.top = `${Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - box.height - 8))}px`;
		};
		position();
		textareaRef.current?.focus();
		const observer = new ResizeObserver(position);
		if (rootRef.current) observer.observe(rootRef.current);
		window.addEventListener('resize', position);
		window.addEventListener('scroll', position, true);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', position);
			window.removeEventListener('scroll', position, true);
		};
	}, []);

	useTeachingDismissible({
		open: true,
		onClose,
		rootRef,
		triggerRef,
	});

	return { rootRef, textareaRef };
}

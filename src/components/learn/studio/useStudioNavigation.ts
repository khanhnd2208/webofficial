'use client';

import { useRouter } from 'next/navigation';
import { useCallback, type MouseEvent } from 'react';

type Flush = () => Promise<{ ok: boolean }>;
type ConfirmLeave = () => Promise<boolean>;

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
	return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * Leave the studio only after the queue has flushed.
 * Preview opens a blank tab immediately so the browser does not block the popup.
 */
export function useStudioNavigation(flush: Flush, confirmLeave: ConfirmLeave) {
	const router = useRouter();

	const goTo = useCallback(
		async (href: string) => {
			const saved = await flush();
			if (!saved.ok) {
				const leave = await confirmLeave();
				if (!leave) return;
			}
			router.push(href);
		},
		[confirmLeave, flush, router],
	);

	const onNavigate = useCallback(
		(href: string, event: MouseEvent<HTMLAnchorElement>) => {
			if (isModifiedClick(event)) return;
			event.preventDefault();
			void goTo(href);
		},
		[goTo],
	);

	const openPreview = useCallback(
		(href: string) => {
			const popup = window.open('', '_blank');
			void flush().then(() => {
				if (popup && !popup.closed) popup.location.href = href;
			});
		},
		[flush],
	);

	return { onNavigate, openPreview };
}

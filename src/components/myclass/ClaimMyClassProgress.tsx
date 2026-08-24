'use client';

import { useEffect, useRef } from 'react';

import { flushCompleteQueue, setStorageScope } from '@/features/my-class/client/progressStore';

export default function ClaimMyClassProgress({ enabled }: { enabled: boolean }) {
	const ran = useRef(false);
	useEffect(() => {
		if (!enabled || ran.current) return;
		ran.current = true;
		void (async () => {
			const bootstrap = await fetch('/api/my-class/actor/bootstrap', { method: 'POST' }).then((response) => response.json()).catch(() => null) as { data?: { storageScope?: string } } | null;
			if (bootstrap?.data?.storageScope) setStorageScope(bootstrap.data.storageScope);
			const flushed = await flushCompleteQueue();
			const response = await fetch('/api/my-class/progress/claim', { method: 'POST' }).catch(() => null);
			if (response?.ok) {
				const json = (await response.json().catch(() => null)) as { data?: { claimed?: number } } | null;
				if ((json?.data?.claimed ?? 0) > 0 || Object.keys(flushed.byCourseId).length > 0) {
					window.dispatchEvent(new CustomEvent('my-class:progress-updated'));
				}
			}
		})();
	}, [enabled]);
	return null;
}

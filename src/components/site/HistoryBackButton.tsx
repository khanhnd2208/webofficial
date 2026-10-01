'use client';

import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** "Quay lại" that only shows when there is an earlier page on this site to go back to. */
export default function HistoryBackButton({
	className = '',
	children = '← Quay lại trang trước',
}: {
	className?: string;
	children?: React.ReactNode;
}) {
	const router = useRouter();
	const canGoBack = useSyncExternalStore(
		noop,
		() => {
			try {
				return (
					window.history.length > 1 &&
					Boolean(document.referrer) &&
					new URL(document.referrer).origin === window.location.origin
				);
			} catch {
				return false;
			}
		},
		() => false,
	);
	if (!canGoBack) return null;
	return (
		<button type="button" onClick={() => router.back()} className={className}>
			{children}
		</button>
	);
}

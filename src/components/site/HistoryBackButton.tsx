'use client';

import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

type NavigationEntry = { index: number; url: string | null };
type NavigationApi = { currentEntry: NavigationEntry | null; entries(): NavigationEntry[] };

const noop = () => () => {};

/**
 * True when the previous history entry is a page on this site. The Navigation API sees client-side
 * (Next.js `<Link>`) moves too; where it is missing, a same-site referrer is the best signal left.
 */
function hasPreviousPageOnSite(): boolean {
	try {
		const navigation = (window as Window & { navigation?: NavigationApi }).navigation;
		const current = navigation?.currentEntry;
		if (navigation && current) {
			const previous = navigation.entries()[current.index - 1];
			return Boolean(previous?.url) && new URL(previous!.url!).origin === window.location.origin;
		}
		return (
			Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin
		);
	} catch {
		return false;
	}
}

/** "Quay lại" that only shows when there is an earlier page on this site to go back to. */
export default function HistoryBackButton({
	className = '',
	children = '← Quay lại trang trước',
}: {
	className?: string;
	children?: React.ReactNode;
}) {
	const router = useRouter();
	const canGoBack = useSyncExternalStore(noop, hasPreviousPageOnSite, () => false);
	if (!canGoBack) return null;
	return (
		<button type="button" onClick={() => router.back()} className={className}>
			{children}
		</button>
	);
}

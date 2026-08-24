'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

import { studioTableHref } from '@/features/my-class/domain/listQuery';

export function useStudioTableQuery() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [pending, startTransition] = useTransition();

	const current = useMemo(() => {
		const next: Record<string, string | undefined> = {};
		searchParams.forEach((value, key) => {
			next[key] = value;
		});
		return next;
	}, [searchParams]);

	const hrefFor = useCallback(
		(patch: Record<string, string | undefined | null>) => studioTableHref(pathname, current, patch),
		[current, pathname],
	);

	const navigate = useCallback(
		(patch: Record<string, string | undefined | null>) => {
			startTransition(() => router.push(hrefFor(patch)));
		},
		[hrefFor, router],
	);

	return { current, hrefFor, navigate, pending, pathname };
}

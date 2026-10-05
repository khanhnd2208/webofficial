'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { routes } from '@/config/routes';
import SpotIllustration from '@/components/site/SpotIllustration';

export default function MySpaceError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('[my-space]', error);
	}, [error]);

	return (
		<main className="flex min-h-svh flex-col items-center justify-center bg-canvas px-6 text-center">
			<p className="eyebrow">Không gian của tôi</p>
			<h1 className="mt-4 font-display text-2xl font-medium tracking-tight text-ink">
				Có lỗi xảy ra
			</h1>
			<p className="mt-3 max-w-sm font-sans text-base text-ink-secondary">
				Không tải được nội dung. Thử lại, hoặc quay về Không gian của tôi.
			</p>
			<div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
				<button
					type="button"
					onClick={reset}
					className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-ink bg-ink px-5 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink"
				>
					Thử lại
				</button>
				<Link
					href={routes.mySpace}
					className="font-sans text-sm text-ink-secondary transition-colors hover:text-ink"
				>
					← Không gian của tôi
				</Link>
			</div>
		</main>
	);
}

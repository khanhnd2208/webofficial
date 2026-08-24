'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { routes } from '@/config/routes';

export default function TeachingError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('[teaching]', error);
	}, [error]);

	return (
		<main className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
			<p className="font-mono text-[0.75rem] tracking-[0.14em] text-ink-secondary uppercase">
				Teaching
			</p>
			<h1 className="mt-4 font-display text-2xl font-medium tracking-tight text-ink">
				Không tải được lớp học
			</h1>
			<p className="mt-3 max-w-sm font-sans text-base text-ink-secondary">
				Có lỗi khi mở trang giảng dạy. Thử lại hoặc quay về danh sách lớp.
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
					href={routes.mySpaceTeaching}
					className="font-sans text-sm text-ink-secondary transition-colors hover:text-ink"
				>
					← Danh sách lớp
				</Link>
			</div>
		</main>
	);
}

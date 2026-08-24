'use client';

import { useEffect } from 'react';

export default function PublicClassError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('[lop]', error);
	}, [error]);

	return (
		<main className="flex min-h-svh flex-col items-center justify-center bg-canvas px-6 text-center">
			<p className="font-mono text-[0.75rem] tracking-[0.14em] text-ink-secondary uppercase">
				Bảng lớp
			</p>
			<h1 className="mt-4 font-display text-2xl font-medium tracking-tight text-ink">
				Không tải được bảng lớp
			</h1>
			<p className="mt-3 max-w-sm font-sans text-base text-ink-secondary">
				Có lỗi khi mở trang công khai. Thử lại hoặc hỏi giảng viên đường dẫn mới.
			</p>
			<button
				type="button"
				onClick={reset}
				className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-ink bg-ink px-5 font-sans text-sm font-semibold text-canvas transition-colors hover:bg-transparent hover:text-ink"
			>
				Thử lại
			</button>
		</main>
	);
}

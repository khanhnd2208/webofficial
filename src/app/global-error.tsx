'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="vi">
			<body className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-ink antialiased">
				<main className="mx-auto max-w-md text-center">
					<p className="text-xs font-bold uppercase tracking-widest text-ink-secondary">
						Lỗi hệ thống
					</p>
					<h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Đã xảy ra sự cố</h1>
					<p className="mt-3 text-sm leading-relaxed text-ink-secondary">
						Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử lại hoặc quay về trang chủ.
					</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={reset}
							className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-canvas"
						>
							Thử lại
						</button>
						{/* global-error replaces root layout — Link may be unavailable */}
						{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
						<a
							href="/"
							className="inline-flex min-h-11 items-center justify-center rounded-full border border-hairline px-5 text-sm font-semibold"
						>
							Về trang chủ
						</a>
					</div>
					{error.digest ? (
						<p className="mt-6 text-xs text-ink-secondary">Mã: {error.digest}</p>
					) : null}
					<p className="sr-only">
						<Link href="/">Duy Khánh</Link>
					</p>
				</main>
			</body>
		</html>
	);
}

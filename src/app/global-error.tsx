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
			<body className="flex min-h-screen flex-col items-center justify-center bg-[#f2eee6] px-6 text-[#191815] antialiased">
				<main className="mx-auto max-w-md text-center">
					<p className="text-xs font-bold uppercase tracking-widest text-[#625d54]">Lỗi hệ thống</p>
					<h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Đã xảy ra sự cố</h1>
					<p className="mt-3 text-sm leading-relaxed text-[#625d54]">
						Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử lại hoặc quay về trang chủ.
					</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={reset}
							className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#191815] px-5 text-sm font-semibold text-[#faf7f0]"
						>
							Thử lại
						</button>
					{/* global-error replaces root layout — Link may be unavailable */}
					{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
						<a
							href="/"
							className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8d0c3] px-5 text-sm font-semibold"
						>
							Về trang chủ
						</a>
					</div>
					{error.digest ? (
						<p className="mt-6 text-[11px] text-[#625d54]">Mã: {error.digest}</p>
					) : null}
					<p className="sr-only">
						<Link href="/">HANOICAM</Link>
					</p>
				</main>
			</body>
		</html>
	);
}

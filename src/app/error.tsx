'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { routes } from '@/config/routes';

export default function Error({
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
		<main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
			<div className="mx-auto max-w-md text-center">
				<p className="text-xs font-bold uppercase tracking-widest text-muted">Đã xảy ra lỗi</p>
				<h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
					Không tải được trang này
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
					Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, hãy quay về trang chủ hoặc liên hệ khi bạn có thông tin liên hệ công khai.
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						onClick={reset}
						className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground-secondary"
					>
						Thử lại
					</button>
					<Link
						href={routes.home}
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
					>
						Về trang chủ
					</Link>
				</div>
				{error.digest ? (
					<p className="mt-6 text-[11px] text-muted">Mã tham chiếu: {error.digest}</p>
				) : null}
			</div>
		</main>
	);
}

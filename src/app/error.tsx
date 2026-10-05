'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import SpotIllustration from '@/components/site/SpotIllustration';
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
				<SpotIllustration variant="error" className="mx-auto mb-5" />
				<p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
					Đã xảy ra lỗi
				</p>
				<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">
					Không tải được trang này
				</h1>
				<p className="mt-3 text-[17px] leading-relaxed text-foreground-secondary">
					Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, bạn có thể mở mục lục để chọn một trang khác.
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
						href={routes.toc}
						className="text-sm font-semibold text-foreground-secondary hover:text-foreground"
					>
						Mở mục lục
					</Link>
				</div>
				{error.digest ? (
					<p className="mt-6 text-xs text-muted">Mã tham chiếu: {error.digest}</p>
				) : null}
			</div>
		</main>
	);
}

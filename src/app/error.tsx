'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import ContactLink from '@/components/contact/ContactLink';
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
				<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
					Đã xảy ra lỗi
				</p>
				<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">
					Không tải được trang này
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
					Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, bạn có thể quay về trang chủ hoặc gửi Khánh một lời nhắn.
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						onClick={reset}
						className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground-secondary"
					>
						Thử lại
					</button>
					<ContactLink
						href={routes.contact}
						contactContext={{ campaignParams: { ref: 'error-page' } }}
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
					>
						Gửi lời nhắn
					</ContactLink>
					<Link href={routes.home} className="text-sm font-semibold text-foreground-secondary hover:text-foreground">
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

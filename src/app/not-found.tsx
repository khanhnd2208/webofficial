import Link from 'next/link';

import { routes } from '@/config/routes';

export default function NotFound() {
	return (
		<main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
			<div className="mx-auto max-w-md text-center">
				<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">404</p>
				<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">
					Không tìm thấy trang
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
					Đường dẫn không tồn tại hoặc nội dung đã được di chuyển.
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Link
						href={routes.home}
						className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground-secondary"
					>
						Về trang chủ
					</Link>
					<Link
						href={routes.toc}
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
					>
						Mở mục lục
					</Link>
				</div>
			</div>
		</main>
	);
}

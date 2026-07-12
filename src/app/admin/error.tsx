'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { routes } from '@/config/routes';

export default function AdminError({
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
		<div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-12">
			<div className="mx-auto max-w-md text-center">
				<p className="text-xs font-bold uppercase tracking-widest text-muted">Lỗi quản trị</p>
				<h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Không tải được khu vực admin</h1>
				<p className="mt-3 text-sm text-foreground-secondary">
					Thao tác thất bại. Bạn có thể thử lại hoặc quay về tổng quan.
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						onClick={reset}
						className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background"
					>
						Thử lại
					</button>
					<Link
						href={routes.admin.home}
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-5 text-sm font-semibold"
					>
						Tổng quan
					</Link>
				</div>
			</div>
		</div>
	);
}

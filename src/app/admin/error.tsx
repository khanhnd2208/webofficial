'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { AdminErrorState } from '@/components/admin/AdminPageHeader';
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
		<div className="mx-auto max-w-xl px-6 py-12">
			<AdminErrorState
				title="Không tải được khu vực admin"
				description="Thao tác thất bại. Bạn có thể thử lại hoặc quay về tổng quan."
				requestId={error.digest}
				onRetry={reset}
			/>
			<p className="mt-6 text-center">
				<Link
					href={routes.admin.home}
					className="text-sm font-semibold underline underline-offset-4"
				>
					Tổng quan
				</Link>
			</p>
		</div>
	);
}

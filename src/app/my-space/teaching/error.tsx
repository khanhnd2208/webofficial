'use client';

import Link from 'next/link';

import { routes } from '@/config/routes';

export default function MySpaceTeachingError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-12">
			<h1 className="text-xl font-semibold">Không tải được lớp học</h1>
			<div className="mt-6 flex gap-3">
				<button type="button" onClick={reset} className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-paper">
					Thử lại
				</button>
				<Link href={routes.admin.teaching} className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold">
					Về danh sách lớp
				</Link>
			</div>
		</div>
	);
}

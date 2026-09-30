import Link from 'next/link';

import { routes } from '@/config/routes';

export function ArchiveBanner() {
	return (
		<div
			className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
			data-testid="archive-banner"
			role="status"
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p>
					<strong className="font-semibold">Đã lưu trữ.</strong> Module này không còn nằm trong
					luồng làm việc hằng ngày. Dữ liệu vẫn còn và có thể dùng đầy đủ từ Kho lưu trữ.
				</p>
				<Link
					href={routes.admin.home}
					className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-950 hover:bg-amber-100"
					data-testid="archive-back-to-admin"
				>
					Về admin chính
				</Link>
			</div>
		</div>
	);
}

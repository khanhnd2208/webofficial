'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function GradeSummaryDownload({ classId }: { classId: string }) {
	const router = useRouter();
	const [downloading, setDownloading] = useState(false);
	const [error, setError] = useState('');

	async function download() {
		setError('');
		setDownloading(true);
		try {
			const response = await fetch(`/api/admin/teaching/classes/${classId}/export?mode=summary`);
			if (response.status === 409) {
				router.refresh();
				setError('Bảng tổng kết đã thay đổi. Hãy kiểm tra trạng thái chốt điểm.');
				return;
			}
			if (!response.ok) throw new Error();

			const url = URL.createObjectURL(await response.blob());
			const link = document.createElement('a');
			link.href = url;
			link.download =
				response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
				'tong-ket.xlsx';
			link.click();
			window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
		} catch {
			setError('Không thể tải Excel. Hãy thử lại hoặc kiểm tra phiên đăng nhập.');
		} finally {
			setDownloading(false);
		}
	}

	return (
		<div className="space-y-1">
			<button
				type="button"
				onClick={download}
				disabled={downloading}
				className="mc-button mc-button-primary min-h-11 px-4 text-sm font-semibold"
			>
				{downloading ? 'Đang xuất Excel…' : 'Tải Excel (.xlsx)'}
			</button>
			{error ? (
				<p role="alert" className="text-sm text-error">
					{error}
				</p>
			) : null}
		</div>
	);
}

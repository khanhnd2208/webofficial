'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudioButton } from '@/components/myclass/admin/studio';
import { myClassApi } from '@/components/myclass/admin/api';
import { routes } from '@/config/routes';
import { Dialog } from '@/components/ui/Dialog';

export default function CourseListActions({
	courseId,
	courseSlug,
}: {
	courseId: string;
	courseSlug: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function archive() {
		setBusy(true);
		setError(null);
		try {
			await myClassApi(`/api/admin/my-class/courses/${courseId}`, { method: 'DELETE' });
			setOpen(false);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu trữ được');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<Link
				href={routes.myClassCourseEdit(courseSlug)}
				className="inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] bg-ink px-3 text-xs font-semibold text-paper"
			>
				Sửa
			</Link>
			<Link
				href={routes.admin.myClassCourseContent(courseId)}
				className="inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-xs font-semibold text-ink hover:bg-surface-sunken"
			>
				Studio
			</Link>
			<button
				type="button"
				className="inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-xs font-semibold text-ink-secondary hover:bg-surface-sunken"
				onClick={() => setOpen(true)}
			>
				Lưu trữ
			</button>
			<Dialog open={open} onClose={() => setOpen(false)} title="Lưu trữ khóa học?">
				<p className="text-sm">Khóa học sẽ biến mất khỏi trang học viên.</p>
				{error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
				<div className="mt-4 flex justify-end gap-2">
					<StudioButton variant="quiet" onClick={() => setOpen(false)}>
						Hủy
					</StudioButton>
					<StudioButton variant="danger" disabled={busy} onClick={() => void archive()}>
						Lưu trữ
					</StudioButton>
				</div>
			</Dialog>
		</div>
	);
}

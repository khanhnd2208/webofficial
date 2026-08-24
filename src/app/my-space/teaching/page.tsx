import Link from 'next/link';

import { TeachingClassesTable } from '@/components/teaching/admin/TeachingClassesTable';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { routes } from '@/config/routes';
import { listTeachingClasses } from '@/features/teaching';

export const dynamic = 'force-dynamic';

export default async function MySpaceTeachingPage() {
	const classes = await listTeachingClasses();
	return (
		<div className="py-3 sm:py-5">
			<TeachingAppHeader
				backHref={routes.mySpace}
				backLabel="My Space"
				eyebrow="Teaching"
				title="Lớp học"
				description="Điểm danh, chấm CP và quản lý danh sách học viên."
				actions={<Link href={routes.mySpaceTeachingNew} className="inline-flex min-h-9 touch-manipulation items-center justify-center rounded-[var(--mc-r-sm)] border border-transparent bg-ink px-3 text-xs font-semibold text-paper transition-colors hover:bg-inverse-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Tạo lớp</Link>}
			/>
			{classes.length === 0 ? (
				<div className="mc-surface mt-6 p-8 text-center">
					<p className="font-semibold text-ink">Chưa có lớp học</p>
					<p className="mc-meta mt-2">Tạo lớp mới rồi thêm học viên bằng Excel hoặc nhập thủ công.</p>
				</div>
			) : <TeachingClassesTable classes={classes} />}
		</div>
	);
}

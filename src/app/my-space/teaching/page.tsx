import Link from 'next/link';

import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { TeachingClassCards } from '@/components/teaching/admin/TeachingClassCards';
import { routes } from '@/config/routes';
import { listTeachingClasses } from '@/features/teaching';

export const dynamic = 'force-dynamic';

export default async function MySpaceTeachingPage() {
	const classes = await listTeachingClasses();

	return (
		<div className="mx-auto max-w-6xl py-6 sm:py-8">
			<TeachingAppHeader
				backHref={routes.mySpace}
				backLabel="My Space"
				eyebrow="Teaching"
				title="Lớp học"
				description="Điểm danh, chấm CP và quản lý danh sách học viên."
				actions={
					<Link
						href={routes.mySpaceTeachingNew}
						className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-[var(--mc-r-sm)] border border-transparent bg-ink px-4 text-xs font-semibold text-paper transition-colors hover:bg-inverse-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						Tạo lớp
					</Link>
				}
			/>
			<div className="mt-6 sm:mt-8">
				<TeachingClassCards classes={classes} />
			</div>
		</div>
	);
}

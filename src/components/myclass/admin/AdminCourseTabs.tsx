'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/config/routes';

const TABS = [
	{
		id: 'overview',
		label: 'Tổng quan',
		href: (id: string) => routes.admin.myClassCourseOverview(id),
	},
	{ id: 'content', label: 'Nội dung', href: (id: string) => routes.admin.myClassCourseContent(id) },
	{
		id: 'vocabulary',
		label: 'Từ vựng',
		href: (id: string) => routes.admin.myClassCourseVocabulary(id),
	},
	{
		id: 'practice',
		label: 'Luyện tập',
		href: (id: string) => routes.admin.myClassCoursePractice(id),
	},
	{
		id: 'students',
		label: 'Học viên',
		href: (id: string) => routes.admin.myClassCourseStudents(id),
	},
	{ id: 'results', label: 'Kết quả', href: (id: string) => routes.admin.myClassCourseResults(id) },
	{
		id: 'settings',
		label: 'Cài đặt',
		href: (id: string) => routes.admin.myClassCourseSettings(id),
	},
] as const;

export default function AdminCourseTabs({ courseId }: { courseId: string }) {
	const pathname = usePathname();
	return (
		<nav
			aria-label="Không gian khóa học"
			className="mt-6 flex gap-1 overflow-x-auto border-b border-mc-rule pb-2 text-sm"
		>
			{TABS.map((tab) => {
				const href = tab.href(courseId);
				const active = pathname === href || pathname.startsWith(`${href}/`);
				return (
					<Link
						key={tab.id}
						href={href}
						aria-current={active ? 'page' : undefined}
						className={`inline-flex min-h-11 shrink-0 items-center rounded-[var(--mc-r-sm)] px-3 py-1.5 font-semibold ${
							active
								? 'bg-ink text-paper'
								: 'text-ink-secondary hover:bg-surface-sunken hover:text-ink'
						}`}
					>
						{tab.label}
					</Link>
				);
			})}
		</nav>
	);
}

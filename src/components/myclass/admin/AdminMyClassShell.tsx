'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { routes } from '@/config/routes';
import { McIcon, type McIconName } from '@/components/myclass/ui';

const NAV_ITEMS: Array<{
	label: string;
	href: string;
	exact?: boolean;
	icon: McIconName;
}> = [
	{ label: 'Tổng quan', href: routes.admin.myClass, exact: true, icon: 'dashboard' },
	{ label: 'Khóa học', href: routes.admin.myClassCourses, icon: 'school' },
	{ label: 'Thư viện nội dung', href: routes.admin.myClassKnowledge, icon: 'library_books' },
	{ label: 'Bài kiểm tra', href: routes.admin.myClassTests, icon: 'quiz' },
	{ label: 'Từ vựng', href: routes.admin.myClassVocabulary, icon: 'menu_book' },
	{ label: 'Ngân hàng câu hỏi', href: routes.admin.myClassBank, icon: 'help' },
	{ label: 'Nhóm học', href: routes.admin.myClassCohorts, icon: 'groups' },
	{ label: 'Kết quả', href: routes.admin.myClassPerformance, icon: 'bar_chart' },
	{ label: 'Nhập dữ liệu', href: routes.admin.myClassImport, icon: 'upload' },
];

export default function AdminMyClassShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	return (
		<div className="min-h-screen bg-canvas">
			<header className="border-b border-mc-rule bg-paper">
				<div className="flex h-16 items-center px-4 sm:px-6">
					<div>
						<p className="text-xl font-semibold leading-7 text-ink">My Class</p>
						<p className="text-xs text-ink-tertiary">Studio học tập</p>
					</div>
					<Link
						href={routes.myClass}
						target="_blank"
						rel="noreferrer"
						className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-[var(--mc-r-sm)] px-3 text-sm font-semibold text-ink-secondary hover:bg-surface-sunken hover:text-ink"
					>
						Mở trang học viên
						<McIcon name="arrow_forward" size={16} />
					</Link>
				</div>
				<nav
					aria-label="Điều hướng My Class"
					className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden"
				>
					{NAV_ITEMS.map((item) => {
						const active =
							'exact' in item && item.exact
								? pathname === item.href
								: pathname === item.href || pathname.startsWith(`${item.href}/`);
						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={active ? 'page' : undefined}
								className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--mc-r-sm)] px-3 text-sm font-semibold ${active ? 'bg-ink text-paper' : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink'}`}
							>
								<McIcon name={item.icon} size={18} />
								{item.label}
							</Link>
						);
					})}
				</nav>
			</header>
			<div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
				<aside className="sticky top-0 hidden h-[calc(100vh-4rem)] border-r border-mc-rule bg-paper p-3 lg:block">
					<nav aria-label="Điều hướng My Class" className="space-y-1">
						{NAV_ITEMS.map((item) => {
							const active =
								'exact' in item && item.exact
									? pathname === item.href
									: pathname === item.href || pathname.startsWith(`${item.href}/`);
							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={active ? 'page' : undefined}
									className={`flex min-h-11 items-center gap-3 rounded-[var(--mc-r-sm)] px-3 text-sm font-semibold transition-colors ${active ? 'bg-ink text-paper' : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink'}`}
								>
									<McIcon name={item.icon} size={18} />
									{item.label}
								</Link>
							);
						})}
					</nav>
				</aside>
				<main className="min-w-0">{children}</main>
			</div>
		</div>
	);
}

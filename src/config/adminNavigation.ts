import type { McIconName } from '@/components/myclass/ui/McIcon';

import {
	getActiveAdminNavItems,
	getArchivedModulesByGroup,
	isArchivedAdminPath,
} from '@/config/moduleRegistry';
import { routes } from '@/config/routes';

export type AdminWorkspaceWidth = 'standard' | 'wide' | 'full-workspace';

export type AdminNavItem = {
	href: string;
	label: string;
	exact?: boolean;
	icon: McIconName;
};

export type AdminNavGroup = {
	group: string;
	items: AdminNavItem[];
};

export type AdminRouteMeta = {
	href: string;
	label: string;
	width: AdminWorkspaceWidth;
	localNav?: AdminNavItem[];
	localNavAction?: { href: string; label: string; external?: boolean };
};

export const MY_CLASS_LOCAL_NAV: AdminNavItem[] = [
	{ href: routes.admin.myClass, label: 'Tổng quan', exact: true, icon: 'dashboard' },
	{ href: routes.admin.myClassCourses, label: 'Khóa học', icon: 'school' },
	{ href: routes.admin.myClassKnowledge, label: 'Thư viện nội dung', icon: 'library_books' },
	{ href: routes.admin.myClassTests, label: 'Bài kiểm tra', icon: 'quiz' },
	{ href: routes.admin.myClassVocabulary, label: 'Từ vựng', icon: 'menu_book' },
	{ href: routes.admin.myClassBank, label: 'Ngân hàng câu hỏi', icon: 'help' },
	{ href: routes.admin.myClassCohorts, label: 'Nhóm học', icon: 'groups' },
	{ href: routes.admin.myClassPerformance, label: 'Kết quả', icon: 'bar_chart' },
	{ href: routes.admin.myClassImport, label: 'Nhập dữ liệu', icon: 'upload' },
];

/** Primary admin sidebar — only the modules currently in operation. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
	{
		group: 'Đang dùng',
		items: getActiveAdminNavItems(),
	},
];

/** Archive sidebar — every paused module, grouped for later retrieval. */
export const ARCHIVE_NAV_GROUPS: AdminNavGroup[] = getArchivedModulesByGroup().map(
	({ group, modules }) => ({
		group,
		items: modules.map((module) => ({
			href: module.adminHref,
			label: module.label,
			icon: module.icon,
		})),
	}),
);

const ROUTE_META: AdminRouteMeta[] = [
	{
		href: routes.admin.myClass,
		label: 'My Class',
		width: 'wide',
		localNav: MY_CLASS_LOCAL_NAV,
	},
	{ href: routes.admin.website, label: 'Website', width: 'standard' },
	{ href: routes.admin.inquiries, label: 'Yêu cầu liên hệ', width: 'standard' },
	{ href: routes.admin.activeRecall, label: 'Teaching', width: 'standard' },
	{ href: routes.admin.learnAnalytics, label: 'Thống kê học tập', width: 'wide' },
	{ href: routes.admin.archive, label: 'Kho lưu trữ', width: 'standard' },
	{ href: routes.admin.posts, label: 'Bài viết', width: 'standard' },
	{ href: routes.admin.courses, label: 'Khóa học Chương–Bài', width: 'standard' },
	{ href: routes.admin.enrollments, label: 'Học viên và ghi danh', width: 'standard' },
	{ href: routes.admin.vocabulary, label: 'Từ vựng', width: 'wide' },
	{ href: routes.admin.messages, label: 'Lời nhắn', width: 'standard' },
	{ href: routes.admin.home, label: 'Tổng quan', width: 'standard' },
];

export function isAdminNavActive(pathname: string, href: string, exact?: boolean): boolean {
	if (exact || href === routes.admin.home) return pathname === href;
	if (href === routes.admin.website) {
		return (
			pathname === routes.admin.website ||
			pathname === routes.admin.inquiries ||
			pathname.startsWith(`${routes.admin.inquiries}/`)
		);
	}
	if (href === routes.admin.posts) {
		return (
			pathname === routes.admin.posts ||
			(pathname.startsWith(`${routes.admin.posts}/`) &&
				!pathname.startsWith(routes.admin.postCreate))
		);
	}
	if (href === routes.admin.myClass) {
		return pathname === routes.admin.myClass || pathname.startsWith(`${routes.admin.myClass}/`);
	}
	if (href === routes.admin.tools) {
		return pathname === routes.admin.tools;
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function resolveAdminRoute(pathname: string): AdminRouteMeta {
	const ranked = [...ROUTE_META].sort((a, b) => b.href.length - a.href.length);
	for (const meta of ranked) {
		if (meta.href === routes.admin.home) {
			if (pathname === routes.admin.home) return meta;
			continue;
		}
		if (pathname === meta.href || pathname.startsWith(`${meta.href}/`)) return meta;
	}
	return {
		href: pathname,
		label: isArchivedAdminPath(pathname) ? 'Kho lưu trữ' : 'Quản trị',
		width: 'standard',
	};
}

export function getAdminNavGroupsForPath(pathname: string): AdminNavGroup[] {
	return isArchivedAdminPath(pathname) ? ARCHIVE_NAV_GROUPS : ADMIN_NAV_GROUPS;
}

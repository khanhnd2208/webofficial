import { routes } from '@/config/routes';
import type { McIconName } from '@/components/myclass/ui/McIcon';

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

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
	{
		group: 'Nội dung',
		items: [
			{ href: routes.admin.posts, label: 'Bài viết', icon: 'assignment' },
			{ href: routes.admin.postCreate, label: 'Tạo bài viết', icon: 'add' },
		],
	},
	{
		group: 'Giảng dạy',
		items: [
			{ href: routes.admin.teaching, label: 'Lớp học', icon: 'event_available' },
			{ href: routes.admin.myClass, label: 'My Class', icon: 'school' },
			{ href: routes.admin.courses, label: 'Khóa học Chương–Bài', icon: 'book' },
			{ href: routes.admin.enrollments, label: 'Học viên và ghi danh', icon: 'groups' },
		],
	},
	{
		group: 'Công cụ',
		items: [
			{ href: routes.admin.vocabulary, label: 'Từ vựng', icon: 'menu_book' },
			{ href: routes.admin.luckyCard, label: 'Lucky Card', icon: 'campaign' },
			{ href: routes.admin.activeRecall, label: 'Active Recall', icon: 'quiz' },
			{ href: routes.admin.messages, label: 'Lời nhắn', icon: 'assignment' },
			{ href: routes.admin.myspaceTests, label: 'Bài kiểm tra My Space', icon: 'quiz' },
			{ href: routes.admin.myspaceSubjects, label: 'Môn học', icon: 'library_books' },
		],
	},
	{
		group: 'Hệ thống',
		items: [
			{ href: routes.admin.inquiries, label: 'Yêu cầu liên hệ', icon: 'campaign' },
			{ href: routes.admin.users, label: 'Người dùng', icon: 'groups' },
			{ href: routes.admin.media, label: 'Tệp media', icon: 'upload' },
			{ href: routes.admin.settings, label: 'Cài đặt', icon: 'settings' },
		],
	},
];

const ROUTE_META: AdminRouteMeta[] = [
	{
		href: routes.admin.myClass,
		label: 'My Class',
		width: 'wide',
		localNav: MY_CLASS_LOCAL_NAV,
		localNavAction: { href: routes.myClass, label: 'Mở trang học viên', external: true },
	},
	{ href: routes.admin.teaching, label: 'Lớp học', width: 'full-workspace' },
	{ href: routes.admin.posts, label: 'Bài viết', width: 'standard' },
	{ href: routes.admin.courses, label: 'Khóa học Chương–Bài', width: 'standard' },
	{ href: routes.admin.enrollments, label: 'Học viên và ghi danh', width: 'standard' },
	{ href: routes.admin.vocabulary, label: 'Từ vựng', width: 'wide' },
	{ href: routes.admin.messages, label: 'Lời nhắn', width: 'standard' },
	{ href: routes.admin.home, label: 'Tổng quan', width: 'standard' },
];

export function isAdminNavActive(pathname: string, href: string, exact?: boolean): boolean {
	if (exact || href === routes.admin.home) return pathname === href;
	if (href === routes.admin.posts) {
		return (
			pathname === routes.admin.posts ||
			(pathname.startsWith(`${routes.admin.posts}/`) && !pathname.startsWith(routes.admin.postCreate))
		);
	}
	if (href === routes.admin.myClass) {
		return pathname === routes.admin.myClass || pathname.startsWith(`${routes.admin.myClass}/`);
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
	return { href: pathname, label: 'Quản trị', width: 'standard' };
}

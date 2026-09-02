/**
 * Operating-mode registry — classifies product modules as active or archived.
 *
 * Navigation, admin shells, sitemap, and public-surface locks all read from
 * this file. Restoring a module later is a status change here plus tests,
 * not a source move into `src/_archived`.
 */

import type { McIconName } from '@/components/myclass/ui/McIcon';

import { routes } from './routes';

export type ModuleStatus = 'active' | 'archived';

export type OperatingModule = {
	id: string;
	status: ModuleStatus;
	label: string;
	description: string;
	icon: McIconName;
	/** Group heading in the archive hub / archive sidebar. */
	archiveGroup: string;
	adminHref: string;
	adminPrefixes: readonly string[];
	publicPrefixes: readonly string[];
};

export const OPERATING_MODULES: readonly OperatingModule[] = [
	{
		id: 'website',
		status: 'active',
		label: 'Website',
		description: 'Trang thương hiệu và hộp thư liên hệ',
		icon: 'home',
		archiveGroup: 'Website',
		adminHref: routes.admin.website,
		adminPrefixes: [routes.admin.website, routes.admin.inquiries],
		publicPrefixes: [
			routes.about,
			routes.projects,
			routes.services,
			routes.contact,
			routes.toc,
		],
	},
	{
		id: 'teaching',
		status: 'active',
		label: 'Teaching',
		description: 'Lớp học, điểm danh và trải nghiệm học',
		icon: 'event_available',
		archiveGroup: 'Teaching',
		adminHref: routes.admin.teaching,
		adminPrefixes: [routes.admin.teaching],
		publicPrefixes: ['/lop'],
	},
	{
		id: 'active-recall',
		status: 'active',
		label: 'Active Recall',
		description: 'Bộ thẻ hỏi–đáp công khai',
		icon: 'quiz',
		archiveGroup: 'Active Recall',
		adminHref: routes.admin.activeRecall,
		adminPrefixes: [routes.admin.activeRecall],
		publicPrefixes: [routes.activeRecall],
	},
	{
		id: 'posts',
		status: 'archived',
		label: 'Bài viết / Ghi chép',
		description: 'Soạn và xuất bản bài viết, ghi chép công khai',
		icon: 'assignment',
		archiveGroup: 'Bài viết / Ghi chép',
		adminHref: routes.admin.posts,
		adminPrefixes: [routes.admin.posts, routes.admin.postCreate],
		publicPrefixes: [routes.notes, routes.posts],
	},
	{
		id: 'courses',
		status: 'archived',
		label: 'Khóa học Chương–Bài',
		description: 'Chương trình theo Chương → Bài học',
		icon: 'book',
		archiveGroup: 'Courses / Enrollments',
		adminHref: routes.admin.courses,
		adminPrefixes: [routes.admin.courses],
		publicPrefixes: [routes.learn, routes.learnPrograms],
	},
	{
		id: 'enrollments',
		status: 'archived',
		label: 'Học viên và ghi danh',
		description: 'Ghi danh học viên vào khóa học Chương–Bài',
		icon: 'groups',
		archiveGroup: 'Courses / Enrollments',
		adminHref: routes.admin.enrollments,
		adminPrefixes: [routes.admin.enrollments],
		publicPrefixes: [],
	},
	{
		id: 'my-class',
		status: 'archived',
		label: 'My Class',
		description: 'Studio nội dung, kiểm tra và từ vựng theo khóa',
		icon: 'school',
		archiveGroup: 'My Class',
		adminHref: routes.admin.myClass,
		adminPrefixes: [routes.admin.myClass],
		publicPrefixes: [routes.myClass, '/api/my-class'],
	},
	{
		id: 'myspace-tests',
		status: 'archived',
		label: 'Bài kiểm tra My Space',
		description: 'Đề kiểm tra công khai trong My Space',
		icon: 'quiz',
		archiveGroup: 'My Space Tests',
		adminHref: routes.admin.myspaceTests,
		adminPrefixes: [
			routes.admin.myspaceTests,
			routes.admin.myspaceQuestions,
			routes.admin.myspaceSubjects,
		],
		publicPrefixes: [routes.mySpaceTests, '/api/myspace-tests'],
	},
	{
		id: 'vocabulary',
		status: 'archived',
		label: 'Từ vựng',
		description: 'Kho từ vựng và cửa hàng bộ từ',
		icon: 'menu_book',
		archiveGroup: 'Vocabulary',
		adminHref: routes.admin.vocabulary,
		adminPrefixes: [routes.admin.vocabulary],
		publicPrefixes: ['/vocabulary'],
	},
	{
		id: 'lucky-card',
		status: 'archived',
		label: 'Lucky Card',
		description: 'Bộ thẻ may mắn',
		icon: 'campaign',
		archiveGroup: 'Lucky Card',
		adminHref: routes.admin.luckyCard,
		adminPrefixes: [routes.admin.luckyCard],
		publicPrefixes: [],
	},
	{
		id: 'messages',
		status: 'archived',
		label: 'Lời nhắn',
		description: 'Lời nhắn riêng qua đường dẫn /m/[slug]',
		icon: 'assignment',
		archiveGroup: 'Messages',
		adminHref: routes.admin.messages,
		adminPrefixes: [routes.admin.messages],
		publicPrefixes: [],
	},
	{
		id: 'users',
		status: 'archived',
		label: 'Người dùng',
		description: 'Tài khoản đã đăng ký',
		icon: 'groups',
		archiveGroup: 'Users',
		adminHref: routes.admin.users,
		adminPrefixes: [routes.admin.users],
		publicPrefixes: [],
	},
	{
		id: 'media',
		status: 'archived',
		label: 'Tệp media',
		description: 'Tệp tải lên',
		icon: 'upload',
		archiveGroup: 'Media',
		adminHref: routes.admin.media,
		adminPrefixes: [routes.admin.media],
		publicPrefixes: [],
	},
	{
		id: 'settings',
		status: 'archived',
		label: 'Cài đặt',
		description: 'Cấu hình hệ thống',
		icon: 'settings',
		archiveGroup: 'Settings',
		adminHref: routes.admin.settings,
		adminPrefixes: [routes.admin.settings],
		publicPrefixes: [],
	},
	{
		id: 'tools-hub',
		status: 'archived',
		label: 'Công cụ (hub cũ)',
		description: 'Trang tập hợp công cụ quản trị cũ',
		icon: 'dashboard',
		archiveGroup: 'Settings',
		adminHref: routes.admin.tools,
		adminPrefixes: [routes.admin.tools],
		publicPrefixes: [],
	},
] as const;

export type OperatingModuleId = (typeof OPERATING_MODULES)[number]['id'];

export function matchesPathPrefix(pathname: string, candidate: string): boolean {
	return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function rankedPrefixes(
	kind: 'admin' | 'public',
): Array<{ area: OperatingModule; prefix: string }> {
	const ranked: Array<{ area: OperatingModule; prefix: string }> = [];
	for (const area of OPERATING_MODULES) {
		const prefixes = kind === 'admin' ? area.adminPrefixes : area.publicPrefixes;
		for (const item of prefixes) {
			ranked.push({ area, prefix: item });
		}
	}
	ranked.sort((a, b) => b.prefix.length - a.prefix.length);
	return ranked;
}

const ADMIN_PREFIXES = rankedPrefixes('admin');
const PUBLIC_PREFIXES = rankedPrefixes('public');

export function resolveModuleByAdminPath(pathname: string): OperatingModule | null {
	for (const entry of ADMIN_PREFIXES) {
		if (matchesPathPrefix(pathname, entry.prefix)) return entry.area;
	}
	return null;
}

export function resolveModuleByPublicPath(pathname: string): OperatingModule | null {
	for (const entry of PUBLIC_PREFIXES) {
		if (matchesPathPrefix(pathname, entry.prefix)) return entry.area;
	}
	return null;
}

export function getActiveModules(): OperatingModule[] {
	return OPERATING_MODULES.filter((area) => area.status === 'active');
}

export function getArchivedModules(): OperatingModule[] {
	return OPERATING_MODULES.filter((area) => area.status === 'archived');
}

export function getArchivedModulesByGroup(): Array<{
	group: string;
	modules: OperatingModule[];
}> {
	const groups: Array<{ group: string; modules: OperatingModule[] }> = [];
	for (const area of getArchivedModules()) {
		const existing = groups.find((entry) => entry.group === area.archiveGroup);
		if (existing) {
			existing.modules.push(area);
			continue;
		}
		groups.push({ group: area.archiveGroup, modules: [area] });
	}
	return groups;
}

const MAIN_ADMIN_EXACT = new Set<string>([routes.admin.home]);

export function isMainAdminPath(pathname: string): boolean {
	if (MAIN_ADMIN_EXACT.has(pathname)) return true;
	const area = resolveModuleByAdminPath(pathname);
	return area?.status === 'active';
}

export function isArchivedAdminPath(pathname: string): boolean {
	if (!pathname.startsWith('/admin')) return false;
	if (pathname === routes.admin.archive || matchesPathPrefix(pathname, routes.admin.archive)) {
		return true;
	}
	if (isMainAdminPath(pathname)) return false;
	return true;
}

export function isArchivedPublicPath(pathname: string): boolean {
	const area = resolveModuleByPublicPath(pathname);
	return area?.status === 'archived';
}

export function getArchivedPublicPrefixes(): string[] {
	return getArchivedModules().flatMap((area) => [...area.publicPrefixes]);
}

export function getActiveAdminNavItems(): Array<{
	href: string;
	label: string;
	icon: McIconName;
}> {
	return getActiveModules().map((area) => ({
		href: area.adminHref,
		label: area.label,
		icon: area.icon,
	}));
}

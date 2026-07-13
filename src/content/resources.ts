import type { Resource } from './types';

/**
 * Lab resources. `concept` must never get a public detail route.
 * Only `published` + non-concept appear in the public hub.
 */
export const resources: Resource[] = [
	{
		slug: 'classroom-decision-game',
		title: 'Trò chơi quyết định trong lớp',
		summary: 'Boardgame / classroom game giúp nhóm luyện đưa quyết định có tiêu chí.',
		type: 'boardgame',
		audience: ['Giảng viên', 'Facilitator', 'Đội ngũ học tập nội bộ'],
		productStatus: 'prototype',
		access: 'public',
		instructions: 'Dùng trong lớp hoặc workshop nhỏ. Đây là bản prototype — phản hồi được chào đón.',
		privacyNote: 'Không thu thập dữ liệu người chơi qua website ở phiên bản này.',
		updatedAt: '2026-07-13',
		status: 'published',
	},
	{
		slug: 'learning-outcome-canvas',
		title: 'Learning Outcome Canvas',
		summary: 'Template một trang để viết mục tiêu học và dấu hiệu hoàn thành.',
		type: 'template',
		audience: ['Giảng viên', 'L&D', 'Mentor'],
		productStatus: 'beta',
		access: 'public',
		instructions: 'Tải / sao chép khung và chỉnh theo khóa học của bạn.',
		privacyNote: 'Template tĩnh — không gửi dữ liệu về máy chủ khi chỉ xem trang mô tả.',
		updatedAt: '2026-07-13',
		status: 'published',
	},
	{
		slug: 'internal-admin-tools',
		title: 'Công cụ quản trị nội bộ',
		summary: 'Không công khai — giữ trong admin.',
		type: 'tool',
		audience: ['Admin'],
		productStatus: 'concept',
		access: 'invite',
		updatedAt: '2026-07-13',
		status: 'draft',
	},
];

export function getPublishedResources(): Resource[] {
	return resources.filter((r) => r.status === 'published' && r.productStatus !== 'concept');
}

export function getResourceBySlug(slug: string): Resource | undefined {
	const resource = resources.find((r) => r.slug === slug);
	if (!resource || resource.status !== 'published' || resource.productStatus === 'concept') {
		return undefined;
	}
	return resource;
}

export function getResourcesByType(type: Resource['type']): Resource[] {
	return getPublishedResources().filter((r) => r.type === type);
}

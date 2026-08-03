import type { Resource } from './types';

/**
 * Lab resources. `concept` must never get a public detail route.
 * Only `published` + non-concept appear in the public hub.
 */
export const resources: Resource[] = [
	{
		slug: 'classroom-decision-game',
		title: 'Trò chơi quyết định trong lớp',
		summary: 'Trò chơi dạng bàn giúp một nhóm luyện cách đưa ra quyết định dựa trên tiêu chí.',
		type: 'boardgame',
		audience: ['Giảng viên', 'Người dẫn hoạt động', 'Đội ngũ đào tạo nội bộ'],
		productStatus: 'prototype',
		access: 'public',
		instructions: 'Dùng trong lớp hoặc một buổi thực hành nhóm nhỏ. Đây là bản thử nghiệm và mọi phản hồi đều hữu ích.',
		privacyNote: 'Không thu thập dữ liệu người chơi qua website ở phiên bản này.',
		updatedAt: '2026-07-13',
		status: 'published',
	},
	{
		slug: 'learning-outcome-canvas',
		title: 'Khung mục tiêu học tập',
		summary: 'Mẫu một trang để xác định mục tiêu học và dấu hiệu cho thấy mục tiêu đã hoàn thành.',
		type: 'template',
		audience: ['Giảng viên', 'Người phụ trách đào tạo', 'Người hướng dẫn'],
		productStatus: 'beta',
		access: 'public',
		instructions: 'Tải / sao chép khung và chỉnh theo khóa học của bạn.',
		privacyNote: 'Đây là mẫu tĩnh; dữ liệu không được gửi về máy chủ khi bạn chỉ xem trang mô tả.',
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

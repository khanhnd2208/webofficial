import type { Resource } from './types';

export const LAB_CATEGORY_META: Record<
	string,
	{ title: string; description: string; match: (r: Resource) => boolean }
> = {
	boardgame: {
		title: 'Trò chơi học tập',
		description: 'Trò chơi dành cho lớp học và các buổi thực hành nhóm.',
		match: (r) => r.type === 'boardgame',
	},
	'cong-cu': {
		title: 'Công cụ',
		description: 'Những công cụ nhỏ hỗ trợ việc học và giảng dạy.',
		match: (r) => r.type === 'tool',
	},
	'tai-nguyen': {
		title: 'Tài nguyên',
		description: 'Mẫu, hướng dẫn và bộ gợi ý có thể sử dụng lại.',
		match: (r) => r.type === 'template' || r.type === 'guide',
	},
	'thu-nghiem': {
		title: 'Thử nghiệm',
		description: 'Những bản thử nghiệm được chia sẻ công khai.',
		match: (r) => r.type === 'experiment',
	},
};

export function labCategoryForResource(type: Resource['type']): string {
	if (type === 'boardgame') return 'boardgame';
	if (type === 'tool') return 'cong-cu';
	if (type === 'experiment') return 'thu-nghiem';
	return 'tai-nguyen';
}

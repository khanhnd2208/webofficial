import type { Resource } from './types';

export const LAB_CATEGORY_META: Record<
	string,
	{ title: string; description: string; match: (r: Resource) => boolean }
> = {
	boardgame: {
		title: 'Boardgame & classroom game',
		description: 'Trò chơi học tập cho lớp và workshop.',
		match: (r) => r.type === 'boardgame',
	},
	'cong-cu': {
		title: 'Công cụ',
		description: 'Learning tool và mini tool công khai.',
		match: (r) => r.type === 'tool',
	},
	'tai-nguyen': {
		title: 'Tài nguyên',
		description: 'Template, guide và prompt pack.',
		match: (r) => r.type === 'template' || r.type === 'guide',
	},
	'thu-nghiem': {
		title: 'Thử nghiệm',
		description: 'Prototype và public experiment.',
		match: (r) => r.type === 'experiment',
	},
};

export function labCategoryForResource(type: Resource['type']): string {
	if (type === 'boardgame') return 'boardgame';
	if (type === 'tool') return 'cong-cu';
	if (type === 'experiment') return 'thu-nghiem';
	return 'tai-nguyen';
}

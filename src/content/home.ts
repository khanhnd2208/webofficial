import { routes } from '@/config/routes';

import { labCategoryForResource } from './lab';
import { getResourceBySlug } from './resources';
import type { Resource } from './types';

export type HomeExperience = {
	id: string;
	title: string;
	description: string;
	href: string;
	cta: string;
};

export type HomePageContent = {
	hero: {
		eyebrow: string;
		headline: [string, string];
		description: string;
		primaryCta: { label: string; href: string };
		articleCtaLabel: string;
		preferredArticleSlug: string;
		becomingQuote: string;
		learningCycle: string;
		caption: string;
	};
	experiences: {
		eyebrow: string;
		title: string;
		introduction: string;
		items: HomeExperience[];
	};
	selectedWork: {
		eyebrow: string;
		title: string;
		introduction: string;
	};
	writing: {
		eyebrow: string;
		title: string;
		description: string;
		archiveLabel: string;
	};
	writingInterlude: {
		quote: string;
		body: string;
	};
	closing: {
		quote: [string, string];
		title: string;
		paragraphs: string[];
		primaryCta: { label: string; href: string };
		secondaryCta: { label: string; href: string };
	};
};

export const homePageContent: HomePageContent = {
	hero: {
		eyebrow: 'Duy Khánh · Giảng viên',
		headline: [
			'Learning changes how we see —',
			'and how we act.',
		],
		description: 'Young lecturer, passionate about making education an art.',
		primaryCta: {
			label: 'Tìm hiểu về Khánh',
			href: routes.about,
		},
		articleCtaLabel: 'Đọc bài viết mới',
		preferredArticleSlug: 'loi-ngo',
		becomingQuote: 'Việc học thay đổi cách ta nhìn và cách ta làm.',
		learningCycle: 'Hiểu · Thử · Nhìn lại · Vận dụng',
		caption: 'Một giảng viên luôn tò mò về việc con người học và trưởng thành.',
	},
	experiences: {
		eyebrow: 'Học cùng tôi',
		title: 'Những cách bạn có thể học cùng tôi',
		introduction:
			'Mỗi người bước vào việc học với một câu hỏi khác nhau. Vì vậy, tôi không muốn tạo ra những sản phẩm chỉ để truyền tải thêm nội dung. Tôi muốn thiết kế những trải nghiệm gắn với vấn đề thực tế mà người học đang cố gắng hiểu và giải quyết.',
		items: [
			{
				id: 'in-class',
				title: 'Trong lớp học',
				description:
					'Những trải nghiệm học tập về quản trị, con người, giao tiếp và chiến lược — nơi lý thuyết được kết nối với những tình huống người học có thể thực sự gặp trong cuộc sống và công việc.',
				href: routes.aboutTeaching,
				cta: 'Khám phá cách tôi giảng dạy',
			},
			{
				id: 'beyond-class',
				title: 'Ngoài lớp học',
				description:
					'Các chuyên đề và chuỗi học tập dành cho những người muốn phát triển năng lực thực tế, thay vì chỉ hoàn thành thêm một khóa học.',
				href: routes.aboutTeaching,
				cta: 'Tìm hiểu các chương trình thực hành',
			},
			{
				id: 'development-conversations',
				title: 'Những cuộc trò chuyện phát triển',
				description:
					'Không phải nơi để nhận câu trả lời có sẵn, mà là không gian để nhìn rõ hơn điều bạn đang trải qua, đặt ra những câu hỏi tốt hơn và xây dựng hướng đi của riêng mình.',
				href: routes.aboutAdvisory,
				cta: 'Tìm hiểu cách tôi đồng hành',
			},
			{
				id: 'educational-collaboration',
				title: 'Cùng xây dựng một trải nghiệm học tập',
				description:
					'Hợp tác với trường học, tổ chức và những người làm giáo dục để phát triển chương trình, tình huống học tập, chuyên đề và những hệ thống giúp việc học trở nên thực chất hơn.',
				href: routes.aboutLearningDesign,
				cta: 'Trao đổi về một ý tưởng',
			},
		],
	},
	selectedWork: {
		eyebrow: 'Ý tưởng trong thực tế',
		title: 'Những điều tôi đang xây dựng',
		introduction:
			'Tôi thích đưa ý tưởng ra khỏi trang giấy. Đôi khi chúng trở thành một bài học, một chương trình, một công cụ hoặc một hệ thống giúp con người học tập và làm việc tốt hơn.',
	},
	writing: {
		eyebrow: 'Bài viết',
		title: 'Những ghi chép mới',
		description:
			'Từ lớp học, công việc và những quan sát đời thường — những điều tôi muốn nghĩ kỹ hơn, rồi viết lại cho rõ.',
		archiveLabel: 'Xem tất cả bài viết',
	},
	writingInterlude: {
		quote: 'Có những điều chỉ trở nên rõ ràng khi ta dành thời gian nhìn lại.',
		body: 'Tôi quan tâm đến những điều con người không thể giải thích hoàn toàn bằng logic: những lựa chọn sai, những bài học đến muộn, các mối quan hệ, sự trưởng thành và cách mỗi người tìm đường trở về với chính mình.',
	},
	closing: {
		quote: ['', ''],
		title: 'Có điều muốn trao đổi? Hãy gửi tôi vài dòng.',
		paragraphs: [],
		primaryCta: {
			label: 'Gửi lời nhắn',
			href: `${routes.contact}?sourcePage=%2F&ref=home-closing`,
		},
		secondaryCta: {
			label: 'Đọc thêm bài viết',
			href: routes.posts,
		},
	},
};

export function getHomeHeroArticleHref(posts: ReadonlyArray<{ slug: string }>): string {
	const preferredSlug = homePageContent.hero.preferredArticleSlug;
	return posts.some((post) => post.slug === preferredSlug)
		? routes.post(preferredSlug)
		: routes.posts;
}

export type HomeSelectedWork = {
	resource: Resource;
	href: string;
	description: string;
	labels: string[];
};

const HOME_RESOURCE_CONFIG: ReadonlyArray<{
	slug: string;
	description: string;
	labels: string[];
}> = [
	{
		slug: 'classroom-decision-game',
		description: 'Một bản thử nghiệm giúp các nhóm luyện cách ra quyết định dựa trên tiêu chí.',
		labels: ['Trò chơi học tập', 'Ra quyết định', 'Bản thử nghiệm'],
	},
	{
		slug: 'learning-outcome-canvas',
		description:
			'Một mẫu một trang để xác định mục tiêu học và những dấu hiệu cho thấy việc học thực sự đã hoàn thành.',
		labels: ['Thiết kế học tập', 'Mục tiêu đầu ra', 'Đang hoàn thiện'],
	},
];

export function getHomeSelectedWork(): HomeSelectedWork[] {
	return HOME_RESOURCE_CONFIG.flatMap((item) => {
		const resource = getResourceBySlug(item.slug);
		if (!resource) return [];

		return [
			{
				resource,
				href: `${routes.lab}/${labCategoryForResource(resource.type)}/${resource.slug}`,
				description: item.description,
				labels: item.labels,
			},
		];
	});
}

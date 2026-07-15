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

export type HomePrinciple = {
	id: string;
	title: string;
	description: string;
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
	manifesto: {
		eyebrow: string;
		title: string;
		paragraphs: string[];
		quote: [string, string];
	};
	principles: HomePrinciple[];
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
		eyebrow: 'DUY KHÁNH · EDUCATOR · EXPLORER',
		headline: ['Không chỉ học để biết.', 'Học để trở thành.'],
		description:
			'Tôi là Duy Khánh — một người làm giáo dục tin rằng kiến thức chỉ thực sự có ý nghĩa khi được trải nghiệm, phản tư và chuyển hóa thành năng lực sống.',
		primaryCta: {
			label: 'Khám phá cách tôi nhìn về giáo dục',
			href: routes.homeManifesto,
		},
		articleCtaLabel: 'Bắt đầu từ một bài viết',
		preferredArticleSlug: 'loi-ngo',
		becomingQuote: 'Learning is not only about knowing. It is about becoming.',
		learningCycle: 'Learn. Experience. Reflect. Become.',
		caption: 'A lecturer passionate about making education an art.',
	},
	manifesto: {
		eyebrow: 'TÔI TIN GÌ VỀ GIÁO DỤC',
		title: 'Tôi không tin rằng việc học nên kết thúc ở một tấm bằng.',
		paragraphs: [
			'Tôi tin rằng giáo dục tốt không chỉ truyền đạt kiến thức. Nó tạo ra những trải nghiệm đủ thật để người học phải suy nghĩ, thử nghiệm, mắc lỗi và tự xây dựng hiểu biết của riêng mình.',
			'Một bài học có ý nghĩa không chỉ giúp chúng ta trả lời đúng một câu hỏi. Nó thay đổi cách chúng ta nhìn nhận vấn đề, cách chúng ta đưa ra quyết định và cách chúng ta hiểu về chính mình.',
			'Vì vậy, điều tôi muốn tạo ra không chỉ là những lớp học. Đó là những không gian nơi kiến thức, trải nghiệm và sự phản tư gặp nhau — để việc học thực sự trở thành một phần của quá trình phát triển con người.',
		],
		quote: ['Giáo dục không chỉ là truyền đạt kiến thức.', 'Đó là thiết kế cho sự chuyển hóa.'],
	},
	principles: [
		{
			id: 'reality',
			title: 'Kiến thức phải gặp được thực tế',
			description:
				'Lý thuyết bắt đầu có ý nghĩa khi người học nhìn thấy nó trong công việc, các mối quan hệ và những quyết định của chính mình.',
		},
		{
			id: 'reflection',
			title: 'Trải nghiệm cần được phản tư',
			description: 'Chúng ta học khi biết dừng lại, đặt câu hỏi và hiểu điều gì thực sự đã xảy ra.',
		},
		{
			id: 'change',
			title: 'Việc học phải tạo ra thay đổi',
			description:
				'Giá trị của bài học nằm cả ở năng lực, nhận thức và cách hành động được hình thành sau đó.',
		},
	],
	experiences: {
		eyebrow: 'LEARNING WITH DUY KHÁNH',
		title: 'Những cách chúng ta có thể học cùng nhau',
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
					'Workshop và learning series dành cho những người muốn phát triển năng lực thực tế, thay vì chỉ hoàn thành thêm một khóa học.',
				href: routes.aboutTeaching,
				cta: 'Tìm hiểu workshop và learning series',
			},
			{
				id: 'development-conversations',
				title: 'Những cuộc trò chuyện phát triển',
				description:
					'Không phải nơi để nhận câu trả lời có sẵn, mà là không gian để nhìn rõ hơn điều bạn đang trải qua, đặt ra những câu hỏi tốt hơn và xây dựng hướng đi của riêng mình.',
				href: routes.aboutAdvisory,
				cta: 'Tìm hiểu cách chúng ta có thể trò chuyện',
			},
			{
				id: 'educational-collaboration',
				title: 'Cùng xây dựng một trải nghiệm học tập',
				description:
					'Hợp tác với trường học, tổ chức và những người làm giáo dục để phát triển chương trình, case study, workshop và những hệ thống giúp việc học trở nên thực chất hơn.',
				href: routes.aboutLearningDesign,
				cta: 'Trao đổi về một ý tưởng',
			},
		],
	},
	selectedWork: {
		eyebrow: 'IDEAS IN PRACTICE',
		title: 'Những điều tôi đang xây dựng',
		introduction:
			'Tôi thích đưa ý tưởng ra khỏi trang giấy. Đôi khi chúng trở thành một bài học, một chương trình, một công cụ hoặc một hệ thống giúp con người học tập và làm việc tốt hơn.',
	},
	writing: {
		eyebrow: 'HANOICAM',
		title: 'Những điều đáng để ở lại suy nghĩ lâu hơn',
		description:
			'HANOICAM — những ghi chép về con người, việc học và những điều nhìn thấy trên đường.',
		archiveLabel: 'Đọc những ghi chép mới nhất',
	},
	writingInterlude: {
		quote: 'Emotion leads us to bad decisions, great lessons—and always, somehow, back to love.',
		body: 'Tôi quan tâm đến những điều con người không thể giải thích hoàn toàn bằng logic: những lựa chọn sai, những bài học đến muộn, các mối quan hệ, sự trưởng thành và cách chúng ta tìm đường trở về với chính mình.',
	},
	closing: {
		quote: [
			'Bạn không cần biết toàn bộ con đường.',
			'Có lẽ bạn chỉ cần bắt đầu bằng một câu hỏi thật.',
		],
		title: 'Bạn đang muốn trở thành người như thế nào?',
		paragraphs: [
			'Có thể bạn đang tìm một cách học khác, một hướng đi rõ hơn, một trải nghiệm đủ sâu hoặc một người có thể cùng bạn nhìn lại vấn đề từ một góc độ mới.',
			'Chúng ta có thể bắt đầu bằng một cuộc trò chuyện.',
		],
		primaryCta: {
			label: 'Bắt đầu một cuộc trò chuyện',
			href: `${routes.contact}?sourcePage=%2F&ref=home-closing`,
		},
		secondaryCta: {
			label: 'Tiếp tục khám phá các ghi chép',
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
		description: 'Một prototype giúp các nhóm luyện ra quyết định dựa trên tiêu chí.',
		labels: ['Learning Game', 'Decision Making', 'Prototype'],
	},
	{
		slug: 'learning-outcome-canvas',
		description:
			'Một template một trang để xác định mục tiêu học và những dấu hiệu cho thấy việc học thực sự đã hoàn thành.',
		labels: ['Learning Design', 'Outcomes', 'Beta'],
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

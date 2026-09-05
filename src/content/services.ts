import type { InquiryType } from '@/features/inquiries/constants';

/**
 * Services page — a chooser, not a syllabus.
 * Landing shows three offers with short cards; depth lives behind accordion.
 */

export type ServiceTopicGroup = {
	title: string;
	items: readonly string[];
	note?: string;
};

export type ServiceOffer = {
	id: string;
	number: string;
	title: string;
	/** Who this is for — one sentence */
	audience: string;
	/** What changes — one sentence */
	outcome: string;
	/** Up to five focus topics shown on the card */
	topics: readonly string[];
	/** Delivery format chips */
	formats: readonly string[];
	cta: string;
	inquiryType: InquiryType;
	/** Depth shown only in accordion */
	details: readonly ServiceTopicGroup[];
	/** Optional principle line for AI accordion */
	principleStrip?: readonly string[];
	/** Optional deliverable labels for AI accordion */
	deliverables?: readonly { label: string; description: string }[];
};

export const servicesPage = {
	eyebrow: 'Dịch vụ',
	title: 'Chúng ta có thể bắt đầu từ một việc bạn muốn làm tốt hơn.',
	lead: 'Tôi thiết kế và trực tiếp triển khai các chương trình về quản trị, AI và năng lực học tập cho doanh nghiệp, đội nhóm và người học.',
	leadSecondary:
		'Nội dung có nền tảng học thuật rõ ràng, nhưng luôn được điều chỉnh theo người học, ngành nghề và những công việc họ thực sự cần thực hiện.',
	metaDescription:
		'Tôi thiết kế và triển khai chương trình quản trị, ứng dụng AI và học tập theo nhu cầu — rõ phạm vi, có phương pháp, điều chỉnh theo bối cảnh của bạn.',
	heroCtas: {
		scroll: 'Xem các hướng làm việc',
		contact: 'Gửi lời nhắn',
	},
	trustStrip: [
		'Giảng viên đại học',
		'Thiết kế và giảng dạy trực tiếp',
		'Điều chỉnh theo bối cảnh',
		'Triển khai Việt / Anh',
	] as const,
	offersHeading: 'Ba hướng chúng ta có thể bắt đầu',
} as const;

export const serviceOffers: readonly ServiceOffer[] = [
	{
		id: 'management-learning',
		number: '01',
		title: 'Đào tạo quản trị ứng dụng',
		audience: 'Dành cho quản lý, nhóm chuyên môn và đơn vị đào tạo.',
		outcome: 'Giúp người học tổ chức công việc, quản lý con người và ra quyết định có cơ sở.',
		topics: ['Quản trị nền tảng', 'Chiến lược', 'Nhân sự', 'Lãnh đạo', 'Giao tiếp và phối hợp'],
		formats: ['Chuyên đề', 'Workshop', 'Module ngắn', 'Lộ trình đào tạo'],
		cta: 'Trao đổi về chương trình quản trị',
		inquiryType: 'training',
		details: [
			{
				title: 'Quản trị nền tảng',
				items: [
					'Vai trò và công việc của nhà quản trị',
					'Lập kế hoạch và tổ chức công việc',
					'Ra quyết định',
					'Lãnh đạo và kiểm soát',
					'Phối hợp giữa con người và bộ phận',
				],
			},
			{
				title: 'Quản trị chiến lược',
				items: [
					'Tầm nhìn, sứ mệnh và mục tiêu',
					'Phân tích môi trường kinh doanh',
					'Nguồn lực và lợi thế cạnh tranh',
					'Lựa chọn chiến lược',
					'Triển khai và đánh giá chiến lược',
				],
			},
			{
				title: 'Quản trị nhân sự',
				items: [
					'Hoạch định nguồn nhân lực',
					'Tuyển dụng và lựa chọn nhân sự',
					'Đào tạo và phát triển',
					'Quản trị thành tích',
					'Lương thưởng và tạo động lực',
				],
			},
			{
				title: 'Hành vi và giao tiếp trong tổ chức',
				items: [
					'Động lực làm việc',
					'Làm việc nhóm',
					'Lãnh đạo',
					'Giao tiếp và phản hồi',
					'Xung đột và phối hợp trong tổ chức',
				],
			},
			{
				title: 'Vận hành và hiệu quả công việc',
				items: [
					'Thiết kế công việc',
					'Phân chia trách nhiệm',
					'Xây dựng và cải thiện quy trình',
					'Kiểm soát chất lượng',
					'Phối hợp hoạt động trong đội nhóm',
				],
			},
		],
	},
	{
		id: 'applied-ai',
		number: '02',
		title: 'AI cho công việc và quy trình',
		audience: 'Dành cho cá nhân, đội nhóm và doanh nghiệp đang cải thiện cách làm việc.',
		outcome:
			'Bắt đầu từ việc đang diễn ra: AI hỗ trợ phần nào, con người kiểm tra phần nào, và điều gì cần chuẩn hóa.',
		topics: [
			'Giao việc cho AI',
			'Kiểm chứng đầu ra',
			'Thiết kế quy trình',
			'Chuẩn hóa mẫu và hướng dẫn',
			'Số hóa công việc',
		],
		formats: ['Workshop thực hành', 'Đào tạo nội bộ', 'Tư vấn quy trình', 'Sprint thử nghiệm'],
		cta: 'Trao đổi về AI và quy trình',
		inquiryType: 'ai',
		details: [
			{
				title: 'AI cho công việc hằng ngày',
				items: [
					'Tìm hiểu và tổng hợp thông tin',
					'Lập kế hoạch',
					'Soạn thảo và chỉnh sửa nội dung',
					'Chuẩn bị tài liệu',
					'Phân tích vấn đề',
					'Hỗ trợ quá trình ra quyết định',
				],
			},
			{
				title: 'Thiết kế quy trình làm việc với AI',
				items: [
					'Xác định đúng nhiệm vụ và cung cấp đủ bối cảnh',
					'Quy định định dạng đầu ra và tiêu chí chất lượng',
					'Phân chia phần việc giữa con người và AI',
					'Thiết kế mẫu và hướng dẫn có thể sử dụng lại',
					'Kiểm tra chất lượng trước khi đưa vào sử dụng',
				],
			},
			{
				title: 'Số hóa vận hành',
				items: [
					'Nhận diện quy trình thủ công và phân mảnh',
					'Giảm việc nhập liệu lặp lại',
					'Chuẩn hóa thu thập và lưu trữ thông tin',
					'Cải thiện chia sẻ dữ liệu giữa các bộ phận',
					'Làm rõ trách nhiệm tại từng bước',
				],
			},
		],
		principleStrip: [
			'Bảo vệ dữ liệu',
			'Kiểm tra độ chính xác',
			'Con người giữ trách nhiệm cuối cùng',
		],
		deliverables: [
			{
				label: 'Bản đồ công việc',
				description: 'Những tác vụ phù hợp để ứng dụng AI',
			},
			{
				label: 'Quy trình đề xuất',
				description: 'Cách làm mới hoặc được cải thiện',
			},
			{
				label: 'Bộ hướng dẫn',
				description: 'Mẫu, checklist và tiêu chí kiểm tra',
			},
			{
				label: 'Kế hoạch thử nghiệm',
				description: 'Phạm vi, cách đánh giá và bước tiếp theo',
			},
		],
	},
	{
		id: 'learning-programs',
		number: '03',
		title: 'Tiếng Anh, tự học và AI cho người học',
		audience: 'Dành cho sinh viên, người đi làm, nhóm học tập và đơn vị giáo dục.',
		outcome:
			'Chương trình điều chỉnh theo trình độ, mục tiêu và cách người học cần áp dụng sau đó.',
		topics: ['Tiếng Anh', 'AI & tự học', 'Phương pháp học'],
		formats: ['Lớp học', 'Workshop', 'Chuyên đề', 'Chương trình thiết kế riêng'],
		cta: 'Trao đổi về chương trình học tập',
		inquiryType: 'learning-design',
		details: [
			{
				title: 'Tiếng Anh cho học tập và công việc',
				items: [
					'Giao tiếp bằng tiếng Anh',
					'Thảo luận và trình bày',
					'Sử dụng tiếng Anh trong môi trường học tập',
					'Tiếng Anh trong một số tình huống nghề nghiệp',
				],
			},
			{
				title: 'AI trong cuộc sống và tự học',
				items: [
					'Hiểu đúng khả năng và giới hạn của AI',
					'Sử dụng AI để tìm hiểu một chủ đề',
					'Đọc và giải thích tài liệu',
					'Lập kế hoạch học tập',
					'Luyện tập và tự đánh giá',
					'Kiểm tra thông tin do AI cung cấp',
				],
			},
			{
				title: 'Kỹ năng học tập',
				items: [
					'Đọc tài liệu có phương pháp',
					'Ghi chú và hệ thống hóa kiến thức',
					'Xây dựng câu hỏi',
					'Trình bày một ý tưởng rõ ràng',
					'Phát triển khả năng tự học',
				],
			},
			{
				title: 'Chương trình được thiết kế riêng',
				items: [
					'Mục tiêu của người học',
					'Thời lượng có sẵn',
					'Trình độ đầu vào',
					'Bối cảnh sử dụng kiến thức',
					'Kết quả mong đợi sau chương trình',
				],
				note: 'Một chuyên đề hoặc học phần mới có thể được xây dựng dựa trên:',
			},
		],
	},
] as const;

/** Single method infographic — three questions → suitable program. */
export const programDesign = {
	eyebrow: 'Cách làm việc',
	title: 'Một chương trình phù hợp không bắt đầu từ slide.',
	lead: 'Trước khi đề xuất nội dung, tôi cần hiểu ba điều:',
	questions: [
		{
			id: 'learner',
			label: 'Người học hoặc đội ngũ là ai?',
			body: 'Họ có nền tảng gì, đang làm công việc nào và đã biết gì về vấn đề?',
		},
		{
			id: 'blocker',
			label: 'Điều gì đang cản trở họ?',
			body: 'Họ thiếu kiến thức, thiếu kỹ năng, thiếu một cách làm rõ ràng hay đang khó áp dụng điều đã biết?',
		},
		{
			id: 'outcome',
			label: 'Sau chương trình, họ cần làm được gì tốt hơn?',
			body: 'Kết quả cần được mô tả bằng một khả năng có thể quan sát, không chỉ bằng tên một chủ đề cần học.',
		},
	],
	formula: 'Người học + Vấn đề thực tế + Kết quả cần đạt',
	output: 'Nội dung · Hình thức · Phạm vi phù hợp',
	note: 'Tùy nhu cầu, chương trình có thể là một buổi chuyên đề, workshop thực hành, module ngắn hoặc một lộ trình dài hơn.',
} as const;

export const servicesFaq = [
	{
		question: 'Chương trình có được thiết kế riêng không?',
		answer:
			'Một số kiến thức nền tảng có cấu trúc tương đối ổn định. Tuy nhiên, ví dụ, tình huống, hoạt động, mức độ chuyên sâu và đầu ra sẽ được điều chỉnh theo người học và bối cảnh.',
	},
	{
		question: 'Có thể chỉ triển khai trong một buổi không?',
		answer:
			'Có. Một nhu cầu cụ thể có thể được triển khai thành một buổi chia sẻ hoặc workshop. Những mục tiêu rộng hơn sẽ cần module hoặc lộ trình dài hơn.',
	},
	{
		question: 'Tư vấn AI có bao gồm xây dựng phần mềm không?',
		answer:
			'Trọng tâm của tôi là xác định trường hợp sử dụng, thiết kế cách làm, cải thiện quy trình và hỗ trợ thử nghiệm. Những dự án cần phát triển hệ thống kỹ thuật chuyên sâu có thể cần thêm đối tác công nghệ.',
	},
] as const;

export const servicesClosing = {
	title: 'Bạn chưa cần có một đề bài hoàn chỉnh.',
	lead: 'Hãy cho tôi biết người học hoặc đội ngũ là ai, điều gì đang khiến công việc hoặc việc học chưa hiệu quả, và bạn mong họ có thể làm được gì tốt hơn.',
	after: 'Từ đó, chúng ta có thể cùng xác định hướng đi, hình thức và phạm vi phù hợp.',
	cta: 'Gửi lời nhắn',
} as const;

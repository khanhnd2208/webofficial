/**
 * A short introduction focused on learning management and finding an adviser.
 * Detailed project records and service curricula remain their source of truth.
 */

export const aboutHero = {
	/** Full public name — page H1, schema and metadata */
	fullName: 'Nguyễn Duy Khánh',
	role: 'Giảng viên Quản trị',
	organisation: 'Trường Đại học Hà Nội',
	promise:
		'Học quản trị và cùng phân tích những vấn đề thực tế để tổ chức công việc, cân nhắc lựa chọn và ra quyết định.',
	pillars: ['Quản trị', 'Thiết kế học tập', 'AI ứng dụng'] as const,
	/** Personal line kept for metadata continuity; not shown on the page. */
	quote:
		'Emotion guides us to bad decisions but great lessons, and always to love. Young lecturer, passionate about making education an art.',
	manifesto: 'Tôi vẫn đang học cách trở thành một người thầy tốt hơn.',
	ctas: {
		projects: 'Khám phá công việc của tôi',
		contact: 'Gửi lời nhắn',
	},
} as const;

export const aboutPrinciples = {
	title: 'Điều tôi theo đuổi',
	body: 'Với tôi, một lớp học tốt cần kiến thức chính xác, cơ hội thực hành và sự chăm chút trong cách dẫn dắt. Tôi muốn người học hiểu được mối liên hệ giữa các ý tưởng và biết vận dụng vào tình huống của mình.',
} as const;

export const aboutProjects = {
	id: 'du-an',
	title: 'Một vài việc tôi đang làm',
	items: [
		{
			slug: 'strategic-management-learning-experience',
			title: 'Học quản trị chiến lược',
			summary:
				'Thiết kế trải nghiệm học giúp sinh viên nối phân tích, lựa chọn và thực thi qua tình huống doanh nghiệp.',
		},
		{
			slug: 'ai50-ai-cho-moi-nguoi',
			title: 'AI50 — AI cho mọi người',
			summary: 'Chương trình giúp người mới hiểu AI, giao việc rõ và kiểm chứng kết quả.',
		},
		{
			slug: 'learning-at-moonie-cafe',
			title: 'Học quản trị tại Moonie Café',
			summary:
				'Phát triển trải nghiệm học từ việc quan sát một doanh nghiệp dịch vụ đang vận hành.',
		},
	] as const,
	cta: 'Xem dự án',
	research: {
		slug: 'ai-in-recruitment-research',
		label: 'Tôi cũng đang nghiên cứu về AI trong tuyển dụng',
	},
} as const;

export const aboutCollaboration = {
	id: 'dich-vu',
	title: 'Chúng ta có thể làm gì cùng nhau?',
	items: [
		{
			id: 'management-learning',
			title: 'Đào tạo quản trị',
			description:
				'Chương trình cho quản lý, đội nhóm và đơn vị đào tạo, gắn kiến thức với tổ chức công việc và ra quyết định.',
		},
		{
			id: 'applied-ai',
			title: 'Ứng dụng AI vào công việc',
			description: 'Cùng xác định việc phù hợp, thiết kế quy trình và cách kiểm tra đầu ra.',
		},
		{
			id: 'learning-programs',
			title: 'Học tập và tiếng Anh',
			description: 'Chương trình phù hợp với mục tiêu, trình độ và bối cảnh sử dụng của người học.',
		},
	],
	disclosure: 'Xem nội dung và hình thức',
	principle: 'Tôi bắt đầu từ người học, vấn đề thực tế và điều họ cần làm được.',
} as const;

export const aboutBackground = {
	title: 'Nền tảng',
	/**
	 * Each place needs its role (dạy / học / nghiên cứu) and years before it
	 * can move from a plain list into a dated timeline — owner to confirm.
	 */
	current: 'Giảng viên, Khoa Quản trị Kinh doanh và Du lịch, Trường Đại học Hà Nội.',
	placesLabel: 'Những nơi tôi đã dạy và học',
	places: [
		'Đại học Hà Nội',
		'Đại học Quốc gia',
		'Đại học Kinh tế',
		'Đại học Thương mại',
		'La Trobe University',
		'IMC Krems',
	] as const,
} as const;

export const aboutClosing = {
	title: 'Bắt đầu bằng một lời nhắn',
	lead: 'Bạn đang tìm một chương trình cho lớp học, đội nhóm hay chính mình? Hãy kể tôi nghe về bối cảnh và điều bạn muốn làm tốt hơn. Một vài dòng là đủ để bắt đầu.',
	cta: 'Gửi lời nhắn',
} as const;

/** Concise credentials for schema / quiet attribution. */
export const aboutCredentials = {
	items: [
		'Giảng viên, Khoa Quản trị Kinh doanh và Du lịch',
		'Trường Đại học Hà Nội · Hà Nội, Việt Nam',
	],
} as const;

/** The two primary ways to work with Khánh. */
export const aboutFocus = {
	title: 'Tôi là Khánh.',
	offers: [
		{
			id: 'hoc-quan-tri',
			title: 'Học quản trị cùng tôi',
			description:
				'Hiểu các ý tưởng quản trị qua tình huống thực tế, để vận dụng vào tổ chức công việc và ra quyết định.',
			inquiryType: 'training',
			cta: 'Trao đổi về việc học',
		},
		{
			id: 'co-van',
			title: 'Cố vấn quản trị',
			description:
				'Cùng phân tích vấn đề bạn đang gặp, cân nhắc các lựa chọn và tìm hướng đi phù hợp với bối cảnh của bạn.',
			inquiryType: 'business',
			cta: 'Trao đổi về cố vấn',
		},
	] as const,
	experienceLead: 'Ngoài lớp học, tôi còn học qua những dự án, chuyến đi và câu chuyện đời thường.',
	experienceCta: 'Ghé xem trải nghiệm của tôi',
} as const;

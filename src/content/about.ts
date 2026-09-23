/**
 * About page content — a professional profile for people considering
 * working or learning with Khánh: who he is, the programmes on offer,
 * selected projects, background, then one conversation-starting CTA.
 */

export const aboutHero = {
	/** Full public name — page H1, schema and metadata */
	fullName: 'Nguyễn Duy Khánh',
	role: 'Giảng viên Quản trị',
	organisation: 'Trường Đại học Hà Nội',
	promise:
		'Tôi giúp người học và tổ chức biến kiến thức quản trị và AI thành năng lực, chương trình và quy trình có thể áp dụng.',
	pillars: ['Management Education', 'Learning Design', 'Applied AI'] as const,
	/** Personal line kept for metadata continuity; not shown on the page. */
	quote:
		'Emotion guides us to bad decisions but great lessons, and always to love. Young lecturer, passionate about making education an art.',
	manifesto: 'Tôi vẫn đang học cách trở thành một người thầy tốt hơn.',
	ctas: {
		programs: 'Xem chương trình',
		contact: 'Gửi lời nhắn',
	},
} as const;

export const aboutPrograms = {
	id: 'chuong-trinh',
	title: 'Chương trình tôi đang triển khai',
	lead: 'Mỗi chương trình được điều chỉnh theo người học, ngành nghề và công việc họ thực sự cần làm.',
	cta: 'Xem chi tiết các chương trình',
} as const;

export const aboutProjects = {
	title: 'Dự án tiêu biểu',
	/** Slugs from features/portfolio — only projects with a public case page. */
	featuredSlugs: [
		'strategic-management-learning-experience',
		'ai50-ai-cho-moi-nguoi',
		'learning-at-moonie-cafe',
	] as const,
	cta: 'Xem tất cả dự án',
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
	principle: 'Hiểu đúng vấn đề trước khi tìm giải pháp.',
	lead: 'Nếu bạn đang cân nhắc một chương trình cho đội nhóm, lớp học hay chính mình, hãy bắt đầu bằng một lời nhắn ngắn.',
	cta: 'Gửi lời nhắn',
} as const;

/** Concise credentials for schema / quiet attribution. */
export const aboutCredentials = {
	items: [
		'Giảng viên, Khoa Quản trị Kinh doanh và Du lịch',
		'Trường Đại học Hà Nội · Hà Nội, Việt Nam',
	],
} as const;

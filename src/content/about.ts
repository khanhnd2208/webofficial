/**
 * About page content — journey-map profile.
 * Structure mirrors the approved editorial mockup: hero portrait,
 * current work → classrooms → projects, then a closing quote.
 */

export const aboutHero = {
	greeting: 'Xin chào, mình là',
	/** Short first-person display name under the greeting */
	name: 'Khánh',
	/** Full legal name for schema / metadata */
	fullName: 'Nguyễn Duy Khánh',
	quote:
		'Emotion guides us to bad decisions but great lessons, and always to love. Young lecturer, passionate about making education an art.',
	portraitCaption: 'Chân dung minh họa',
	/** Brand manifesto — kept for metadata / continuity; not the page H1. */
	manifesto: 'Tôi vẫn đang học cách trở thành một người thầy tốt hơn.',
} as const;

export type AboutWorkItem = {
	id: string;
	title: string;
	body: string;
	icon: 'teaching' | 'design' | 'ai';
};

export type AboutProjectItem = {
	id: string;
	title: string;
	lines: readonly string[];
	icon: 'factory' | 'moon' | 'forum' | 'camera' | 'pets';
	href?: string;
};

export const aboutJourney = {
	title: 'Lớp học, công việc và những thử nghiệm',
	currentWork: {
		label: 'A',
		title: 'Công việc hiện tại',
		items: [
			{
				id: 'teaching',
				title: 'Giảng dạy',
				body: 'Quản trị, nhân sự, chiến lược, giao tiếp',
				icon: 'teaching',
			},
			{
				id: 'design',
				title: 'Thiết kế trải nghiệm học',
				body: 'Học liệu, case study, hoạt động lớp học',
				icon: 'design',
			},
			{
				id: 'ai',
				title: 'Ứng dụng AI tạo sinh',
				body: 'Công nghệ hỗ trợ học tập và công việc',
				icon: 'ai',
			},
		] as AboutWorkItem[],
	},
	classrooms: {
		label: 'B',
		title: 'Những lớp học đã đi qua',
		items: [
			'Đại học Hà Nội',
			'Đại học Quốc gia',
			'Đại học Kinh tế',
			'Đại học Thương mại',
			'La Trobe University',
			'IMC Krems',
		] as const,
	},
	projects: {
		label: 'C',
		title: 'Một vài dự án đã làm',
		items: [
			{
				id: 'mini-erp',
				title: 'Mini ERP cho xưởng nhựa',
				lines: ['Mini ERP', 'cho xưởng nhựa'],
				icon: 'factory',
			},
			{
				id: 'moonie',
				title: 'Moonie',
				lines: ['Moonie'],
				icon: 'moon',
				href: '/du-an/learning-at-moonie-cafe',
			},
			{
				id: 'wang',
				title: 'WANG Language',
				lines: ['WANG', 'Language'],
				icon: 'forum',
			},
			{
				id: 'hanoicam',
				title: 'Hanoicam',
				lines: ['Hanoicam'],
				icon: 'camera',
			},
			{
				id: 'kiddogo',
				title: 'Kiddogo',
				lines: ['Kiddogo'],
				icon: 'pets',
			},
		] as AboutProjectItem[],
	},
} as const;

export const aboutClosing = {
	quote:
		'Từ lớp học đến dự án, tôi luôn quan tâm đến cách một ý tưởng có thể được hiểu rõ và dùng được trong đời sống.',
} as const;

/** Concise credentials for schema / quiet attribution — not a page section. */
export const aboutCredentials = {
	items: [
		'Giảng viên, Khoa Quản trị Kinh doanh và Du lịch',
		'Trường Đại học Hà Nội · Hà Nội, Việt Nam',
	],
	closing: 'Tôi dạy, học và viết từ Hà Nội.',
} as const;

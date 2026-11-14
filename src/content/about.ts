/** Who Khánh is and what he can work on with others; shown on Về tôi (/lien-he). */

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
} as const;

import { SITE_EYEBROW, PERSONAL_MARK } from '@/config/site';
import { routes } from '@/config/routes';

export const aboutContent = {
	title: `Tôi & Dịch vụ`,
	eyebrow: SITE_EYEBROW,
	heroHeadline: 'Tôi dạy để cùng người khác nhìn thế giới rộng hơn.',
	intro:
		'Tôi là giảng viên, người thiết kế trải nghiệm học tập, và một người luôn tò mò về con người, tổ chức và thế giới quanh mình.',
	journey: [
		{
			title: 'Giảng dạy',
			body: 'Dẫn dắt không gian học nơi người học được nhìn rõ bài toán, thử phương pháp, và mang theo cách nghĩ mới.',
		},
		{
			title: 'Thiết kế trải nghiệm học',
			body: 'Chuyển mục tiêu thành lộ trình, hoạt động và dấu vết học tập — để học không dừng ở cảm giác “đã nghe”.',
		},
		{
			title: 'Khám phá & đồng hành',
			body: 'Cùng cá nhân và tổ chức làm rõ hướng đi, rồi chọn bước tiếp theo khả thi trong bối cảnh thật.',
		},
	],
	roles: [
		{
			title: 'Educator',
			body: 'Giảng dạy và facilitation — tạo không gian học có mục tiêu, hoạt động và phản hồi.',
		},
		{
			title: 'Learning Designer',
			body: 'Thiết kế chương trình, module và trải nghiệm học gắn với hành vi cần thay đổi.',
		},
		{
			title: 'Explorer',
			body: 'Giữ sự tò mò về con người, tổ chức và thế giới — rồi viết, thử và chia sẻ những gì đã kiểm chứng.',
		},
	],
	philosophy: [
		'Hiểu đúng bài toán trước khi tối ưu công cụ.',
		'Học phải để lại dấu vết: quyết định, hành động, phản hồi.',
		'AI là năng lực xuyên suốt — hữu ích khi có quy trình và ranh giới rõ.',
		'Không hứa kết quả ngoài tầm kiểm soát.',
	],
	process: [
		{
			title: 'Làm rõ',
			description: 'Nghe bối cảnh, ràng buộc và kết quả mong muốn — trước khi đề xuất phạm vi.',
		},
		{
			title: 'Thiết kế',
			description: 'Chọn hình thức phù hợp: workshop, chương trình học, hoặc tư vấn phát triển.',
		},
		{
			title: 'Đồng hành',
			description: 'Triển khai có nhịp phản hồi; dừng đúng lúc khi mục tiêu đã đủ rõ.',
		},
	],
	/** Only owner-verified milestones. Empty = section hidden. */
	milestones: [] as { id: string; label: string; detail: string }[],
	limits: [
		'Không trị liệu, pháp lý, tài chính đầu tư.',
		'Không làm hộ công việc hay cam kết việc làm.',
		'Không mở chatbot / marketplace trong giai đoạn này.',
	],
	outsideWork: `Ngoài công việc, ${PERSONAL_MARK} giữ nhịp đọc – viết – thử nghiệm học cụ và trò chơi học tập.`,
	ctas: [
		{ href: routes.contact, label: 'Kết nối' },
		{ href: routes.posts, label: 'Đọc bài viết' },
	],
} as const;

export const homeContent = {
	heroHeadline: 'Tôi dạy để cùng người khác nhìn thế giới rộng hơn.',
	heroSupporting:
		'Tôi là một giảng viên, người thiết kế trải nghiệm học tập và một người luôn tò mò về con người, tổ chức và thế giới quanh mình.',
	heroPrimaryCta: { href: '/#hanh-trinh', label: 'Khám phá hành trình' },
	heroSecondaryCta: { href: routes.aboutServices, label: 'Xem tôi có thể đồng hành thế nào' },
	manifesto: [
		'Tôi tin học tập tốt nhất xảy ra khi người học được nhìn thế giới rộng hơn — không chỉ nhận thêm thông tin.',
		'Mỗi buổi học, mỗi chương trình, mỗi cuộc trò chuyện đều là một hành trình nhỏ: làm rõ, thử, và mang theo cách nghĩ mới.',
		'AI có thể hỗ trợ, nhưng không thay thế sự hiểu biết về con người và tổ chức.',
	],
	closingCta: {
		quote: 'Một cuộc trò chuyện tốt đôi khi là điểm bắt đầu của một hành trình mới.',
		href: routes.contact,
		label: 'Kết nối',
	},
} as const;

export const archiveContent = {
	title: 'Archive',
	intro:
		'Các bề mặt công khai cũ được giữ lại để tham chiếu. Nội dung tại đây không còn nằm trong hành trình marketing chính.',
	links: [
		{ href: '/goc-cua-khanh', label: 'Góc của Khánh (lab)', note: 'Tài nguyên & thử nghiệm' },
		{ href: '/hoc', label: 'Học (catalog công khai cũ)', note: 'Khu học viên vẫn dùng /tai-khoan/hoc' },
		{ href: '/case-study', label: 'Case study', note: 'Chuyển về dấu mốc trên Tôi & Dịch vụ khi có dữ liệu xác minh' },
	],
} as const;

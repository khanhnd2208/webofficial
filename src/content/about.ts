import { SITE_EYEBROW, SITE_NAME, PERSONAL_MARK } from '@/config/site';

export const aboutContent = {
	title: `Về ${SITE_NAME}`,
	eyebrow: SITE_EYEBROW,
	intro:
		'Duy Khánh làm việc ở giao điểm giảng dạy, mentoring và cố vấn — giúp cá nhân và tổ chức làm rõ hướng đi, rồi hành động có phương pháp.',
	whoIAm: [
		'Giảng viên và người thiết kế trải nghiệm học.',
		'Mentor cho sinh viên, young professional và first-time manager.',
		'Cố vấn ngắn hạn cho founder / đội ngũ trẻ khi cần làm rõ bài toán trước khi mở rộng.',
	],
	careAbout: [
		'Hiểu đúng bài toán trước khi tối ưu công cụ.',
		'Học phải để lại dấu vết: quyết định, hành động, phản hồi.',
		'Tri thức công khai nên rõ ranh giới: cái gì mở, cái gì giữ riêng.',
	],
	work: [
		{
			title: 'Đồng hành',
			body: 'Mentoring, cố vấn doanh nghiệp, đào tạo/workshop và AI ứng dụng — theo nhu cầu, không theo menu giá.',
		},
		{
			title: 'HANOICAM Journal',
			body: 'Không gian biên tập để viết và hệ thống hóa góc nhìn — không thay thế toàn bộ thương hiệu cá nhân.',
		},
		{
			title: 'Góc của Khánh',
			body: 'Lab tài nguyên: boardgame, template, công cụ thử nghiệm — luôn gắn status và access rõ.',
		},
	],
	philosophy: [
		'Hiểu đúng → Kết nối → Làm rõ → Hành động.',
		'Không hứa kết quả ngoài tầm kiểm soát.',
		'Không dùng dữ liệu giả để tạo niềm tin.',
	],
	limits: [
		'Không trị liệu, pháp lý, tài chính đầu tư.',
		'Không làm hộ công việc hay cam kết việc làm.',
		'Không mở chatbot / marketplace trong giai đoạn này.',
	],
	outsideWork: `Ngoài công việc, ${PERSONAL_MARK} giữ nhịp đọc – viết – thử nghiệm học cụ và trò chơi học tập.`,
	ctas: [
		{ href: '/dong-hanh', label: 'Đồng hành' },
		{ href: '/bai-viet', label: 'HANOICAM' },
		{ href: '/lien-he?type=unsure', label: 'Liên hệ' },
	],
} as const;

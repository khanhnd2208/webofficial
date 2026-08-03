import { routes } from '@/config/routes';

export const aboutContent = {
	title: 'Giới thiệu',
	eyebrow: 'Đôi nét về tôi',
	heroHeadline: 'Tôi là Duy Khánh',
	intro:
		'Giảng viên, người thiết kế chương trình học và người viết. Tôi dành phần lớn thời gian cho lớp học, việc thiết kế chương trình và những câu hỏi về cách con người học, làm việc và trưởng thành trong đời sống thực.',
	journey: [
		{
			anchorId: 'giang-day-workshop',
			title: 'Giảng dạy và workshop',
			body: 'Tôi dạy về quản trị, con người, giao tiếp và chiến lược, kết hợp lý thuyết với những tình huống người học có thể gặp trong công việc và đời sống.',
		},
		{
			anchorId: 'thiet-ke-chuong-trinh',
			title: 'Thiết kế chương trình học',
			body: 'Tôi cùng trường học hoặc tổ chức xây dựng mục tiêu, lộ trình, hoạt động và cách đánh giá cho một chương trình học.',
		},
		{
			anchorId: 'tu-van-phat-trien',
			title: 'Trao đổi và tư vấn',
			body: 'Tôi góp ý cho cá nhân hoặc đội ngũ đang cần nhìn rõ hơn một quyết định về học tập, công việc hoặc cách làm việc cùng nhau.',
		},
	],
	roles: [
		{
			title: 'Giảng viên',
			body: 'Giảng dạy và dẫn dắt những không gian học có mục tiêu, hoạt động và phản hồi.',
		},
		{
			title: 'Người thiết kế chương trình học',
			body: 'Thiết kế chương trình, bài học và hoạt động gắn với điều người học cần thực hành.',
		},
		{
			title: 'Người luôn tò mò',
			body: 'Giữ sự tò mò về con người, tổ chức và thế giới — rồi viết, thử và chia sẻ những gì đã kiểm chứng.',
		},
	],
	philosophy: [
		'Tôi thường bắt đầu bằng việc hiểu người học thực sự cần gì.',
		'Tôi muốn mỗi buổi học để lại một điều có thể áp dụng.',
		'Tôi sử dụng AI như một công cụ hỗ trợ, nhưng không để nó thay thế suy nghĩ và trách nhiệm của con người.',
		'Tôi chỉ nhận những công việc mà mình thực sự có thể đóng góp.',
	],
	/** Only owner-verified milestones. Empty = section hidden. */
	milestones: [] as { id: string; label: string; detail: string }[],
	limits: [
		'Không trị liệu, pháp lý, tài chính đầu tư.',
		'Không làm hộ công việc hay cam kết việc làm.',
		'Không mở chatbot / marketplace trong giai đoạn này.',
	],
	outsideWork:
		'Ngoài lớp học, tôi giữ thói quen đọc, viết và thử làm những học cụ nhỏ. HANOICAM là góc viết nơi tôi ghi lại những điều mình quan sát về con người, công việc và cuộc sống.',
	ctas: [
		{ href: routes.posts, label: 'Đọc bài viết' },
		{ href: routes.contact, label: 'Gửi lời nhắn' },
	],
} as const;

export const homeContent = {
	heroHeadline: 'Việc học không dừng ở điều ta biết. Nó thay đổi cách ta nhìn và cách ta làm.',
	heroSupporting:
		'Tôi là Duy Khánh, một giảng viên. Trong lớp học, tôi giúp người học hiểu rõ vấn đề, thử một cách làm và mang điều vừa học vào công việc lẫn đời sống.',
	heroPrimaryCta: { href: routes.posts, label: 'Đọc bài viết mới' },
	heroSecondaryCta: { href: routes.aboutServices, label: 'Xem những công việc tôi đang làm' },
	manifesto: [
		'Tôi bắt đầu từ một tình huống có thật để người học biết vấn đề mình đang giải quyết.',
		'Người học được thử một cách làm, nhìn lại kết quả và điều chỉnh dựa trên điều vừa trải nghiệm.',
		'Mỗi buổi học khép lại bằng một bước cụ thể để tiếp tục vận dụng sau lớp.',
	],
	closingCta: {
		quote: 'Có một câu hỏi bạn muốn nhìn cho rõ hơn? Hãy gửi tôi vài dòng.',
		href: routes.contact,
		label: 'Gửi lời nhắn',
	},
} as const;

export const archiveContent = {
	title: 'Lưu trữ',
	intro: 'Các nội dung và công cụ cũ được lưu tại đây để người đọc tiện tham khảo.',
	links: [
		{ href: '/goc-cua-khanh', label: 'Góc của Khánh', note: 'Tài nguyên và những thử nghiệm nhỏ' },
		{ href: '/hoc', label: 'Khu học cũ', note: 'Học viên tiếp tục học trong Khu học tập' },
		{
			href: '/case-study',
			label: 'Dấu mốc cũ',
			note: 'Được chuyển về trang Giới thiệu khi có thông tin xác minh',
		},
	],
} as const;

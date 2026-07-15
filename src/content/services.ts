import { UNIFIED_PRICING_NOTE } from './pricing';
import type { Service } from './types';

/**
 * Three public services. Mentoring and business advisory are contexts under
 * “Tư vấn phát triển”. AI is a cross-cutting capability, not a separate service.
 */
export const services: Service[] = [
	{
		slug: 'giang-day-workshop',
		title: 'Giảng dạy và workshop',
		shortTitle: 'Giảng dạy',
		anchorId: 'giang-day-workshop',
		summary:
			'Dạy về quản trị, con người, giao tiếp và chiến lược, kết hợp lý thuyết với những tình huống thực tế.',
		audience: [
			'Doanh nghiệp cần đào tạo nội bộ theo chủ đề cụ thể',
			'Đội ngũ quản lý cấp trung',
			'Nhóm giảng viên / facilitator muốn nâng chất lượng buổi học',
		],
		problems: [
			'Đào tạo mang tính “slide nhiều, nhớ ít”',
			'Chưa gắn mục tiêu học với việc đội ngũ cần làm khác đi',
			'Cần hình thức linh hoạt: nửa ngày, một ngày hoặc chuỗi ngắn',
		],
		notFor: [
			'Khóa học đại trà bán vé công khai (marketplace)',
			'Chứng chỉ hành nghề hoặc chương trình được kiểm định bên thứ ba',
		],
		outcomes: [
			'Người tham dự hiểu mục tiêu, hoạt động và tiêu chí áp dụng',
			'Có tài liệu / khung để đội ngũ tiếp tục sau buổi học',
			'Sponsor nội bộ biết cách đo mức độ áp dụng tối thiểu',
		],
		deliverables: [
			'Đề xuất learning outcomes và agenda',
			'Facilitation plan + hoạt động',
			'Tài liệu tóm tắt cho người tham dự (theo phạm vi đã chốt)',
		],
		process: [
			{
				title: 'Làm rõ đối tượng & mục tiêu',
				description: 'Ai học, cần thay đổi hành vi gì, ràng buộc thời gian.',
			},
			{
				title: 'Thiết kế & duyệt',
				description: 'Agenda, hoạt động, tài liệu — điều chỉnh theo phản hồi sponsor.',
			},
			{
				title: 'Dẫn dắt & chốt',
				description: 'Facilitation tại chỗ hoặc online; tóm tắt đầu ra sau buổi.',
			},
		],
		formats: [
			{ name: 'Workshop nửa ngày / một ngày', description: 'Tập trung một chủ đề với hoạt động thực hành.' },
			{ name: 'Chuỗi ngắn', description: '2–4 buổi để xây thói quen áp dụng.' },
		],
		contexts: [],
		pricingNote: UNIFIED_PRICING_NOTE,
		faq: [
			{
				question: 'Có tùy chỉnh theo ngành không?',
				answer:
					'Có. Nội dung được chỉnh theo đối tượng, số người, mục tiêu và ràng buộc thời gian của tổ chức.',
			},
		],
		relatedCaseSlugs: [],
		relatedArticleSlugs: [],
		inquiryType: 'training',
		status: 'published',
	},
	{
		slug: 'thiet-ke-chuong-trinh',
		title: 'Thiết kế chương trình học',
		shortTitle: 'Thiết kế học',
		anchorId: 'thiet-ke-chuong-trinh',
		summary:
			'Cùng trường học hoặc tổ chức xây dựng mục tiêu, lộ trình, hoạt động và cách đánh giá cho một chương trình học.',
		audience: [
			'Tổ chức cần thiết kế lại chương trình đào tạo nội bộ',
			'Đội ngũ L&D / học thuật muốn khung học rõ ràng hơn',
			'Người đang mở khóa học hoặc chuỗi học có mục tiêu cụ thể',
		],
		problems: [
			'Có nội dung rời rạc nhưng thiếu lộ trình và tiêu chí hoàn thành',
			'Người học không biết mình đang tiến tới đâu',
			'Muốn dùng AI hỗ trợ học nhưng chưa có khung trách nhiệm',
		],
		notFor: [
			'Outsource toàn bộ vận hành LMS thay đội ngũ nội bộ',
			'Cam kết chứng chỉ bên thứ ba hoặc kiểm định nghề nghiệp',
		],
		outcomes: [
			'Có bản đồ học tập với outcomes và thứ tự module rõ',
			'Có tiêu chí đánh giá / hoàn thành tối thiểu',
			'Có nguyên tắc dùng AI trong học tập (nếu phù hợp phạm vi)',
		],
		deliverables: [
			'Learning map / outline chương trình',
			'Mẫu hoạt động và rubric rút gọn',
			'Gợi ý nhịp triển khai 30–90 ngày',
		],
		process: [
			{
				title: 'Làm rõ mục tiêu học',
				description: 'Ai học, cần làm được gì sau chương trình, ràng buộc thời gian và nguồn lực.',
			},
			{
				title: 'Thiết kế cấu trúc',
				description: 'Module, hoạt động, tài liệu, điểm kiểm chứng — duyệt từng vòng ngắn.',
			},
			{
				title: 'Chuyển giao để vận hành',
				description: 'Bạn (hoặc đội ngũ) giữ quyền sở hữu; Khánh hỗ trợ chỉnh đến khi đủ rõ để chạy.',
			},
		],
		formats: [
			{ name: 'Curriculum Sprint', description: '2–4 tuần làm rõ và dựng khung chương trình.' },
			{ name: 'Learning Design Review', description: 'Rà soát và chỉnh một chương trình đang chạy.' },
		],
		contexts: [],
		pricingNote: UNIFIED_PRICING_NOTE,
		faq: [
			{
				question: 'Có xây luôn nội dung bài giảng không?',
				answer:
					'Tùy phạm vi đã chốt. Ưu tiên cấu trúc, outcomes và hoạt động; nội dung chi tiết có thể làm theo từng module nếu cần.',
			},
		],
		relatedCaseSlugs: [],
		relatedArticleSlugs: [],
		inquiryType: 'learning-design',
		status: 'published',
	},
	{
		slug: 'tu-van-phat-trien',
		title: 'Trao đổi và tư vấn',
		shortTitle: 'Trao đổi và tư vấn',
		anchorId: 'tu-van-phat-trien',
		summary:
			'Góp ý cho cá nhân hoặc đội ngũ đang cần nhìn rõ hơn một quyết định về học tập, công việc hoặc cách làm việc cùng nhau.',
		audience: [
			'Sinh viên, người mới đi làm và người lần đầu đảm nhận vai trò quản lý',
			'Người sáng lập hoặc đồng sáng lập ở giai đoạn đầu',
			'Đội ngũ đang kẹt giữa quá nhiều sáng kiến',
		],
		problems: [
			'Biết mình đang “kẹt” nhưng chưa nói rõ vấn đề',
			'Có nhiều lựa chọn nhưng thiếu tiêu chí quyết định',
			'Team làm nhiều việc nhưng thiếu ưu tiên chung',
		],
		notFor: [
			'Tri liệu tâm lý hoặc hỗ trợ khủng hoảng',
			'Tư vấn pháp lý, tài chính đầu tư hoặc thuế',
			'Cam kết việc làm / làm hộ công việc',
			'Outsource vận hành hàng ngày thay đội ngũ nội bộ',
		],
		outcomes: [
			'Nhìn rõ bối cảnh, ràng buộc và lựa chọn thực tế',
			'Có khung quyết định và bước tiếp theo trong 7–30 ngày',
			'Team thống nhất ưu tiên trước khi mở rộng',
		],
		deliverables: [
			'Tóm tắt vấn đề và giả định đã kiểm chứng',
			'Khung ưu tiên / quyết định (1 trang)',
			'Danh sách hành động có hạn và tiêu chí hoàn thành',
		],
		process: [
			{
				title: 'Làm rõ nhu cầu',
				description: 'Bạn mô tả bối cảnh qua form. Khánh phản hồi phạm vi phù hợp hoặc từ chối nếu ngoài ranh giới.',
			},
			{
				title: 'Focus Session hoặc Journey',
				description: 'Một buổi tập trung, hoặc chuỗi mentoring / advisory có mục tiêu và nhịp check-in.',
			},
			{
				title: 'Chốt bước tiếp',
				description: 'Bạn nhận bản tóm tắt và hành động. Không kéo dài nếu mục tiêu đã đủ rõ.',
			},
		],
		formats: [
			{
				name: 'Focus Session',
				description: 'Một buổi làm rõ vấn đề, lựa chọn và bước tiếp theo.',
			},
			{
				name: 'Mentoring Journey',
				description: 'Chuỗi buổi theo mục tiêu 4–8 tuần cho cá nhân.',
			},
			{
				name: 'Advisory Sprint',
				description: '2–6 tuần tập trung một ưu tiên tổ chức.',
			},
		],
		contexts: [
			{
				id: 'mentoring',
				title: 'Mentoring cá nhân',
				summary:
				'Trao đổi về hướng đi nghề nghiệp và những quyết định trong học tập, công việc — cho sinh viên, người mới đi làm và người lần đầu đảm nhận vai trò quản lý.',
			},
			{
				id: 'business',
				title: 'Tư vấn cho tổ chức',
				summary:
					'Góp ý cho người sáng lập và đội ngũ trẻ về những ưu tiên trong công việc và cách phối hợp với nhau.',
			},
		],
		pricingNote: UNIFIED_PRICING_NOTE,
		faq: [
			{
				question: 'Mentoring khác coaching trị liệu như thế nào?',
				answer:
					'Mentoring tập trung vào nghề nghiệp, quyết định và cách học/làm việc. Không thay thế trị liệu, tư vấn pháp lý hay tài chính.',
			},
			{
				question: 'Có báo giá trước khi trao đổi không?',
				answer:
					'Không. Chi phí chỉ được đề xuất sau khi làm rõ nhu cầu, đầu ra và phạm vi — để tránh báo giá lệch thực tế.',
			},
		],
		relatedCaseSlugs: [],
		relatedArticleSlugs: [],
		inquiryType: 'people-organization',
		status: 'published',
	},
];

export function getPublishedServices(): Service[] {
	return services.filter((s) => s.status === 'published');
}

export function getServiceBySlug(slug: string): Service | undefined {
	return services.find((s) => s.slug === slug && s.status === 'published');
}

export function getFeaturedServices(limit = 3): Service[] {
	return getPublishedServices().slice(0, limit);
}

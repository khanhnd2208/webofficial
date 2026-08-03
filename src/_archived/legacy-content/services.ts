import { UNIFIED_PRICING_NOTE } from './pricing';
import type { Service } from './types';

/**
 * Three public services. Mentoring and business advisory are contexts under
 * “Tư vấn phát triển”. AI is a cross-cutting capability, not a separate service.
 */
export const services: Service[] = [
	{
		slug: 'giang-day-workshop',
		title: 'Giảng dạy và chuyên đề thực hành',
		shortTitle: 'Giảng dạy',
		anchorId: 'giang-day-workshop',
		summary:
			'Dạy về quản trị, con người, giao tiếp và chiến lược, kết hợp lý thuyết với những tình huống thực tế.',
		audience: [
			'Doanh nghiệp cần đào tạo nội bộ theo chủ đề cụ thể',
			'Đội ngũ quản lý cấp trung',
			'Nhóm giảng viên hoặc người dẫn dắt muốn nâng chất lượng buổi học',
		],
		problems: [
			'Buổi học có nhiều trang trình chiếu nhưng người học khó nhớ điều cốt lõi',
			'Chưa gắn mục tiêu học với việc đội ngũ cần làm khác đi',
			'Cần hình thức linh hoạt: nửa ngày, một ngày hoặc chuỗi ngắn',
		],
		notFor: [
			'Khóa học đại trà bán vé trên các nền tảng công khai',
			'Chứng chỉ hành nghề hoặc chương trình được kiểm định bên thứ ba',
		],
		outcomes: [
			'Người tham dự hiểu mục tiêu, hoạt động và tiêu chí áp dụng',
			'Có tài liệu và khung thực hành để đội ngũ tiếp tục sau buổi học',
			'Người phụ trách nội bộ biết cách theo dõi mức độ áp dụng tối thiểu',
		],
		deliverables: [
			'Đề xuất mục tiêu đầu ra và chương trình buổi học',
			'Kịch bản dẫn dắt và các hoạt động thực hành',
			'Tài liệu tóm tắt cho người tham dự (theo phạm vi đã chốt)',
		],
		process: [
			{
				title: 'Làm rõ người học và mục tiêu',
				description: 'Ai học, cần thay đổi hành vi gì, ràng buộc thời gian.',
			},
			{
				title: 'Thiết kế và thống nhất',
				description:
					'Chương trình buổi học, hoạt động và tài liệu được điều chỉnh theo phản hồi của người phụ trách.',
			},
			{
				title: 'Dẫn dắt và khép lại',
				description: 'Dẫn dắt trực tiếp hoặc trực tuyến; tóm tắt kết quả sau buổi học.',
			},
		],
		formats: [
			{
				name: 'Chuyên đề nửa ngày hoặc một ngày',
				description: 'Tập trung vào một chủ đề với các hoạt động thực hành.',
			},
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
			'Đội ngũ đào tạo hoặc học thuật muốn có một khung học rõ ràng hơn',
			'Người đang mở khóa học hoặc chuỗi học có mục tiêu cụ thể',
		],
		problems: [
			'Có nội dung rời rạc nhưng thiếu lộ trình và tiêu chí hoàn thành',
			'Người học không biết mình đang tiến tới đâu',
			'Muốn dùng AI hỗ trợ học nhưng chưa có khung trách nhiệm',
		],
		notFor: [
			'Thuê ngoài toàn bộ việc vận hành hệ thống học tập thay đội ngũ nội bộ',
			'Cam kết chứng chỉ bên thứ ba hoặc kiểm định nghề nghiệp',
		],
		outcomes: [
			'Có bản đồ học tập với mục tiêu đầu ra và thứ tự các phần học rõ ràng',
			'Có tiêu chí đánh giá và hoàn thành tối thiểu',
			'Có nguyên tắc dùng AI trong học tập (nếu phù hợp phạm vi)',
		],
		deliverables: [
			'Bản đồ học tập và khung chương trình',
			'Mẫu hoạt động và bảng tiêu chí đánh giá rút gọn',
			'Gợi ý nhịp triển khai 30–90 ngày',
		],
		process: [
			{
				title: 'Làm rõ mục tiêu học',
				description: 'Ai học, cần làm được gì sau chương trình, ràng buộc thời gian và nguồn lực.',
			},
			{
				title: 'Thiết kế cấu trúc',
				description:
					'Từng phần học, hoạt động, tài liệu và điểm kiểm chứng được thống nhất qua các vòng ngắn.',
			},
			{
				title: 'Chuyển giao để vận hành',
				description:
					'Bạn hoặc đội ngũ giữ quyền sở hữu; tôi hỗ trợ điều chỉnh đến khi chương trình đủ rõ để triển khai.',
			},
		],
		formats: [
			{
				name: 'Dựng khung chương trình',
				description: 'Từ 2–4 tuần để làm rõ mục tiêu và dựng khung chương trình.',
			},
			{
				name: 'Rà soát thiết kế học tập',
				description: 'Rà soát và điều chỉnh một chương trình đang triển khai.',
			},
		],
		contexts: [],
		pricingNote: UNIFIED_PRICING_NOTE,
		faq: [
			{
				question: 'Có xây luôn nội dung bài giảng không?',
				answer:
					'Tùy phạm vi đã thống nhất. Tôi ưu tiên cấu trúc, mục tiêu đầu ra và hoạt động; nội dung chi tiết có thể được phát triển theo từng phần học nếu cần.',
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
			'Đội ngũ làm nhiều việc nhưng thiếu ưu tiên chung',
		],
		notFor: [
			'Trị liệu tâm lý hoặc hỗ trợ khủng hoảng',
			'Tư vấn pháp lý, tài chính đầu tư hoặc thuế',
			'Cam kết việc làm hoặc làm hộ công việc',
			'Thuê ngoài việc vận hành hằng ngày thay đội ngũ nội bộ',
		],
		outcomes: [
			'Nhìn rõ bối cảnh, ràng buộc và lựa chọn thực tế',
			'Có khung quyết định và bước tiếp theo trong 7–30 ngày',
			'Đội ngũ thống nhất ưu tiên trước khi mở rộng',
		],
		deliverables: [
			'Tóm tắt vấn đề và giả định đã kiểm chứng',
			'Khung ưu tiên và quyết định trong một trang',
			'Danh sách hành động có hạn và tiêu chí hoàn thành',
		],
		process: [
			{
				title: 'Làm rõ nhu cầu',
				description:
					'Bạn mô tả bối cảnh qua biểu mẫu. Tôi sẽ phản hồi về phạm vi phù hợp, hoặc nói rõ nếu nhu cầu nằm ngoài chuyên môn của mình.',
			},
			{
				title: 'Một buổi tập trung hoặc chuỗi đồng hành',
				description:
					'Một buổi làm rõ trọng tâm, hoặc một chuỗi đồng hành có mục tiêu và nhịp trao đổi cụ thể.',
			},
			{
				title: 'Chốt bước tiếp',
				description: 'Bạn nhận bản tóm tắt và hành động. Không kéo dài nếu mục tiêu đã đủ rõ.',
			},
		],
		formats: [
			{
				name: 'Buổi làm rõ trọng tâm',
				description: 'Một buổi làm rõ vấn đề, lựa chọn và bước tiếp theo.',
			},
			{
				name: 'Chuỗi đồng hành cá nhân',
				description: 'Chuỗi buổi theo mục tiêu 4–8 tuần cho cá nhân.',
			},
			{
				name: 'Đợt tư vấn tập trung',
				description: '2–6 tuần tập trung một ưu tiên tổ chức.',
			},
		],
		contexts: [
			{
				id: 'mentoring',
				title: 'Đồng hành cá nhân',
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
				question: 'Đồng hành nghề nghiệp khác trị liệu tâm lý như thế nào?',
				answer:
					'Việc đồng hành tập trung vào nghề nghiệp, quyết định và cách học hoặc làm việc. Đây không phải trị liệu tâm lý, tư vấn pháp lý hay tư vấn tài chính.',
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

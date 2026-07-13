import { UNIFIED_PRICING_NOTE } from './pricing';
import type { Service } from './types';

export const services: Service[] = [
	{
		slug: 'mentoring',
		title: 'Mentoring cá nhân',
		shortTitle: 'Mentoring',
		summary:
			'Làm rõ hướng đi nghề nghiệp, quyết định và cách hành động — cho sinh viên, young professional và first-time manager.',
		audience: [
			'Sinh viên sắp tốt nghiệp hoặc chuyển ngành',
			'Young professional muốn định hướng 1–3 năm tới',
			'First-time manager đang học cách dẫn dắt nhóm',
		],
		problems: [
			'Biết mình đang “kẹt” nhưng chưa nói rõ vấn đề',
			'Có nhiều lựa chọn nhưng thiếu tiêu chí quyết định',
			'Muốn phát triển nhưng chưa có nhịp phản hồi đáng tin',
		],
		notFor: [
			'Tri liệu tâm lý hoặc hỗ trợ khủng hoảng',
			'Tư vấn pháp lý, tài chính đầu tư hoặc thuế',
			'Cam kết việc làm / làm hộ công việc',
			'Coaching hiệu suất thể thao hoặc lối sống dài hạn thay thế chuyên gia',
		],
		outcomes: [
			'Nhìn rõ bối cảnh, ràng buộc và lựa chọn thực tế',
			'Có khung quyết định và bước tiếp theo trong 7–30 ngày',
			'Biết ranh giới: việc nào tự làm, việc nào cần hỗ trợ khác',
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
				description: 'Một buổi tập trung, hoặc chuỗi mentoring có mục tiêu và nhịp check-in.',
			},
			{
				title: 'Chốt bước tiếp',
				description: 'Bạn nhận bản tóm tắt và hành động. Không kéo dài nếu mục tiêu đã đủ rõ.',
			},
		],
		formats: [
			{
				name: 'Focus Session',
				description: 'Một buổi làm rõ vấn đề, lựa chọn và bước tiếp theo — phù hợp khi cần định hướng nhanh.',
			},
			{
				name: 'Mentoring Journey',
				description: 'Chuỗi buổi theo mục tiêu 4–8 tuần, có nhịp phản hồi và điều chỉnh hành động.',
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
				question: 'Tôi cần chuẩn bị gì trước buổi đầu?',
				answer:
					'Mô tả ngắn bối cảnh, việc đã thử, và kết quả mong muốn trong form liên hệ. Không cần hồ sơ dài.',
			},
		],
		relatedCaseSlugs: [],
		relatedArticleSlugs: [],
		inquiryType: 'mentoring',
		status: 'published',
	},
	{
		slug: 'co-van-doanh-nghiep',
		title: 'Cố vấn doanh nghiệp',
		shortTitle: 'Cố vấn DN',
		summary:
			'Giúp founder và đội ngũ trẻ làm rõ bài toán kinh doanh, ưu tiên và cách vận hành trước khi mở rộng.',
		audience: [
			'Founder / đồng sáng lập giai đoạn sớm',
			'Doanh nghiệp trẻ cần làm rõ định vị và ưu tiên',
			'Đội ngũ đang kẹt giữa quá nhiều sáng kiến',
		],
		problems: [
			'Chiến lược “có vẻ đúng” nhưng chưa kiểm chứng với thực tế vận hành',
			'Team làm nhiều việc nhưng thiếu tiêu chí ưu tiên',
			'Muốn dùng AI / marketing / đào tạo nội bộ nhưng chưa biết bắt đầu từ đâu',
		],
		notFor: [
			'Tư vấn pháp lý, kế toán, gọi vốn hoặc M&A',
			'Outsource vận hành hàng ngày thay đội ngũ nội bộ',
			'Cam kết tăng trưởng doanh thu theo KPI tuyệt đối',
		],
		outcomes: [
			'Bài toán ưu tiên được viết rõ và được team hiểu chung',
			'Có lộ trình sprint cố vấn với đầu ra kiểm chứng được',
			'Biết khi nào đủ để tự chạy và khi nào cần chuyên gia khác',
		],
		deliverables: [
			'Business clarity brief (bối cảnh – giả định – ưu tiên)',
			'Backlog ưu tiên 30–90 ngày',
			'Gợi ý cách đo tiến độ đơn giản cho đội ngũ',
		],
		process: [
			{
				title: 'Business Clarity Session',
				description: 'Một buổi làm rõ bài toán, giả định và tiêu chí thành công.',
			},
			{
				title: 'Advisory Sprint',
				description: 'Chuỗi làm việc ngắn hạn quanh một ưu tiên cụ thể (định vị, quy trình, học tập nội bộ…).',
			},
			{
				title: 'Ongoing Advisor (có điều kiện)',
				description: 'Chỉ mở khi đã có nhịp làm việc rõ, ranh giới vai trò và đầu ra định kỳ.',
			},
		],
		formats: [
			{ name: 'Business Clarity Session', description: 'Buổi đơn làm rõ bài toán và ưu tiên.' },
			{ name: 'Advisory Sprint', description: '2–6 tuần tập trung một chủ đề then chốt.' },
			{ name: 'Ongoing Advisor', description: 'Nhịp cố vấn định kỳ sau khi sprint chứng minh giá trị.' },
		],
		pricingNote: UNIFIED_PRICING_NOTE,
		faq: [
			{
				question: 'Có báo giá trước khi trao đổi không?',
				answer:
					'Không. Chi phí chỉ được đề xuất sau khi làm rõ nhu cầu, đầu ra và phạm vi — để tránh báo giá lệch thực tế.',
			},
		],
		relatedCaseSlugs: [],
		relatedArticleSlugs: [],
		inquiryType: 'business',
		status: 'published',
	},
	{
		slug: 'dao-tao-workshop',
		title: 'Đào tạo & workshop',
		shortTitle: 'Đào tạo',
		summary:
			'Thiết kế và dẫn dắt buổi học / workshop cho tổ chức quanh quản trị, học tập và làm việc có phương pháp.',
		audience: [
			'Doanh nghiệp cần đào tạo nội bộ theo chủ đề cụ thể',
			'Đội ngũ quản lý cấp trung',
			'Nhóm giảng viên / facilitator muốn nâng chất lượng buổi học',
		],
		problems: [
			'Đào tạo mang tính “slide nhiều, nhớ ít”',
			'Chưa gắn mục tiêu học với việc đội ngũ cần làm khác đi',
			'Cần format linh hoạt: nửa ngày, một ngày, hoặc chuỗi ngắn',
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
			{ title: 'Làm rõ đối tượng & mục tiêu', description: 'Ai học, cần thay đổi hành vi gì, ràng buộc thời gian.' },
			{ title: 'Thiết kế & duyệt', description: 'Agenda, hoạt động, tài liệu — điều chỉnh theo phản hồi sponsor.' },
			{ title: 'Dẫn dắt & chốt', description: 'Facilitation tại chỗ hoặc online; tóm tắt đầu ra sau buổi.' },
		],
		formats: [
			{ name: 'Workshop nửa ngày / một ngày', description: 'Tập trung một chủ đề với hoạt động thực hành.' },
			{ name: 'Chuỗi ngắn', description: '2–4 buổi để xây thói quen áp dụng.' },
		],
		pricingNote: UNIFIED_PRICING_NOTE,
		faq: [
			{
				question: 'Có tùy chỉnh theo ngành không?',
				answer: 'Có. Nội dung được chỉnh theo đối tượng, số người, mục tiêu và ràng buộc thời gian của tổ chức.',
			},
		],
		relatedCaseSlugs: [],
		relatedArticleSlugs: [],
		inquiryType: 'training',
		status: 'published',
	},
	{
		slug: 'ai-ung-dung',
		title: 'AI ứng dụng',
		shortTitle: 'AI ứng dụng',
		summary:
			'Giúp cá nhân và tổ chức dùng AI có trách nhiệm trong học tập, giảng dạy, nghiên cứu và công việc tri thức — không bán chatbot generic.',
		audience: [
			'Quản lý / giảng viên muốn quy trình làm việc với AI rõ ràng',
			'Đội ngũ tri thức cần literacy và ranh giới dữ liệu',
			'Founder muốn thử workflow AI trước khi đầu tư công cụ lớn',
		],
		problems: [
			'Dùng AI theo cảm tính, thiếu quy trình và kiểm chứng',
			'Lo ngại dữ liệu nhạy cảm nhưng chưa có nguyên tắc nội bộ',
			'Mong đợi “tự động hóa hết” khi bài toán thật sự là làm rõ công việc',
		],
		notFor: [
			'Xây chatbot / agent production khi chưa có case và phạm vi rõ',
			'Cam kết thay thế nhân sự hoặc tự động hóa toàn bộ quy trình',
			'Xử lý dữ liệu cá nhân / bí mật kinh doanh trái nguyên tắc đã công bố',
		],
		outcomes: [
			'Có khung literacy: việc nào nên / không nên nhờ AI',
			'Có 1–2 workflow mẫu phù hợp vai trò (quản lý, giảng viên, nghiên cứu)',
			'Có checklist dữ liệu và ranh giới chịu trách nhiệm',
		],
		deliverables: [
			'AI use principles rút gọn cho đội ngũ',
			'Workflow mẫu + prompt pack (theo phạm vi)',
			'Gợi ý đo mức độ hữu ích sau 2–4 tuần',
		],
		process: [
			{ title: 'Làm rõ bài toán & dữ liệu', description: 'Công việc thực tế, rủi ro, và loại dữ liệu được phép đưa vào AI.' },
			{ title: 'Thiết kế workflow', description: 'Literacy + quy trình mẫu, không nhảy sang tool phức tạp quá sớm.' },
			{ title: 'Thử & chỉnh', description: 'Áp dụng nhỏ, thu phản hồi, chỉnh ranh giới trước khi mở rộng.' },
		],
		formats: [
			{ name: 'AI literacy session', description: 'Buổi định hướng nguyên tắc và ví dụ theo vai trò.' },
			{ name: 'Workflow sprint', description: 'Thiết kế và thử 1–2 quy trình làm việc cụ thể.' },
		],
		pricingNote: UNIFIED_PRICING_NOTE,
		faq: [
			{
				question: 'Bạn có dựng chatbot cho doanh nghiệp không?',
				answer:
					'Không trong giai đoạn này. Ưu tiên literacy, workflow và sử dụng có trách nhiệm — chỉ mở rộng khi có case và phạm vi rõ.',
			},
		],
		relatedCaseSlugs: [],
		relatedArticleSlugs: [],
		inquiryType: 'ai',
		status: 'published',
	},
];

export function getPublishedServices(): Service[] {
	return services.filter((s) => s.status === 'published');
}

export function getServiceBySlug(slug: string): Service | undefined {
	return services.find((s) => s.slug === slug && s.status === 'published');
}

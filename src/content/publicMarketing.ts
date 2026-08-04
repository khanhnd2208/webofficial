import type { InquiryType } from '@/features/inquiries/constants';

export const corePositioning = {
	eyebrow: 'Educator · Explorer',
	manifesto: 'Tôi làm giáo dục để tiếp tục học.',
	thesis:
		'Tôi tin một lớp học tốt cần sự chính xác của học thuật, sự hữu ích của thực hành và sự chăm chút của một tác phẩm.',
	promise:
		'Tôi dạy quản trị, thiết kế chương trình học và khám phá cách AI có thể giúp con người học và làm việc tốt hơn.',
	full: 'Tôi là Nguyễn Duy Khánh, giảng viên tại Hà Nội. Tôi dạy quản trị, thiết kế trải nghiệm học tập và khám phá cách AI có thể giúp con người học và làm việc tốt hơn.',
	overlay: 'Hà Nội · Lớp học · Những thử nghiệm',
} as const;

/** Homepage classroom cards — short overrides; project data supplies cover/status/link. */
export const homeClassroomCards = [
	{
		slug: 'strategic-management-learning-experience',
		title: 'Strategic Management Learning Experience',
		description:
			'Thiết kế lại hành trình học quản trị chiến lược theo hướng rõ ràng, trực quan và có thể vận dụng.',
	},
	{
		slug: 'ai50-ai-cho-moi-nguoi',
		title: 'AI50 — AI cho mọi người',
		description: 'Chương trình giúp người không chuyên hiểu và sử dụng AI có trách nhiệm.',
	},
	{
		slug: 'learning-at-moonie-cafe',
		title: 'Learning at Moonie Café',
		description: 'Đưa kiến thức quản trị vào một doanh nghiệp nhỏ đang vận hành thật.',
	},
] as const;

export const homeTrustLine =
	'Giảng dạy đại học · Thiết kế chương trình · Đào tạo đội ngũ · Tư vấn doanh nghiệp nhỏ';

export const serviceTeasers = [
	{
		id: 'management-learning',
		title: 'Học quản trị',
		description: 'Hiểu cấu trúc kiến thức, đọc case và vận dụng lý thuyết vào quyết định.',
	},
	{
		id: 'applied-ai',
		title: 'Đào tạo và thiết kế chương trình AI',
		description:
			'Giúp cá nhân và đội ngũ sử dụng AI có mục tiêu, quy trình và trách nhiệm rõ ràng.',
	},
	{
		id: 'business-advisory',
		title: 'Cố vấn doanh nghiệp',
		description:
			'Cùng nhìn lại vấn đề về khách hàng, vận hành, con người và xác định bước đi phù hợp.',
	},
] as const;

export const closingMessage = {
	title: 'Có thể chúng ta chưa cần bắt đầu bằng một đề bài hoàn chỉnh.',
	body: 'Hãy kể cho tôi về điều bạn đang học, đang xây dựng hoặc chưa tìm được cách giải quyết. Tôi sẽ bắt đầu bằng việc đọc và đặt một câu hỏi phù hợp.',
	cta: 'Gửi tôi một lời nhắn',
} as const;

export const servicesPage = {
	eyebrow: 'Học tập · Đào tạo · Cố vấn',
	title: 'Ba cách chúng ta có thể cùng làm việc.',
	lead: 'Tôi làm việc với người học, đội ngũ và doanh nghiệp đang cần hiểu rõ một vấn đề, thiết kế một trải nghiệm học tập hoặc đưa kiến thức vào thực tế. Mỗi sự cộng tác bắt đầu bằng bối cảnh cụ thể, không phải một gói giải pháp có sẵn.',
	fitTitle: 'Cách làm này phù hợp nhất khi',
	fitCriteria: [
		'Hai bên sẵn sàng làm rõ vấn đề trước khi chọn giải pháp.',
		'Người học hoặc đội ngũ tham gia vào quá trình.',
		'Kết quả được thử, quan sát và điều chỉnh.',
		'AI không được dùng để thay thế hoàn toàn trách nhiệm của con người.',
	],
	boundary:
		'Tôi không nhận làm bài, quyết định thay tổ chức hoặc cam kết một kết quả chưa có đủ dữ liệu để đánh giá.',
} as const;

export const serviceOffers = [
	{
		id: 'management-learning',
		number: '01',
		shortTitle: 'Học quản trị',
		title: 'Học và hiểu quản trị',
		overview:
			'Dành cho người học muốn nối lý thuyết, case và quyết định thực tế thành một hệ thống rõ ràng.',
		whenUseful:
			'Khi bạn nhớ nhiều mô hình nhưng chưa thấy chúng nối với phân tích, lựa chọn và quyết định thực tế.',
		activities: [
			'Lớp học hoặc buổi bổ trợ giúp nối lý thuyết với case',
			'Workshop thực hành phân tích và lựa chọn',
			'Mentoring học thuật hoặc rà soát học liệu',
		],
		process: ['Hiểu bối cảnh', 'Thiết kế cách làm', 'Thử và điều chỉnh'],
		proof: 'Strategic Management Learning Experience',
		proofNote: 'Thiết kế lại cách người học nhìn thấy chiến lược như một quá trình liên kết.',
		project: 'strategic-management-learning-experience',
		inquiryType: 'training' as InquiryType,
		cta: 'Trao đổi về việc học quản trị',
	},
	{
		id: 'applied-ai',
		number: '02',
		shortTitle: 'Thiết kế AI',
		title: 'Thiết kế và đào tạo AI',
		overview:
			'Dành cho cá nhân hoặc đội ngũ muốn sử dụng AI có mục tiêu, quy trình và trách nhiệm.',
		whenUseful:
			'Khi đội ngũ đã biết một số công cụ nhưng thiếu mục tiêu rõ, cách giao việc và vòng kiểm chứng có thể lặp lại.',
		activities: [
			'Workshop thực hành trên tình huống công việc thật',
			'Thiết kế chương trình AI theo năng lực cần đạt',
			'Rà soát khung chương trình và học liệu hiện có',
		],
		process: ['Hiểu bối cảnh', 'Thiết kế cách làm', 'Thử và điều chỉnh'],
		proof: 'AI50 — AI cho mọi người',
		proofNote: 'Từ hiểu công việc tới giao việc và kiểm chứng — không phải bộ mẹo prompt.',
		project: 'ai50-ai-cho-moi-nguoi',
		inquiryType: 'learning-design' as InquiryType,
		cta: 'Trao đổi về một chương trình AI',
	},
	{
		id: 'business-advisory',
		number: '03',
		shortTitle: 'Cố vấn',
		title: 'Cố vấn trong thực tế',
		overview:
			'Dành cho doanh nghiệp nhỏ và tổ chức cần nhìn lại vấn đề về khách hàng, vận hành hoặc con người.',
		whenUseful:
			'Khi nhiều dấu hiệu rời rạc đang ảnh hưởng lẫn nhau và đội ngũ chưa thống nhất đâu là vấn đề cần ưu tiên.',
		activities: [
			'Buổi chẩn đoán để làm rõ vấn đề trọng tâm',
			'Sprint cố vấn theo một quyết định cụ thể',
			'Cố vấn theo dự án với các điểm dừng điều chỉnh',
		],
		process: ['Hiểu bối cảnh', 'Thiết kế cách làm', 'Thử và điều chỉnh'],
		proof: 'Learning at Moonie Café',
		proofNote: 'Dạy và học quản trị trong một doanh nghiệp nhỏ đang vận hành thật.',
		project: 'learning-at-moonie-cafe',
		inquiryType: 'business' as InquiryType,
		cta: 'Trao đổi về một vấn đề doanh nghiệp',
	},
] as const;

export const projectsPage = {
	eyebrow: 'Dự án',
	title: 'Những điều tôi đang làm và tiếp tục hoàn thiện.',
	lead: 'Đây là những lớp học, chương trình, nghiên cứu và thử nghiệm mà tôi đã dành thời gian để hiểu, thiết kế và đưa vào thực tế. Mỗi dự án ghi lại điều đã làm được, điều còn chưa chắc chắn và những gì tôi học được trên đường đi.',
} as const;

export const contactPage = {
	eyebrow: 'Liên hệ',
	title: 'Gửi tôi một lời nhắn.',
	lead: 'Bạn không cần chuẩn bị một đề bài hoàn chỉnh. Hãy kể cho tôi về điều bạn đang học, đang xây dựng hoặc chưa tìm được cách giải quyết. Một vài dòng có bối cảnh là đủ để bắt đầu.',
	afterSubmit:
		'Tôi sẽ đọc bối cảnh, xem mình có phù hợp để hỗ trợ hay không và phản hồi bằng một câu hỏi hoặc bước tiếp theo. Chỉ khi cả hai bên thấy phù hợp, chúng ta mới cùng thống nhất phạm vi công việc.',
	aside: 'Một cuộc trao đổi tốt thường bắt đầu bằng một câu hỏi chưa hoàn chỉnh.',
} as const;

export const verifiedTrustItems = [
	{ label: 'Vai trò', value: 'Giảng viên · Trường Đại học Hà Nội' },
	{ label: 'Chuyên môn', value: 'Management Education' },
	{ label: 'Thiết kế', value: 'Learning Experience & Curriculum' },
	{ label: 'Nghiên cứu', value: 'AI trong quản trị nhân sự' },
] as const;

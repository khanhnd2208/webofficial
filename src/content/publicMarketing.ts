import type { InquiryType } from '@/features/inquiries/constants';

export const corePositioning = {
	manifesto: 'Học để hiểu sâu. Làm để tạo thay đổi.',
	promise:
		'Tôi giúp người học và tổ chức biến kiến thức quản trị và AI thành năng lực, chương trình và quy trình có thể áp dụng.',
	full: 'Tôi là Nguyễn Duy Khánh — giảng viên và người thiết kế trải nghiệm học tập. Tôi giúp người học và tổ chức biến kiến thức quản trị và AI thành năng lực, chương trình và quy trình có thể áp dụng.',
} as const;

export const needStates = [
	{
		id: 'learn',
		number: '01',
		title: 'Tôi muốn học và hiểu rõ hơn',
		situation:
			'Bạn đang có nhiều khái niệm hoặc mô hình rời rạc, nhưng chưa thấy chúng liên kết với một quyết định thực tế như thế nào.',
		outcome: 'Hiểu cấu trúc kiến thức, đọc được case và biết cách vận dụng.',
		serviceId: 'management-learning',
		serviceLabel: 'Xem hình thức học quản trị',
		project: 'strategic-management-learning-experience',
		projectLabel: 'Xem case giảng dạy',
		inquiryType: 'training' as InquiryType,
	},
	{
		id: 'team',
		number: '02',
		title: 'Tôi muốn đào tạo một đội ngũ',
		situation:
			'Tổ chức cần một chương trình quản trị hoặc AI có cấu trúc, hoạt động thực hành và tiêu chuẩn kiểm chứng rõ ràng.',
		outcome: 'Có một trải nghiệm học phù hợp với người học và bối cảnh công việc.',
		serviceId: 'applied-ai',
		serviceLabel: 'Xem giải pháp đào tạo',
		project: 'ai50-ai-cho-moi-nguoi',
		projectLabel: 'Xem chương trình AI50',
		inquiryType: 'learning-design' as InquiryType,
	},
	{
		id: 'business',
		number: '03',
		title: 'Tôi cần giải quyết một vấn đề kinh doanh',
		situation:
			'Nhiều dấu hiệu về khách hàng, vận hành, tài chính hoặc con người đang ảnh hưởng lẫn nhau và chưa có ưu tiên chung.',
		outcome: 'Nhìn đúng vấn đề trọng tâm, thấy các lựa chọn và có bước đi khả thi.',
		serviceId: 'business-advisory',
		serviceLabel: 'Xem hình thức cố vấn',
		project: 'moonie-cafe-business-development',
		projectLabel: 'Xem case doanh nghiệp',
		inquiryType: 'business' as InquiryType,
	},
] as const;

export const serviceOffers = [
	{
		id: 'management-learning',
		number: '01',
		shortTitle: 'Học quản trị',
		title: 'Học và hiểu quản trị',
		fit: 'Phù hợp khi bạn nhớ nhiều mô hình nhưng chưa thấy chúng nối với phân tích, lựa chọn và quyết định thực tế.',
		audience: [
			'Sinh viên học quản trị',
			'Người đi làm cần hệ thống lại kiến thức',
			'Nhóm học hoặc tổ chức giáo dục',
		],
		outcomes: [
			'Nhìn rõ cấu trúc và mối liên hệ giữa các khái niệm',
			'Đọc, phân tích và thảo luận được một case',
			'Giải thích được cơ sở của một lựa chọn quản trị',
		],
		formats: ['Lớp học hoặc buổi bổ trợ', 'Workshop thực hành', 'Mentoring học thuật', 'Rà soát học liệu'],
		deliverables: [
			'Kế hoạch bài học',
			'Bộ slide',
			'Bộ case',
			'Phiếu bài tập',
			'Sơ đồ đọc tài liệu',
		],
		approach: [
			'Chốt mục tiêu học tập',
			'Cấu trúc kiến thức cốt lõi',
			'Đưa lý thuyết vào case',
			'Kiểm tra khả năng vận dụng',
		],
		notFit:
			'Bạn cần lời giải thay, chứng chỉ tức thời, hoặc một bộ công thức dùng cho mọi bối cảnh.',
		proof: 'Strategic Management Learning Experience',
		project: 'strategic-management-learning-experience',
		inquiryType: 'training' as InquiryType,
		cta: 'Tìm hình thức học quản trị phù hợp',
	},
	{
		id: 'applied-ai',
		number: '02',
		shortTitle: 'Đào tạo AI',
		title: 'Đào tạo và thiết kế chương trình AI',
		fit: 'Phù hợp khi đội ngũ đã biết một số công cụ nhưng thiếu quy trình, tiêu chuẩn đầu ra và vòng kiểm chứng có thể lặp lại.',
		audience: [
			'Tổ chức giáo dục',
			'Doanh nghiệp hoặc đội ngũ',
			'Giảng viên và người mới sử dụng AI',
		],
		outcomes: [
			'Chọn đúng công việc phù hợp để giao cho AI',
			'Giao việc rõ hơn và đánh giá đầu ra theo tiêu chuẩn',
			'Giữ quyền quyết định và trách nhiệm của con người',
		],
		formats: [
			'Workshop thực hành',
			'Đào tạo nội bộ',
			'Thiết kế chương trình',
			'Rà soát khung chương trình và học liệu',
		],
		deliverables: [
			'Bản đồ khóa học',
			'Bộ slide',
			'Bộ bài thực hành',
			'Mẫu quy trình làm việc',
			'Danh mục kiểm chứng',
		],
		approach: [
			'Hiểu đúng công việc',
			'Phân vai người–AI',
			'Thiết kế vòng kiểm chứng',
			'Thực hành trên tình huống thật',
		],
		notFit: 'Mục tiêu chỉ là sưu tập prompt, chạy theo công cụ mới, hoặc tự động hóa bằng mọi giá.',
		proof: 'AI50 — AI cho mọi người',
		project: 'ai50-ai-cho-moi-nguoi',
		inquiryType: 'learning-design' as InquiryType,
		cta: 'Nhận đề xuất chương trình AI',
	},
	{
		id: 'business-advisory',
		number: '03',
		shortTitle: 'Cố vấn doanh nghiệp',
		title: 'Cố vấn vấn đề doanh nghiệp',
		fit: 'Phù hợp khi nhiều dấu hiệu rời rạc đang ảnh hưởng lẫn nhau và đội ngũ chưa thống nhất đâu là vấn đề cần ưu tiên.',
		audience: ['Doanh nghiệp nhỏ', 'Startup', 'Tổ chức giáo dục hoặc dịch vụ'],
		outcomes: [
			'Hiểu vấn đề trọng tâm thay vì chỉ xử lý triệu chứng',
			'Thấy các lựa chọn và đánh đổi quan trọng',
			'Có bước đi phù hợp với nguồn lực hiện tại',
		],
		formats: [
			'Buổi chẩn đoán',
			'Sprint cố vấn',
			'Rà soát quy trình',
			'Cố vấn theo dự án',
		],
		deliverables: [
			'Khung vấn đề',
			'Bản đồ quy trình',
			'Khung ưu tiên',
			'Báo cáo đề xuất',
		],
		approach: [
			'Làm rõ bối cảnh',
			'Tổng hợp dữ liệu liên quan',
			'Phân tích mối liên hệ',
			'Ưu tiên và điều chỉnh',
		],
		notFit:
			'Bạn cần cam kết KPI trước khi có dữ liệu, hoặc muốn bên tư vấn quyết định thay hoàn toàn cho đội ngũ.',
		proof: 'Moonie Café Business Development',
		project: 'moonie-cafe-business-development',
		inquiryType: 'business' as InquiryType,
		cta: 'Mô tả vấn đề doanh nghiệp',
	},
] as const;

export const verifiedTrustItems = [
	{ label: 'Vai trò', value: 'Giảng viên · Trường Đại học Hà Nội' },
	{ label: 'Chuyên môn', value: 'Management Education' },
	{ label: 'Thiết kế', value: 'Learning Experience & Curriculum' },
	{ label: 'Nghiên cứu', value: 'AI trong quản trị nhân sự' },
] as const;

export const workingProcess = [
	[
		'01',
		'Hiểu đúng',
		'Làm rõ bối cảnh, người liên quan và điều cần thay đổi trước khi chọn phương pháp.',
	],
	[
		'02',
		'Thiết kế rõ',
		'Chuyển kiến thức và mục tiêu thành một cấu trúc có thể hiểu, thử và sử dụng.',
	],
	['03', 'Thử trong thực tế', 'Đưa cấu trúc vào case, hoạt động học hoặc dòng công việc thật.'],
	['04', 'Điều chỉnh', 'Quan sát bằng chứng, nhận phản hồi và cải tiến phần chưa phù hợp.'],
] as const;

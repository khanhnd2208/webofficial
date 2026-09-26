import type { PolicyPage } from './types';

/**
 * Policy copy is owner-authored for structure. Mark legalReview pending until
 * professional review — pages can still publish with clear scope language.
 */
export const policies: PolicyPage[] = [
	{
		slug: 'bao-mat',
		title: 'Chính sách bảo mật',
		summary: 'Cách website thu thập, dùng và bảo vệ dữ liệu khi bạn đọc bài, đăng nhập hoặc gửi liên hệ.',
		updatedAt: '2026-09-26',
		status: 'published',
		legalReview: 'pending',
		sections: [
			{
				heading: 'Dữ liệu website xử lý',
				body: [
					'Tài khoản Google (tên, email, ảnh đại diện) khi bạn đăng nhập.',
					'Nội dung bạn gửi qua biểu mẫu liên hệ: tên, email, chủ đề và lời nhắn.',
					'Khi bạn đã đăng nhập, email tài khoản được dùng làm địa chỉ nhận phản hồi và được ghi nhận cùng lời nhắn.',
					'Dữ liệu kỹ thuật tối thiểu để vận hành, duy trì phiên đăng nhập và chống thư rác.',
					'Khi bạn học khóa học sau khi đăng nhập, website ghi nhận khóa học, mục học, thời điểm hoạt động và thời lượng tương tác ước tính để lưu tiến độ và lập báo cáo học tập. Bộ đếm tạm dừng khi tab bị ẩn hoặc không có thao tác trong 5 phút.',
					'Không lưu địa chỉ IP thô trong yêu cầu liên hệ; cơ chế giới hạn tần suất dùng mã hóa một chiều.',
				],
			},
			{
				heading: 'Mục đích sử dụng',
				body: [
					'Cung cấp bài viết, tài khoản học tập và những hỗ trợ bạn đã yêu cầu.',
					'Đọc, phản hồi lời nhắn và cải thiện cách website hoạt động.',
					'Bảo vệ hệ thống khỏi lạm dụng.',
				],
			},
			{
				heading: 'Đơn vị hỗ trợ gửi email',
				body: [
					'Website sử dụng Resend để chuyển email xác nhận và thông báo lời nhắn. Chỉ những thông tin cần thiết cho việc gửi và trả lời email được chuyển qua dịch vụ này.',
				],
			},
			{
				heading: 'Dữ liệu doanh nghiệp & AI',
				body: [
					'Không đưa bí mật kinh doanh hoặc dữ liệu cá nhân của bên thứ ba vào công cụ AI công cộng khi chưa có thỏa thuận rõ.',
					'Nguyên tắc dùng AI chi tiết tại trang /chinh-sach/ai.',
				],
			},
			{
				heading: 'Yêu cầu xem hoặc xóa dữ liệu',
				body: [
					'Bạn có thể yêu cầu xem hoặc xóa dữ liệu liên hệ hay tài khoản qua trang Gửi lời nhắn hoặc hồ sơ đã đăng nhập.',
					'Yêu cầu liên hệ đã đóng và không còn mục đích sử dụng có thể bị xóa sau 12 tháng.',
				],
			},
		],
	},
	{
		slug: 'dieu-khoan',
		title: 'Điều khoản chung',
		summary: 'Điều kiện sử dụng website, nội dung và khu học tập.',
		updatedAt: '2026-07-13',
		status: 'published',
		legalReview: 'pending',
		sections: [
			{
				heading: 'Phạm vi',
				body: [
					'Website cung cấp nội dung biên tập, thông tin dịch vụ và (khi mở) chương trình học.',
					'Nội dung mang tính chia sẻ và hỗ trợ học tập, nghề nghiệp — không phải tư vấn pháp lý, y tế hay tài chính.',
				],
			},
			{
				heading: 'Tài khoản & ghi danh',
				body: [
					'Đăng nhập bằng Google. Một số khu vực chỉ dành cho người được ghi danh hoặc quản trị viên.',
					'Việc ghi danh khóa học do quản trị viên thực hiện; website không có chức năng tự đăng ký và thanh toán.',
				],
			},
			{
				heading: 'Sở hữu nội dung',
				body: [
					'Bài viết và tài nguyên thuộc chủ sở hữu website trừ khi ghi chú khác.',
					'Không sao chép hàng loạt để phân phối thương mại khi chưa có sự đồng ý.',
				],
			},
		],
	},
	{
		slug: 'huy-doi-lich',
		title: 'Hủy và đổi lịch',
		summary: 'Cách xử lý khi cần hủy hoặc dời một buổi trao đổi, tư vấn hoặc workshop đã xác nhận.',
		updatedAt: '2026-07-13',
		status: 'published',
		legalReview: 'pending',
		sections: [
			{
				heading: 'Nguyên tắc',
				body: [
					'Thời gian cụ thể được xác nhận bằng văn bản (email) sau khi làm rõ phạm vi.',
					'Vui lòng báo sớm nhất có thể khi cần đổi lịch.',
				],
			},
			{
				heading: 'Đổi lịch',
				body: [
					'Ưu tiên dời sang khung giờ trống trong vòng 7–14 ngày tùy loại hình.',
					'Việc đổi lịch nhiều lần có thể khiến công việc phải dừng lại để tôn trọng thời gian của hai bên.',
				],
			},
			{
				heading: 'Hủy',
				body: [
					'Điều kiện hủy / hoàn chi phí (nếu có) được ghi trong đề xuất sau khi làm rõ phạm vi — không áp dụng bảng giá chung trên website.',
				],
			},
		],
	},
	{
		slug: 'ai',
		title: 'Nguyên tắc dùng AI',
		summary: 'Cách AI được sử dụng trong giảng dạy, tư vấn và vận hành website.',
		updatedAt: '2026-07-13',
		status: 'published',
		legalReview: 'pending',
		sections: [
			{
				heading: 'Nguyên tắc chung',
				body: [
					'AI hỗ trợ soạn thảo, tóm tắt và thử ý tưởng — không thay thế trách nhiệm chuyên môn của người dùng.',
					'Không đưa dữ liệu nhận dạng cá nhân hoặc bí mật kinh doanh vào công cụ AI công cộng khi chưa được phép.',
				],
			},
			{
				heading: 'Trong trao đổi và tư vấn',
				body: [
					'Ghi chú buổi làm việc được giữ tối thiểu và có mục đích.',
					'Không dùng lời nhắn liên hệ làm dữ liệu huấn luyện công khai.',
				],
			},
			{
				heading: 'Ẩn danh và tình huống thực tế',
				body: [
					'Tình huống thực tế hoặc phản hồi chỉ được công bố khi có sự đồng ý, hoặc khi hai bên đã thống nhất cách ẩn danh.',
					'Bạn có thể yêu cầu rút lại sự đồng ý bằng cách gửi lời nhắn cho Khánh.',
				],
			},
		],
	},
];

export function getPublishedPolicies(): PolicyPage[] {
	return policies.filter((p) => p.status === 'published');
}

export function getPolicyBySlug(slug: string): PolicyPage | undefined {
	return getPublishedPolicies().find((p) => p.slug === slug);
}

export function isPrivacyPolicyPublished(): boolean {
	return Boolean(getPolicyBySlug('bao-mat'));
}

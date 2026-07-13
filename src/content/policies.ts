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
		updatedAt: '2026-07-13',
		status: 'published',
		legalReview: 'pending',
		sections: [
			{
				heading: 'Dữ liệu chúng tôi xử lý',
				body: [
					'Tài khoản Google (tên, email, ảnh đại diện) khi bạn đăng nhập.',
					'Nội dung inquiry khi bạn gửi form liên hệ: tên, email, ngữ cảnh nhu cầu.',
					'Dữ liệu kỹ thuật tối thiểu để vận hành (phiên đăng nhập, bảo vệ chống spam).',
					'Không lưu địa chỉ IP thô trong inquiry; rate limit dùng mã hóa một chiều.',
				],
			},
			{
				heading: 'Mục đích sử dụng',
				body: [
					'Cung cấp bài viết, tài khoản và dịch vụ đồng hành đã yêu cầu.',
					'Phản hồi inquiry và cải thiện phạm vi dịch vụ.',
					'Bảo vệ hệ thống khỏi lạm dụng.',
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
					'Bạn có thể yêu cầu xem hoặc xóa dữ liệu inquiry / tài khoản qua email công khai trên trang Liên hệ hoặc hồ sơ đã đăng nhập.',
					'Inquiry CLOSED không còn mục đích sử dụng có thể bị xóa sau 12 tháng.',
				],
			},
		],
	},
	{
		slug: 'dieu-khoan',
		title: 'Điều khoản chung',
		summary: 'Điều kiện sử dụng website và phạm vi dịch vụ đồng hành / học tập.',
		updatedAt: '2026-07-13',
		status: 'published',
		legalReview: 'pending',
		sections: [
			{
				heading: 'Phạm vi',
				body: [
					'Website cung cấp nội dung biên tập, thông tin dịch vụ và (khi mở) chương trình học.',
					'Nội dung mang tính thông tin và đồng hành nghề nghiệp — không phải tư vấn pháp lý, y tế hay tài chính.',
				],
			},
			{
				heading: 'Tài khoản & ghi danh',
				body: [
					'Đăng nhập bằng Google. Một số khu vực chỉ dành cho người được ghi danh hoặc admin.',
					'Ghi danh khóa học do admin thực hiện; không có tự đăng ký thanh toán trên website.',
				],
			},
			{
				heading: 'Sở hữu nội dung',
				body: [
					'Bài viết và tài nguyên thuộc chủ sở hữu website trừ khi ghi chú khác.',
					'Không sao chép hàng loạt để phân phối thương mại khi chưa có phép.',
				],
			},
		],
	},
	{
		slug: 'huy-doi-lich',
		title: 'Hủy và đổi lịch',
		summary: 'Cách xử lý khi cần hủy hoặc dời buổi mentoring / cố vấn / workshop đã chốt.',
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
					'Đổi lịch nhiều lần có thể dẫn tới dừng đồng hành để tôn trọng thời gian hai bên.',
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
		summary: 'Ranh giới khi dùng AI trong công việc đồng hành, học tập và vận hành website.',
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
				heading: 'Trong mentoring & cố vấn',
				body: [
					'Ghi chú buổi làm việc được giữ tối thiểu và có mục đích.',
					'Không dùng nội dung inquiry làm dữ liệu huấn luyện công khai.',
				],
			},
			{
				heading: 'Ẩn danh & case study',
				body: [
					'Case / testimonial chỉ công bố khi có permission hoặc chế độ ẩn danh đã thỏa thuận.',
					'Bạn có thể yêu cầu rút permission sau khi liên hệ.',
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

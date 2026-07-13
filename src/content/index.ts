export * from './types';
export * from './pricing';
export * from './services';
export * from './audiences';
export * from './cases';
export * from './resources';
export * from './about';
export * from './policies';
export * from './lab';
export * from './journal';

export const methodologySteps = [
	{
		title: 'Hiểu đúng',
		description: 'Làm rõ bối cảnh, ràng buộc và bài toán thật trước khi chọn công cụ.',
	},
	{
		title: 'Kết nối',
		description: 'Nối trải nghiệm, tri thức và người liên quan để thấy bức tranh đủ lớn.',
	},
	{
		title: 'Làm rõ',
		description: 'Chốt ưu tiên, giả định và tiêu chí thành công có thể kiểm chứng.',
	},
	{
		title: 'Hành động',
		description: 'Chỉ giữ bước tiếp theo khả thi — rồi phản hồi và chỉnh.',
	},
] as const;

export const capabilityPillars = [
	{
		title: 'Định hướng nghề nghiệp',
		description: 'Giúp cá nhân nhìn rõ lựa chọn và bước tiếp theo trong giai đoạn chuyển mình.',
	},
	{
		title: 'Làm rõ bài toán tổ chức',
		description: 'Giúp founder và đội ngũ thống nhất ưu tiên trước khi mở rộng.',
	},
	{
		title: 'Học & AI có phương pháp',
		description: 'Thiết kế cách học, dạy và dùng AI sao cho có dấu vết và ranh giới rõ.',
	},
] as const;

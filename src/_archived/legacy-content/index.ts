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
export * from './podcast';
export * from './home';

export const methodologySteps = [
	{
		title: 'Làm rõ',
		description: 'Nghe bối cảnh, ràng buộc và kết quả mong muốn — trước khi đề xuất phạm vi.',
	},
	{
		title: 'Thiết kế',
		description: 'Chọn hình thức phù hợp: workshop, chương trình học, hoặc tư vấn phát triển.',
	},
	{
		title: 'Đồng hành',
		description: 'Triển khai có nhịp phản hồi; dừng đúng lúc khi mục tiêu đã đủ rõ.',
	},
] as const;

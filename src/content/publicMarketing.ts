export const corePositioning = {
	eyebrow: 'Educator · Explorer',
	manifesto: 'Tôi vẫn đang học cách trở thành một người thầy tốt hơn.',
	thesis:
		'Tôi tin một lớp học tốt cần sự chính xác của học thuật, sự hữu ích của thực hành và sự chăm chút của một tác phẩm.',
	promise:
		'Tôi dạy quản trị, thiết kế chương trình học và khám phá cách AI có thể giúp con người học và làm việc tốt hơn.',
	full: 'Tôi là Nguyễn Duy Khánh, giảng viên tại Hà Nội. Tôi dạy quản trị, thiết kế trải nghiệm học tập và khám phá cách AI có thể giúp con người học và làm việc tốt hơn.',
	overlay: 'Hà Nội · Lớp học · Những thử nghiệm',
} as const;

export const projectsPage = {
	title: 'Dự án',
	lead: 'Một số lớp học, chương trình và thử nghiệm tôi đã hoặc đang thực hiện.',
} as const;

/** @deprecated Import from `@/content/services` — kept for shared marketing re-exports. */
export {
	servicesPage,
	serviceOffers,
	programDesign,
	servicesFaq,
	servicesClosing,
} from './services';

export const contactPage = {
	eyebrow: 'Liên hệ',
	title: 'Gửi tôi một lời nhắn.',
	lead: 'Bạn không cần chuẩn bị một đề bài hoàn chỉnh. Hãy kể cho tôi về điều bạn đang học, đang xây dựng hoặc chưa tìm được cách giải quyết. Một vài dòng có bối cảnh là đủ để bắt đầu.',
	afterSubmit:
		'Tôi sẽ đọc bối cảnh, xem mình có phù hợp để hỗ trợ hay không và phản hồi bằng một câu hỏi hoặc bước tiếp theo. Chỉ khi cả hai bên thấy phù hợp, chúng ta mới cùng thống nhất phạm vi công việc.',
	aside: 'Một cuộc trao đổi tốt thường bắt đầu bằng một câu hỏi chưa hoàn chỉnh.',
} as const;

/**
 * Entry cover at `/` — opens into the mục lục gate.
 * Keep copy short; the page is a single composition, not a marketing dump.
 */
export const introPage = {
	location: 'Hà Nội',
	locationLatin: 'Hanoi',
	year: '2026',
	headline: 'Trở thành',
	partOfSpeech: '[động từ]',
	lines: ['Chưa xong.', 'Và có lẽ, đó mới là điều hay.'] as const,
	cta: 'Mở mục lục',
	desktopImage: {
		src: '/brand/learning-as-becoming-desktop.jpg',
		alt: 'Minh họa người đứng trên vách đá nhìn ra hành trình phía trước',
	},
	mobileImage: {
		src: '/brand/learning-as-becoming-mobile-ochre.webp',
		alt: 'Chân dung minh họa Nguyễn Duy Khánh trên hành trình',
	},
} as const;

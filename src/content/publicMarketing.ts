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

/** /lien-he is the "Về tôi" page: introduction, channels, collaboration, message form. */
export const contactPage = {
	intro: [
		'Tôi dạy quản trị, thiết kế trải nghiệm học tập và khám phá cách AI có thể giúp con người học và làm việc tốt hơn.',
		'Với tôi, một lớp học tốt cần kiến thức chính xác, cơ hội thực hành và sự chăm chút trong cách dẫn dắt. Tôi muốn người học hiểu được mối liên hệ giữa các ý tưởng và biết vận dụng vào tình huống của mình.',
	],
	channelsTitle: 'Liên hệ trực tiếp',
	collaborationTitle: 'Có thể làm cùng nhau',
	formTitle: 'Gửi lời nhắn',
	formLead: 'Vài dòng là đủ. Tôi sẽ đọc và phản hồi bằng một câu hỏi hoặc bước tiếp theo.',
} as const;

/** Direct channels on /lien-he. */
export const contactChannels = [
	{
		id: 'email',
		label: 'Email',
		value: 'khanhnd2208@gmail.com',
		href: 'mailto:khanhnd2208@gmail.com',
		description: 'Công việc, lớp học và hợp tác.',
	},
	{
		id: 'linkedin',
		label: 'LinkedIn',
		value: 'in/khanhnguyenduy',
		href: 'https://www.linkedin.com/in/khanhnguyenduy/',
		description: 'Hồ sơ nghề nghiệp và kết nối công việc.',
	},
	{
		id: 'instagram',
		label: 'Instagram',
		value: '@turamisi.nk',
		href: 'https://www.instagram.com/turamisi.nk/',
		description: 'Nhắn tin nhanh và cập nhật thường ngày.',
		note: 'Khi follow, hãy nhắn cho tôi một tin nhắn để tôi biết bạn là ai trước khi tôi chấp nhận nhé.',
	},
] as const;

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
	desktopNightImage: {
		src: '/brand/learning-as-becoming-desktop-night.webp',
		alt: 'Minh họa người đứng trên vách đá dưới trời đêm sao nhìn về phía trăng vàng',
	},
	mobileImage: {
		src: '/brand/learning-as-becoming-mobile-ochre.webp',
		alt: 'Chân dung minh họa Nguyễn Duy Khánh trên hành trình',
	},
	mobileNightImage: {
		src: '/brand/learning-as-becoming-mobile-night.webp',
		alt: 'Chân dung minh họa Nguyễn Duy Khánh dưới bầu trời đêm sao',
	},
	/** Quiet marginalia notes revealed only if a curious reader taps "Chưa xong." */
	whispers: [
		corePositioning.manifesto,
		corePositioning.thesis,
		corePositioning.promise,
	] as const,
	/** Quiet bookplate annotations anchored to natural symbols inside the cover artwork. */
	marginalia: {
		person: {
			triggerLabel: 'Ghi chú về người trong tranh',
			note: 'Người vẫn đang học cách dạy tốt hơn.',
			linkLabel: 'Về tôi',
		},
		journey: {
			triggerLabel: 'Ghi chú về con đường phía trước',
			note: 'Những khóa học và lớp học đang mở.',
			linkLabel: 'Học tập',
		},
	},
} as const;

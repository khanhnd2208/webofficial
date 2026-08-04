/**
 * About page content — story of becoming an educator.
 * Homepage answers “who is Duy Khánh now?”; About answers “how did he become this teacher?”
 */

export const aboutHero = {
	eyebrow: 'Giới thiệu',
	title: 'Con đường của tôi luôn quay trở lại lớp học.',
	lead: 'Tôi đến với giáo dục từ quản trị, nhân sự, kinh doanh và công nghệ. Những trải nghiệm ấy thường đưa tôi trở lại cùng một câu hỏi: làm thế nào để một điều khó trở nên rõ ràng mà không bị làm cho đơn giản sai?',
} as const;

export type AboutChapter = {
	id: string;
	title: string;
	body: string;
	/** One concrete marker that grounds the chapter in a real path. */
	milestone: string;
	/** Optional real media — only render when both src and approval are set. */
	mediaSrc?: string;
	mediaAlt?: string;
};

export const aboutPath = {
	title: 'Con đường đưa tôi trở lại lớp học',
	chapters: [
		{
			id: 'management',
			title: 'Học quản trị để hiểu tổ chức',
			body: 'Tôi bắt đầu từ quản trị vì muốn hiểu cách con người và tổ chức đưa ra quyết định. Trong lớp học và sách vở thời đó, tôi thấy rõ sức mạnh của khung tư duy — nhưng cũng thấy khoảng cách giữa mô hình trên giấy và những lựa chọn phải đưa ra khi thông tin chưa đủ, thời gian hạn hẹp và trách nhiệm thuộc về một người cụ thể.',
			milestone:
				'Nền tảng ấy bắt đầu tại Khoa Quản trị Kinh doanh và Du lịch, Trường Đại học Hà Nội.',
		},
		{
			id: 'practice',
			title: 'Đi qua thực hành để hiểu giới hạn của lý thuyết',
			body: 'Tôi đi qua giáo dục, nhân sự, kinh doanh và những thử nghiệm khởi nghiệp. Mỗi môi trường dạy một bài học khác nhau: lý thuyết giúp nhìn hệ thống, nhưng chỉ thực hành mới cho thấy chỗ nào lý thuyết gãy, chỗ nào cần sắc thái, và chỗ nào một quyết định “đúng trên giấy” lại không thể sống trong tổ chức thật.',
			milestone:
				'Thời gian học thạc sĩ Quản trị Kinh doanh tại Ý và những năm làm việc sau đó khiến khoảng cách giữa khung và thực tế trở nên không thể bỏ qua.',
		},
		{
			id: 'return',
			title: 'Trở lại lớp học với nhiều câu hỏi hơn',
			body: 'Tôi trở lại giảng dạy không phải vì đã có đủ câu trả lời, mà vì lớp học là nơi tôi có thể tiếp tục hỏi cùng người học. Dạy giúp tôi nhìn lại những khái niệm mình từng nghĩ đã hiểu, và buộc tôi thiết kế lại chúng thành một hành trình suy nghĩ — để người học tự quan sát, tự lựa chọn và chịu trách nhiệm với lựa chọn ấy.',
			milestone:
				'Trở lại giảng dạy tại Trường Đại học Hà Nội là điểm tôi chọn ở lại với câu hỏi, thay vì tìm một câu trả lời đóng.',
		},
	] as AboutChapter[],
} as const;

export const aboutWorkToday = {
	eyebrow: 'Công việc hôm nay',
	title: 'Lớp học, thiết kế và những thử nghiệm mới',
	body: 'Phần lớn thời gian của tôi nằm ở ba nơi: trong lớp học, trên bàn thiết kế chương trình và trong những thử nghiệm với AI. Dù hình thức khác nhau, tôi vẫn theo đuổi cùng một mục tiêu: giúp con người hiểu một vấn đề đủ sâu để tự đưa ra lựa chọn và chịu trách nhiệm với lựa chọn ấy.',
	links: [
		{
			id: 'classroom',
			label: 'Những lớp học đang diễn ra',
			hrefKey: 'classroom' as const,
		},
		{
			id: 'design',
			label: 'Các dự án thiết kế học tập',
			hrefKey: 'projects' as const,
		},
		{
			id: 'experiments',
			label: 'Những nghiên cứu và thử nghiệm mới',
			hrefKey: 'research' as const,
		},
	],
} as const;

export const aboutPrinciples = {
	title: 'Tôi tin vào điều gì',
	items: [
		{
			id: 'clarity',
			title: 'Rõ ràng, nhưng không giản lược',
			body: 'Tôi muốn những điều khó trở nên dễ tiếp cận mà vẫn giữ được sắc thái, điều kiện và giới hạn quan trọng.',
		},
		{
			id: 'practice',
			title: 'Học bằng việc suy nghĩ và thực hành',
			body: 'Kiến thức chỉ thực sự sống khi người học phải dùng nó để quan sát, đặt câu hỏi và đưa ra lựa chọn.',
		},
		{
			id: 'human',
			title: 'Công nghệ phục vụ con người',
			body: 'AI có thể giúp chúng ta tìm kiếm, cấu trúc và thử nghiệm nhanh hơn. Việc đánh giá, lựa chọn và chịu trách nhiệm vẫn thuộc về con người.',
		},
	],
} as const;

/**
 * Beyond-classroom blocks only render when they have reachable content.
 * My Hanoicam appears when notes are public; reading list when items exist.
 */
export const aboutBeyond = {
	title: 'Những điều cũng làm nên tôi',
	lead: 'Lớp học không phải nơi duy nhất tôi học. Một phần khác đến từ Hà Nội, những trang sách đang đọc và những cuộc trò chuyện khiến tôi phải nghĩ lại điều mình từng tin là đúng.',
	hanoicam: {
		id: 'hanoicam',
		title: 'My Hanoicam',
		body: 'Những khoảnh khắc Hà Nội khiến tôi chậm lại — ánh sáng, góc phố, và những quan sát nhỏ không thuộc về một bài giảng nào.',
	},
	reading: {
		id: 'reading',
		title: 'Đang đọc và suy nghĩ',
		question: 'Làm sao giữ quyền đánh giá của con người khi AI tham gia ngày càng sâu vào công việc?',
		/** Leave empty until the owner supplies live reading notes. */
		items: [] as ReadonlyArray<{ title: string; note?: string }>,
		updatedAt: undefined as string | undefined,
	},
} as const;

export const aboutCredentials = {
	title: 'Một vài thông tin chính thức',
	items: [
		{
			label: 'Đơn vị công tác',
			value: 'Giảng viên, Khoa Quản trị Kinh doanh và Du lịch, Trường Đại học Hà Nội',
		},
		{
			label: 'Lĩnh vực giảng dạy',
			value: 'Quản trị, quản trị chiến lược, quản trị nhân sự và giao tiếp trong tổ chức',
		},
		{
			label: 'Học vấn',
			value: 'Cử nhân Quản trị · Thạc sĩ Quản trị Kinh doanh tại Ý',
		},
		{
			label: 'Mối quan tâm nghiên cứu hiện tại',
			value: 'AI trong tuyển dụng, quản trị nhân sự và thiết kế công việc',
		},
	],
} as const;

export const aboutClosing = {
	/** Used when /ghi-chep is not yet public. */
	titleWithoutNotes:
		'Những điều tôi đang học thường tiếp tục sống trong các dự án, lớp học và cuộc trò chuyện mới.',
	/** Used when notes archive is live. */
	titleWithNotes:
		'Phần lớn những điều tôi đang học được lưu lại trong các dự án và ghi chép.',
	primaryCta: { label: 'Xem những điều tôi đang làm', hrefKey: 'projects' as const },
	notesCta: { label: 'Đọc những ghi chép mới', hrefKey: 'notes' as const },
	contactCta: { label: 'Gửi tôi một lời nhắn', hrefKey: 'contact' as const },
} as const;

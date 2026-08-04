/**
 * Ghi chép / My Hanoicam — personal notes surface.
 * Public only when at least NOTES_PUBLIC_MIN published notes exist.
 */

export const NOTES_PUBLIC_MIN = 3;

export const notePillars = [
	'Trong lớp học',
	'Quản trị, AI và nghiên cứu',
	'My Hanoicam',
] as const;

export type NotePillar = (typeof notePillars)[number];
export type NoteStatus = 'draft' | 'published';

export type Note = {
	slug: string;
	title: string;
	excerpt: string;
	date: string;
	pillar: NotePillar;
	body: string[];
	readingTime: string;
	status: NoteStatus;
	coverImage?: string;
};

export const notesArchive = {
	eyebrow: 'Ghi chép',
	title: 'My Hanoicam',
	subtitle: 'Hà Nội, lớp học, những chuyến đi và những điều khiến tôi dừng lại lâu hơn một chút.',
} as const;

/**
 * Seed notes stay draft until the owner reviews and publishes.
 * Nav, sitemap and /ghi-chep remain gated until ≥ NOTES_PUBLIC_MIN are published.
 */
export const notes: Note[] = [
	{
		slug: 'chien-luoc-khong-phai-danh-sach-mo-hinh',
		title: 'Chiến lược không phải một danh sách mô hình',
		excerpt:
			'Khi dạy Strategic Management, tôi nhận ra người học dễ nhớ tên công cụ hơn là nhìn thấy mối liên hệ giữa phân tích, lựa chọn và thực thi.',
		date: '2026-03-12',
		pillar: 'Trong lớp học',
		readingTime: '6 phút',
		status: 'draft',
		body: [
			'Một học phần quản trị chiến lược thường bắt đầu bằng rất nhiều mô hình. SWOT, Five Forces, VRIO, value chain — mỗi công cụ đều có chỗ đứng của nó. Nhưng nếu chỉ đi lần lượt theo textbook, người học dễ nhớ tên công cụ mà khó hiểu chúng nối với nhau như thế nào.',
			'Tôi bắt đầu thiết kế lại bài học như một hành trình: phân tích → lựa chọn → thực thi. Case doanh nghiệp không còn là minh họa phụ, mà là nơi người học buộc phải nhìn thấy mối quan hệ giữa dữ liệu, lựa chọn và hệ quả.',
			'Một case tốt không chỉ minh họa lý thuyết. Nó buộc người học đặt câu hỏi: nếu tôi đứng ở vị trí này, tôi sẽ chọn gì, và vì sao?',
		],
	},
	{
		slug: 'day-ai-bat-dau-tu-cong-viec',
		title: 'Dạy AI nên bắt đầu từ công việc, không từ prompt',
		excerpt:
			'AI50 không được xây như một bộ mẹo prompt. Nó đi từ hiểu công việc tới giao việc và kiểm chứng — vì đó mới là chỗ người học thường gặp khó.',
		date: '2026-04-02',
		pillar: 'Quản trị, AI và nghiên cứu',
		readingTime: '5 phút',
		status: 'draft',
		body: [
			'Người mới thường tiếp cận AI qua các mẹo prompt rời rạc. Họ tạo đầu ra nhanh nhưng khó xác định khi nào nên dùng AI, cần giao việc ra sao và phải kiểm tra điều gì.',
			'Tôi muốn AI50 giúp người học hiểu công việc của chính họ trước. Chỉ khi biết mình đang cố đạt điều gì, họ mới giao việc rõ và giữ quyền đánh giá đầu ra.',
			'Dạy AI hiệu quả không bắt đầu bằng việc cung cấp thật nhiều prompt, mà bằng việc giúp người học hiểu công việc và tiêu chuẩn của chính họ.',
		],
	},
	{
		slug: 'ha-noi-mot-goc-cham-lai',
		title: 'Hà Nội, một góc chậm lại',
		excerpt:
			'Có những góc phố khiến tôi dừng lại lâu hơn một chút — không vì chúng đẹp theo cách postcard, mà vì chúng nhắc tôi quan sát trước khi giải thích.',
		date: '2026-05-18',
		pillar: 'My Hanoicam',
		readingTime: '4 phút',
		status: 'draft',
		body: [
			'My Hanoicam không phải một chuyên mục du lịch. Đó là nơi tôi lưu lại những khoảnh khắc khiến mình chậm lại: ánh sáng cuối ngày trên mặt hồ, một quán nhỏ vẫn mở cửa khi mưa, một góc lớp học trống sau buổi giảng.',
			'Quan sát là kỹ năng nghề nghiệp của người dạy. Nếu tôi không còn khả năng nhìn một điều quen thuộc như lần đầu, tôi khó giúp người học nhìn thấy điều họ đang bỏ qua.',
			'Vì vậy tôi giữ những ghi chép này bên cạnh các dự án giáo dục. Chúng không thay thế công việc chuyên môn — chúng giữ cho công việc ấy còn mang tính người.',
		],
	},
];

export function getPublishedNotes(): Note[] {
	return notes
		.filter((note) => note.status === 'published')
		.sort((a, b) => b.date.localeCompare(a.date));
}

export function areNotesPublic(): boolean {
	return getPublishedNotes().length >= NOTES_PUBLIC_MIN;
}

export function getNote(slug: string): Note | undefined {
	return notes.find((note) => note.slug === slug);
}

export function getPublishedNote(slug: string): Note | undefined {
	const note = getNote(slug);
	if (!note || note.status !== 'published' || !areNotesPublic()) return undefined;
	return note;
}

export function getRelatedNote(slug: string): Note | undefined {
	const published = getPublishedNotes();
	const current = published.find((note) => note.slug === slug);
	if (!current) return undefined;
	return published.find((note) => note.slug !== slug && note.pillar === current.pillar) ?? published.find((note) => note.slug !== slug);
}

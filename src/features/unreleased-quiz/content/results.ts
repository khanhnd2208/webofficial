import type { GroupId, MismatchNote, OptionKey, UnchosenVariant } from '../domain/quiz';

/** Each string in `body` and `prepare` is one paragraph or list item. */
export type ResultCopy = {
	name: string;
	musicLine: string;
	/** Where the person stands now and why it matters, in two or three short paragraphs. */
	body: string[];
	/** What the workshop will work on with this person. One or two sentences. */
	atWorkshop: string;
	/** What to do or bring before the workshop. */
	prepare: string[];
};

const UNCLEAR_JOB: ResultCopy = {
	name: 'Chưa chọn bài',
	musicLine: 'Bạn đã nghe bài này rồi, nhưng chưa nắm được lời.',
	body: [
		'Bạn đã đọc tin tuyển dụng, nhưng vẫn chưa hình dung rõ công việc đó hằng ngày làm gì, hay những yêu cầu kia thực ra đòi hỏi điều gì. Đừng lo, nhiều tin tuyển dụng viết khá chung chung, đọc xong thấy mơ hồ là chuyện thường.',
		'Chỉ là khi chưa hiểu công việc, bạn sẽ khó biết những gì mình từng làm có liên quan hay không. Có khi bạn đã có kinh nghiệm phù hợp mà không nhận ra, chỉ vì nó mang một cái tên khác.',
	],
	atWorkshop:
		'Ở workshop, mình sẽ cùng bạn đọc một tin tuyển dụng và gỡ từng yêu cầu ra. Những cụm như “giao tiếp tốt” hay “chịu được áp lực” nghe chung chung, nhưng thật ra đều đang nói về những việc khá cụ thể.',
	prepare: [
		'Mở lại tin tuyển dụng đó, đánh dấu những yêu cầu bạn chưa hiểu và mang theo.',
		'Nếu có thời gian, tìm thêm một hai tin cùng vị trí để so. Yêu cầu nào lặp lại ở nhiều tin thường là điều công việc đó thực sự cần.',
	],
};

const UNCHOSEN: Record<UnchosenVariant, ResultCopy> = {
	'no-direction': {
		name: 'Chưa chọn bài',
		musicLine: 'Trong máy có cả một playlist, nhưng bạn chưa biết bấm bài nào trước.',
		body: [
			'Bạn chưa chọn được vị trí muốn ứng tuyển. Chuyện này rất bình thường, nhất là khi bạn chưa đi làm nhiều và chưa biết các công việc ngoài kia trông thế nào.',
			'Có điều, CV không viết chung chung được. Cùng một hoạt động CLB, ứng tuyển marketing thì bạn kể phần truyền thông, ứng tuyển nhân sự thì kể phần điều phối mọi người. Chưa biết mình viết cho ai, bạn sẽ không biết nên giữ gì, bỏ gì.',
			'Vì vậy việc đầu tiên chưa phải là làm CV, mà là chọn tạm một hướng để thử. Chọn tạm thôi, sau này đổi vẫn được.',
		],
		atWorkshop:
			'Ở workshop, mình sẽ cùng bạn đọc vài tin tuyển dụng có sẵn, để thấy mỗi công việc thực ra làm gì và tìm một hướng hợp với mình. Bạn chưa cần có CV.',
		prepare: [
			'Chọn một vị trí bạn thấy tò mò, kể cả khi chưa chắc. Tìm một tin tuyển dụng thật cho vị trí đó trên trang tuyển dụng hoặc fanpage công ty, rồi lưu lại trên điện thoại.',
		],
	},
	'no-jd': {
		name: 'Chưa chọn bài',
		musicLine: 'Bạn đã chọn được bài, nhưng mới nghe mỗi đoạn điệp khúc.',
		body: [
			'Bạn đã có vị trí muốn ứng tuyển, nhưng chưa đọc kỹ một tin tuyển dụng nào cho vị trí đó. Nhiều bạn cũng vậy: xem tên vị trí, mức lương là thấy đủ.',
			'Nhưng phần đáng đọc nhất lại là mô tả công việc và yêu cầu. Đó gần như là danh sách những gì người tuyển dụng muốn thấy trong CV của bạn. Bỏ qua phần này, bạn dễ viết CV theo cảm giác, kể những điều mình thấy hay thay vì những điều họ đang tìm.',
		],
		atWorkshop: UNCLEAR_JOB.atWorkshop,
		prepare: [
			'Tìm một tin tuyển dụng thật cho vị trí bạn muốn. Lần này đọc hết phần mô tả công việc và yêu cầu, chỗ nào chưa hiểu thì đánh dấu lại, rồi lưu để mang theo.',
		],
	},
	'unclear-job': UNCLEAR_JOB,
	'unclear-requirements': UNCLEAR_JOB,
};

const SCORED: Record<Exclude<GroupId, 'chua-chon-bai'>, ResultCopy> = {
	'ban-nhap': {
		name: 'Bản nháp',
		musicLine: 'Bạn đã chọn được bài. Giờ là lúc thu bản demo đầu tiên.',
		body: [
			'Bạn đã có hướng và đã đọc kỹ tin tuyển dụng, đây là bước khá nhiều bạn bỏ qua. Điều còn thiếu là ví dụ: những việc bạn từng làm chưa khớp nhiều với yêu cầu của vị trí này.',
			'Với sinh viên, chuyện này rất thường gặp, và không có nghĩa là bạn chưa đủ tốt. Tuyển thực tập sinh, người ta không chờ bạn có sẵn mọi thứ. Họ muốn thấy bạn hiểu công việc và đã bắt đầu thử làm.',
			'Một dự án nhỏ tự làm, một vai trò trong CLB hay một khóa học có sản phẩm cụ thể đều có thể thành ví dụ. Bạn bắt đầu được ngay trong học kỳ này, không cần đợi đến kỳ thực tập.',
		],
		atWorkshop:
			'Ở workshop, mình sẽ cùng bạn xem khi kinh nghiệm còn ít thì CV nên viết gì, và chọn một hai việc làm được ngay trong học kỳ này để có thêm ví dụ.',
		prepare: [
			'Mang theo tin tuyển dụng bạn đã đọc. Đánh dấu một yêu cầu bạn chưa có ví dụ nào, mình sẽ bắt đầu từ chỗ đó.',
		],
	},
	'doi-giong': {
		name: 'Đổi giọng',
		musicLine: 'Bạn đã có chất liệu. Giờ thử phối lại cho hợp bài.',
		body: [
			'Những việc bạn từng làm có thể mang tên khác hẳn vị trí bạn muốn, nhưng đã dùng đúng những kỹ năng mà vị trí đó cần. Ví dụ, phục vụ quán cà phê và chăm sóc khách hàng đều cần giao tiếp, giữ bình tĩnh và xử lý tình huống với khách.',
			'Vấn đề là người đọc CV thường không tự nối hai chuyện đó với nhau. Họ đọc nhanh, thấy chữ “phục vụ” là lướt qua. Việc của bạn là kể lại trải nghiệm đó bằng ngôn ngữ của công việc mới, để điểm chung hiện ra ngay. Không cần thêm thắt gì, chỉ cần kể đúng phần họ đang cần nghe.',
		],
		atWorkshop:
			'Ở workshop, mình sẽ cùng bạn viết lại một công việc làm thêm theo yêu cầu của một vị trí khác, mà không thêm điều gì chưa từng xảy ra.',
		prepare: ['Mang theo tin tuyển dụng bạn đã đọc.'],
	},
	'dung-bai': {
		name: 'Đúng bài',
		musicLine: 'Bài đã có sẵn. Việc còn lại là thu cho thật rõ.',
		body: [
			'Bạn đã có trải nghiệm khá sát với công việc muốn ứng tuyển. Đây là điểm xuất phát thuận lợi, nhưng cũng là chỗ dễ chủ quan nhất.',
			'Người đọc CV không ở đó lúc bạn làm. Họ chỉ biết những gì bạn viết ra, và thường đọc rất nhanh. Một dòng như “hỗ trợ tổ chức sự kiện” có thể đúng, nhưng không cho họ biết bạn làm phần nào, quy mô ra sao, kết quả thế nào. Kinh nghiệm tốt mà viết mờ thì trên giấy cũng giống như chưa làm.',
		],
		atWorkshop:
			'Ở workshop, mình sẽ cùng bạn viết lại một dòng kinh nghiệm cho cụ thể hơn, và xem dùng AI thế nào để nó giúp bạn viết gọn mà không viết quá những gì bạn đã làm.',
		prepare: ['Mang theo tin tuyển dụng bạn đã đọc, và CV hiện tại nếu bạn đã có.'],
	},
};

export function resultCopy(group: GroupId, variant: UnchosenVariant | null): ResultCopy {
	if (group === 'chua-chon-bai') return UNCHOSEN[variant ?? 'no-direction'];
	return SCORED[group];
}

/**
 * One more thing to prepare, picked from Q4 (the experience they most want to tell).
 * Shown only to the three scored groups, who already have a job and a JD in mind.
 */
export const EXPERIENCE_PREP: Record<OptionKey, string> = {
	A: 'Chọn một bài tập nhóm hoặc dự án môn học, ghi lại phần việc do chính bạn làm.',
	B: 'Chọn một hoạt động CLB, tình nguyện hoặc sự kiện, ghi lại một việc cụ thể bạn đã phụ trách.',
	C: 'Chọn một việc làm thêm, ghi lại những gì bạn thực sự làm trong một ca hoặc một tuần.',
	D: 'Chọn một kỳ thực tập hoặc dự án, ghi lại phần việc của bạn và kết quả của nó.',
	E: 'Ghi ra hai, ba việc gần đây bạn tự làm đến nơi đến chốn, việc lớn hay nhỏ đều được.',
};

/** The four starting points in order, for the "where you stand" scale on the result. */
export const RESULT_SCALE: { group: GroupId; name: string; hint: string }[] = [
	{ group: 'chua-chon-bai', name: 'Chưa chọn bài', hint: 'Chưa rõ vị trí hoặc công việc' },
	{ group: 'ban-nhap', name: 'Bản nháp', hint: 'Đã có hướng, còn ít ví dụ' },
	{ group: 'doi-giong', name: 'Đổi giọng', hint: 'Có chất liệu, cần kể lại' },
	{ group: 'dung-bai', name: 'Đúng bài', hint: 'Trải nghiệm sát công việc' },
];

/** Labels for the admin report. Not shown to people taking the quiz. */
export const MISMATCH_NOTES: Record<MismatchNote, { title: string }> = {
	'more-than-you-think': { title: 'Có thể bạn đã làm nhiều hơn mình nghĩ' },
	'no-clear-example': { title: 'Có kinh nghiệm, nhưng chưa tìm được ví dụ rõ ràng' },
	'one-is-not-all': { title: 'Một kinh nghiệm phù hợp chưa phải là tất cả' },
};

export const EVENT = {
	name: 'UNRELEASED',
	date: 'Thứ Hai, 19/10/2026',
	/** Big date on the ticket. */
	dateBadge: '19.10',
	weekday: 'Thứ Hai · 2026',
	time: '17:00 – 18:30',
	venue: 'Phòng 101C, Trường Đại học Hà Nội',
	organizer: 'HANU Career Ready',
	siteUrl: 'https://hanucareerready.site/',
	registerUrl:
		'https://docs.google.com/forms/d/e/1FAIpQLScWzaMv-Tk2OGsWCNYVF4FfRmnBMDABCwd6nqO62Drlx6_YBQ/viewform',
} as const;

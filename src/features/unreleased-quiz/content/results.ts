import type { GroupId, MismatchNote, OptionKey, UnchosenVariant } from '../domain/quiz';

/** Each string in `body` and `prepare` is one paragraph or list item. */
export type ResultCopy = {
	name: string;
	musicLine: string;
	/** Where the person stands now, in two or three short sentences. */
	body: string[];
	/** What the workshop will work on with this person. One sentence. */
	atWorkshop: string;
	/** What to do or bring before the workshop. */
	prepare: string[];
};

const UNCLEAR_JD = {
	name: 'Chưa chọn bài',
	musicLine: 'Bạn đã biết mình muốn hát bài gì, nhưng chưa nghe kỹ bài đó.',
	atWorkshop:
		'Ở workshop, chúng ta sẽ đọc một tin tuyển dụng cùng nhau để hiểu những yêu cầu như “giao tiếp tốt” hay “chịu được áp lực” thực ra đòi hỏi gì.',
};

const UNCLEAR_JOB: ResultCopy = {
	...UNCLEAR_JD,
	body: [
		'Bạn đã tìm hiểu vị trí mình muốn, nhưng vẫn chưa rõ công việc đó làm gì và cần gì. Khi chưa rõ điều này, rất khó biết những gì mình từng làm có liên quan hay không.',
	],
	prepare: [
		'Mở lại tin tuyển dụng đó, đánh dấu những yêu cầu bạn chưa hiểu và mang theo.',
		'Nếu có thời gian, tìm thêm một hai tin cùng vị trí để so. Yêu cầu nào lặp lại ở nhiều tin thường là điều công việc đó thực sự cần.',
	],
};

const UNCHOSEN: Record<UnchosenVariant, ResultCopy> = {
	'no-direction': {
		name: 'Chưa chọn bài',
		musicLine: 'Trong máy có nhiều bài, nhưng bạn chưa biết nên bắt đầu với bài nào.',
		body: [
			'Bạn chưa chọn được vị trí muốn ứng tuyển. Khi chưa biết CV viết cho công việc nào, rất khó biết nên kể gì và bỏ gì, nên đây là việc cần làm trước.',
		],
		atWorkshop:
			'Ở workshop, chúng ta sẽ bắt đầu tìm hướng từ những tin tuyển dụng có sẵn. Bạn chưa cần có CV.',
		prepare: [
			'Chọn một vị trí bạn thấy tò mò, tìm một tin tuyển dụng thật cho vị trí đó và lưu lại trên điện thoại.',
		],
	},
	'no-jd': {
		...UNCLEAR_JD,
		body: [
			'Bạn đã có hướng ứng tuyển, nhưng chưa đọc kỹ xem công việc đó cần gì. Trước khi viết CV, nên biết người tuyển dụng đang tìm ai.',
		],
		prepare: [
			'Tìm một tin tuyển dụng thật cho vị trí bạn muốn. Đọc hết phần mô tả công việc và yêu cầu, không chỉ tên vị trí hay mức lương, rồi lưu lại để mang theo.',
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
			'Bạn đã có hướng và đã đọc tin tuyển dụng, nhưng chưa có nhiều ví dụ khớp với yêu cầu của vị trí đó. Với sinh viên, chuyện này rất thường gặp.',
			'Không cần đợi đến kỳ thực tập mới có kinh nghiệm. Có những việc nhỏ bạn bắt đầu được ngay trong học kỳ này.',
		],
		atWorkshop:
			'Ở workshop, chúng ta sẽ xem nên viết gì khi kinh nghiệm còn ít, và nên làm gì trong học kỳ này để có thêm.',
		prepare: [
			'Mang theo tin tuyển dụng bạn đã đọc, đánh dấu một yêu cầu bạn chưa có ví dụ nào.',
		],
	},
	'doi-giong': {
		name: 'Đổi giọng',
		musicLine: 'Bạn đã có chất liệu của mình. Giờ thử kể nó theo một cách khác.',
		body: [
			'Những việc bạn từng làm có thể mang tên khác hẳn, nhưng đã dùng những kỹ năng mà vị trí này cần. Ví dụ, phục vụ quán cà phê và chăm sóc khách hàng đều cần giao tiếp và xử lý tình huống với khách.',
			'Điều còn thiếu là cách kể lại để người tuyển dụng nhìn ra điều đó.',
		],
		atWorkshop:
			'Ở workshop, chúng ta sẽ viết lại một công việc làm thêm theo yêu cầu của một vị trí khác, mà không thêm điều gì chưa từng xảy ra.',
		prepare: ['Mang theo tin tuyển dụng bạn đã đọc.'],
	},
	'dung-bai': {
		name: 'Đúng bài',
		musicLine: 'Bài đã có sẵn. Việc còn lại là thu cho thật rõ.',
		body: [
			'Bạn đã có trải nghiệm gần với công việc muốn ứng tuyển. Nhưng người đọc CV không ở đó lúc bạn làm việc. Họ chỉ biết những gì bạn viết ra.',
		],
		atWorkshop:
			'Ở workshop, chúng ta sẽ viết lại một dòng kinh nghiệm cho cụ thể hơn, và xem dùng AI thế nào để nó không viết quá những gì bạn đã làm.',
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
	E: 'Ghi ra hai, ba việc gần đây bạn tự làm đến nơi đến chốn, lớn nhỏ đều được.',
};

/** The four starting points in order, for the "where you stand" scale on the result. */
export const RESULT_SCALE: { group: GroupId; name: string; hint: string }[] = [
	{ group: 'chua-chon-bai', name: 'Chưa chọn bài', hint: 'Chọn vị trí, đọc kỹ tin tuyển dụng' },
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

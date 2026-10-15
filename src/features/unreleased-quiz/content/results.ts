import type { GroupId, MismatchNote, OptionKey, UnchosenVariant } from '../domain/quiz';

/** Text blocks: each string is one paragraph. `*text*` renders as italic. */
export type ResultCopy = {
	name: string;
	musicLine: string;
	body: string[];
	think: string;
	invite: string[];
	whatYouHave?: string[];
	tryThis: string[];
	atWorkshop: string[];
	whyClosing: string;
};

const UNCHOSEN_BASE = {
	name: 'Chưa chọn bài',
	think:
		'CV không cần kể tất cả về bạn. Nó cần giúp người đọc thấy những điều liên quan đến công việc họ đang tuyển.',
	invite: [
		'Vì sao cùng một CV có thể rất ổn ở công ty này, nhưng lại chẳng gây được chú ý ở công ty khác?',
		'Mình muốn cùng các bạn tìm câu trả lời.',
	],
	whyClosing:
		'Vì thế, việc đáng làm trước là hiểu rõ công việc mình muốn ứng tuyển, rồi mới tính chuyện viết CV.',
};

const READ_JD_WORKSHOP = [
	'Mình sẽ cùng các bạn đọc một JD để hiểu những yêu cầu tưởng chừng rất chung chung như “năng động”, “có kỹ năng giao tiếp” hay “chịu được áp lực” thực sự có ý nghĩa gì với công việc đó.',
];

const READ_JD_TRY = [
	'Mở lại tin tuyển dụng đó, đánh dấu những yêu cầu bạn chưa hiểu, rồi tìm thêm 1–2 tin cùng vị trí để so.',
	'Những yêu cầu lặp lại ở nhiều tin thường là điều công việc đó thực sự cần.',
];

const UNCHOSEN: Record<UnchosenVariant, ResultCopy> = {
	'no-direction': {
		...UNCHOSEN_BASE,
		musicLine: 'Trong máy có nhiều bài, nhưng bạn chưa biết nên bắt đầu với bài nào.',
		body: [
			'Bạn chưa chọn được vị trí mình muốn ứng tuyển. Khi chưa biết CV viết cho công việc nào, rất khó biết nên kể điều gì, giữ điều gì và bỏ điều gì.',
			'Có khi vấn đề không nằm ở chỗ bạn chưa có gì đáng kể, mà là chưa biết nên bắt đầu từ đâu.',
		],
		tryThis: [
			'Chọn một vị trí khiến bạn tò mò, tìm một tin tuyển dụng thật và đọc kỹ phần công việc phải làm.',
			'Chưa cần viết CV vội. Trước tiên, hãy thử hiểu công việc đó.',
		],
		atWorkshop: [
			'Chúng ta sẽ thử bắt đầu tìm hướng từ những tin tuyển dụng có sẵn.',
		],
	},
	'no-jd': {
		...UNCHOSEN_BASE,
		musicLine: 'Bạn đã biết mình muốn hát bài gì, nhưng chưa nghe kỹ bài đó.',
		body: [
			'Bạn đã có hướng ứng tuyển, nhưng chưa tìm hiểu kỹ công việc đó cần gì.',
			'Không phải bạn chưa có hướng. Chỉ là trước khi bắt tay vào viết CV, có một việc đáng làm: xem người tuyển dụng thực sự đang tìm kiếm điều gì.',
		],
		tryThis: [
			'Tìm một tin tuyển dụng thật cho vị trí bạn muốn và đọc hết phần công việc phải làm và yêu cầu, không chỉ tên vị trí hay mức lương.',
			'Chưa cần viết CV vội. Trước tiên, hãy thử hiểu công việc đó.',
		],
		atWorkshop: READ_JD_WORKSHOP,
	},
	'unclear-job': {
		...UNCHOSEN_BASE,
		musicLine: 'Bạn đã biết mình muốn hát bài gì, nhưng chưa nghe kỹ bài đó.',
		body: [
			'Bạn đã bắt đầu tìm hiểu vị trí mình muốn ứng tuyển, nhưng vẫn chưa rõ công việc đó thực sự làm gì hoặc cần gì.',
			'Điều này không có nghĩa bạn thiếu kinh nghiệm. Chỉ là bạn chưa có đủ thông tin để biết những gì mình từng làm có phù hợp hay không.',
		],
		tryThis: READ_JD_TRY,
		atWorkshop: READ_JD_WORKSHOP,
	},
	'unclear-requirements': {
		...UNCHOSEN_BASE,
		musicLine: 'Bạn đã biết mình muốn hát bài gì, nhưng chưa nghe kỹ bài đó.',
		body: [
			'Bạn đã bắt đầu tìm hiểu vị trí mình muốn ứng tuyển, nhưng vẫn chưa rõ công việc đó thực sự làm gì hoặc cần gì.',
			'Điều này không có nghĩa bạn thiếu kinh nghiệm. Chỉ là bạn chưa có đủ thông tin để biết những gì mình từng làm có phù hợp hay không.',
		],
		tryThis: READ_JD_TRY,
		atWorkshop: READ_JD_WORKSHOP,
	},
};

export const EXAMPLE_BUT_UNCLEAR_JD =
	'Bạn đã có ví dụ cụ thể để kể, nhưng vẫn chưa rõ các yêu cầu của vị trí đó. Khi hiểu rõ hơn công việc, bạn sẽ dễ biết những trải nghiệm nào thực sự phù hợp.';

const SCORED: Record<Exclude<GroupId, 'chua-chon-bai'>, ResultCopy> = {
	'ban-nhap': {
		name: 'Bản nháp',
		musicLine: 'Bạn đã chọn được bài. Giờ là lúc bắt đầu thu bản demo đầu tiên.',
		body: [
			'Bạn đã có một hướng ứng tuyển và bắt đầu tìm hiểu công việc mình muốn làm. Nhưng khi nhìn lại những việc từng làm, bạn chưa tìm được nhiều ví dụ phù hợp với yêu cầu của vị trí đó.',
			'Điều này khá dễ gặp khi còn là sinh viên. Nhưng chưa có nhiều kinh nghiệm không có nghĩa là CV phải để trống, hay bạn chỉ có thể ngồi đợi đến kỳ thực tập đầu tiên.',
		],
		think:
			'Không nhất thiết phải đi thực tập rồi mới có kinh nghiệm. Có những việc nhỏ bạn có thể bắt đầu làm ngay từ học kỳ này.',
		invite: [
			'Nếu mới chỉ có bài tập nhóm, vài hoạt động ở trường hoặc chưa từng đi làm, bạn nên viết gì vào CV?',
			'Và quan trọng hơn, nếu chưa có gì để viết thì nên bắt đầu làm gì?',
			'Mình muốn cùng các bạn thử trả lời hai câu hỏi đó.',
		],
		whatYouHave: [
			'Bạn đã bắt đầu biết mình muốn thử công việc gì. Nhờ đó, bạn có thể nhìn rõ hơn những điều mình còn thiếu.',
			'Đây cũng là lúc tốt để bắt đầu tạo ra những trải nghiệm phù hợp, thay vì đợi đến khi cần nộp CV mới nghĩ xem mình có gì.',
		],
		tryThis: [
			'Chọn một yêu cầu trong tin tuyển dụng mà bạn chưa có ví dụ để chứng minh.',
			'Rồi tự hỏi: *“Trong học kỳ này, mình có thể làm một việc nhỏ nào để bắt đầu có kinh nghiệm liên quan?”*',
		],
		atWorkshop: [
			'Chúng ta sẽ thử viết một trải nghiệm từ bài tập nhóm sao cho người đọc thấy rõ phần việc của chính bạn, thay vì chỉ biết nhóm đã làm gì.',
			'Mình cũng sẽ chỉ cho các bạn cách dùng AI để tìm những việc nhỏ, vừa sức, có thể thực hiện thật trong khoảng một tháng.',
		],
		whyClosing:
			'Vì thế, điều đáng làm lúc này là chủ động tạo thêm trải nghiệm liên quan, thay vì chỉ cố viết lại những gì đã có.',
	},
	'doi-giong': {
		name: 'Đổi giọng',
		musicLine: 'Bạn đã có chất liệu của mình. Giờ thử kể nó theo một cách khác.',
		body: [
			'Bạn đã từng làm những việc sử dụng kỹ năng gần với công việc muốn ứng tuyển, dù tên công việc có thể chẳng giống nhau.',
			'Một người từng làm phục vụ quán cà phê có thể nghĩ công việc ấy chẳng liên quan đến ngành mình học. Nhưng nếu vị trí mới cũng cần giao tiếp với khách hàng, giải quyết vấn đề hay làm việc dưới áp lực, một phần kinh nghiệm đó lại có thể rất đáng kể.',
		],
		think:
			'Có khi CV trông mỏng hơn hẳn con người thật của bạn, chỉ vì có những việc bạn chưa biết cách kể.',
		invite: [
			'Làm thế nào để một công việc làm thêm tưởng chừng chẳng liên quan trở thành một kinh nghiệm đáng đưa vào CV?',
			'Mình sẽ thử làm điều đó cùng các bạn, với cả sự trợ giúp của AI.',
		],
		whatYouHave: [
			'Có thể bạn đang quen đánh giá kinh nghiệm qua tên công việc: phục vụ, gia sư, cộng tác viên hay thành viên CLB.',
			'Nhưng khi đọc CV, người tuyển dụng còn cần biết bạn thực sự đã làm gì. Đôi khi, điều đáng kể nhất lại nằm ở những việc rất bình thường mà bạn đã làm mỗi ngày.',
		],
		tryThis: [
			'Nghĩ về một công việc bạn từng làm.',
			'Tạm quên tên chức danh đi. Hãy thử kể lại trong một ca làm, một tuần hoặc một dự án, bạn đã trực tiếp làm những gì.',
		],
		atWorkshop: [
			'Mình sẽ lấy một dòng “phục vụ quán cà phê” và thử viết lại theo yêu cầu của một công việc khác, nhưng không thêm bất kỳ điều gì chưa từng xảy ra.',
			'Các bạn cũng sẽ thấy AI có thể biến một việc làm thêm thành “quản lý quan hệ khách hàng, tăng mức hài lòng 40%” dễ dàng thế nào, và tại sao mình cần cẩn thận với những câu viết rất hay ấy.',
		],
		whyClosing:
			'Vì thế, điều đáng làm lúc này là nhìn kỹ hơn vào những công việc đã qua, thay vì vội cho rằng chúng không liên quan.',
	},
	'dung-bai': {
		name: 'Đúng bài',
		musicLine: 'Bài đã có sẵn. Việc còn lại là thu cho thật rõ.',
		body: [
			'Bạn đã có những trải nghiệm trực tiếp liên quan đến công việc muốn ứng tuyển. Đó có thể là một kỳ thực tập, một dự án môn học, một hoạt động CLB hoặc việc bạn tự làm.',
			'Nhưng có một điều rất dễ quên: người đọc CV không ở đó để nhìn thấy bạn làm việc. Họ chỉ có những gì bạn viết ra để hình dung về bạn.',
		],
		think:
			'Bạn biết mình đã làm gì. Nhưng người đọc CV chỉ biết những gì bạn cho họ thấy.',
		invite: [
			'Cùng một người, cùng một trải nghiệm, nhưng hai cách viết có thể khiến người đọc hình dung về ứng viên rất khác nhau.',
			'Mình muốn cho các bạn thấy điều đó, rồi thử xem AI giúp được đến đâu.',
		],
		whatYouHave: [
			'Bạn đã có những trải nghiệm gần với công việc mình muốn. Đây là một điểm bắt đầu tốt để chuẩn bị CV.',
			'Nhưng kinh nghiệm phù hợp chưa chắc đã được nhận ra nếu cách viết quá chung chung. Và nếu nhờ AI viết cho thật ấn tượng, đôi khi câu chữ lại đi xa hơn những gì bạn thực sự đã làm.',
		],
		tryThis: [
			'Đọc lại một dòng kinh nghiệm trong CV.',
			'Tự hỏi: *“Nếu người tuyển dụng hỏi kỹ hơn về dòng này, mình có thể kể rõ mình đã làm gì, làm như thế nào và kết quả ra sao không?”*',
		],
		atWorkshop: [
			'Mình sẽ thử viết lại một dòng “hỗ trợ bán hàng online” để người đọc hiểu rõ hơn công việc thực tế phía sau nó.',
			'Các bạn cũng sẽ được xem một cách dùng AI khá thú vị: để AI hỏi mình từng câu trước khi viết, thay vì yêu cầu nó tự tạo một bản CV thật chuyên nghiệp.',
		],
		whyClosing:
			'Vì thế, điều đáng làm lúc này là viết cho người đọc thấy rõ những gì bạn đã làm, không chỉ tên công việc.',
	},
};

export function resultCopy(group: GroupId, variant: UnchosenVariant | null): ResultCopy {
	if (group === 'chua-chon-bai') return UNCHOSEN[variant ?? 'no-direction'];
	return SCORED[group];
}

export const MISMATCH_NOTES: Record<MismatchNote, { title: string; body: string[] }> = {
	'more-than-you-think': {
		title: 'Có thể bạn đã làm nhiều hơn mình nghĩ',
		body: [
			'Ban đầu, bạn thấy kinh nghiệm của mình chưa giống công việc muốn ứng tuyển. Nhưng khi nghĩ đến các ví dụ cụ thể, bạn lại tìm ra một số điểm liên quan.',
			'Có thể bạn đã làm nhiều hơn mình vẫn nghĩ. Hãy thử nhìn lại kỹ hơn.',
		],
	},
	'no-clear-example': {
		title: 'Có kinh nghiệm, nhưng chưa tìm được ví dụ rõ ràng',
		body: [
			'Bạn cảm thấy mình đã làm những việc khá giống vị trí đang muốn ứng tuyển. Nhưng khi đối chiếu với yêu cầu cụ thể, bạn lại chưa tìm ra nhiều ví dụ.',
			'Có thể bạn cần nhìn lại từng việc mình đã làm, thay vì chỉ nhớ chung chung về công việc đó.',
		],
	},
	'one-is-not-all': {
		title: 'Một kinh nghiệm phù hợp chưa phải là tất cả',
		body: [
			'Bạn đã có ít nhất một ví dụ trực tiếp liên quan đến công việc muốn ứng tuyển. Đó là điều tốt.',
			'Nhưng một ví dụ phù hợp chưa có nghĩa là bạn đã đáp ứng được những yêu cầu khác. Hãy thử xem còn chỗ nào mình chưa có ví dụ để chứng minh.',
		],
	},
};

/** "Cách bạn đang bắt đầu", from Q3. */
export const START_NOTES: Record<'A' | 'B' | 'C' | 'D', string> = {
	A: 'Bạn chọn bắt đầu từ tin tuyển dụng. Đây là một điểm bắt đầu tốt. Việc tiếp theo là tìm xem trong những điều mình từng làm, đâu là thứ người tuyển dụng đang cần.',
	B: 'Bạn muốn tìm một mẫu CV đẹp trước. Một mẫu tốt sẽ giúp CV dễ đọc hơn, nhưng không tự quyết định bạn nên viết gì trong đó.',
	C: 'Bạn muốn bắt đầu bằng cách liệt kê những việc mình từng làm. Đây là cách tốt để nhìn lại kinh nghiệm. Nhưng không phải điều gì bạn có cũng cần đưa vào mọi bản CV.',
	D: 'Bạn chưa biết nên bắt đầu từ đâu. Thử nghĩ tới một công việc mình muốn tìm hiểu trước, rồi xem công việc ấy đang cần gì.',
};

/** "Một trải nghiệm đáng nhìn lại", from Q4. Only a suggestion, never evidence of fit. */
export const EXPERIENCE_NOTES: Record<OptionKey, string> = {
	A: 'Bạn chọn bài tập nhóm hoặc dự án môn học. Hãy thử nhớ xem trong những dự án đó, phần việc nào do chính bạn thực hiện.',
	B: 'Bạn chọn hoạt động CLB, tình nguyện hoặc sự kiện. Thay vì chỉ nhớ tên hoạt động, hãy nghĩ tới một việc cụ thể bạn đã trực tiếp phụ trách.',
	C: 'Bạn chọn việc làm thêm, dạy kèm hoặc cộng tác viên. Đừng chỉ nhìn vào tên công việc. Hãy nhớ những việc bạn thường xuyên phải làm và các tình huống bạn từng xử lý.',
	D: 'Bạn chọn thực tập, kinh doanh hoặc dự án riêng. Điều đáng kể không chỉ là tên công ty hay dự án, mà là phần việc và kết quả có sự đóng góp thực sự của bạn.',
	E: 'Bạn chưa biết trải nghiệm nào đáng để kể. Hãy thử nhớ một việc gần đây mà bạn đã tự mình thực hiện đến nơi đến chốn. Đôi khi, có những việc nhỏ mình làm quen rồi nên không còn để ý tới nữa.',
};

export const EVENT = {
	name: 'UNRELEASED',
	date: 'Thứ Hai, 19/10/2026',
	time: '17:00 – 18:30',
	venue: 'Phòng 901C, Trường Đại học Hà Nội',
	organizer: 'HANU Career Ready',
	registerUrl:
		'https://docs.google.com/forms/d/e/1FAIpQLScWzaMv-Tk2OGsWCNYVF4FfRmnBMDABCwd6nqO62Drlx6_YBQ/viewform',
} as const;

import type { OptionKey, QuestionId } from '../domain/quiz';

export type QuizQuestion = {
	id: QuestionId;
	/** Short label used in "Vì sao mình nhận được kết quả này?". */
	shortLabel: string;
	lead?: string;
	prompt: string;
	/** Shown under the prompt, before the options. */
	hint?: string;
	options: { key: OptionKey; text: string; example?: string }[];
	/** Extra line that appears after a given option is chosen. */
	followUp?: Partial<Record<OptionKey, string>>;
};

export const QUESTIONS: Record<QuestionId, QuizQuestion> = {
	q1: {
		id: 'q1',
		shortLabel: 'Vị trí muốn ứng tuyển',
		prompt: 'Bạn đã biết mình muốn ứng tuyển vị trí nào chưa?',
		hint: 'Ví dụ: thực tập sinh nhân sự, trợ giảng tiếng Anh, nhân viên chăm sóc khách hàng.',
		options: [
			{ key: 'A', text: 'Rồi, mình có một vị trí cụ thể.' },
			{ key: 'B', text: 'Mình đang cân nhắc 2–3 vị trí.' },
			{
				key: 'C',
				text: 'Mình muốn đi làm hoặc thực tập, nhưng chưa biết nên ứng tuyển vị trí nào.',
			},
			{ key: 'D', text: 'Mình chưa nghĩ tới chuyện này.' },
		],
		followUp: {
			B: 'Hãy nghĩ tới vị trí bạn muốn thử nhất khi trả lời những câu tiếp theo.',
		},
	},
	q2: {
		id: 'q2',
		shortLabel: 'Đọc tin tuyển dụng',
		prompt: 'Với vị trí đó, bạn đã đọc kỹ một tin tuyển dụng chưa?',
		hint: 'Tin tuyển dụng (JD) cho biết công việc phải làm và những yêu cầu đối với người ứng tuyển.',
		options: [
			{ key: 'A', text: 'Rồi, mình đã đọc cả phần công việc và yêu cầu.' },
			{ key: 'B', text: 'Mình mới xem tên vị trí, lương, quyền lợi hoặc đọc lướt qua.' },
			{ key: 'C', text: 'Chưa, mình chưa đọc tin tuyển dụng nào cho vị trí đó.' },
		],
	},
	q3: {
		id: 'q3',
		shortLabel: 'Việc làm đầu tiên',
		prompt: 'Nếu bắt đầu làm CV ngay hôm nay, bạn sẽ làm gì trước?',
		options: [
			{ key: 'A', text: 'Tìm một tin tuyển dụng để xem họ cần gì.' },
			{ key: 'B', text: 'Tìm một mẫu CV đẹp rồi điền thông tin.' },
			{ key: 'C', text: 'Liệt kê những việc và hoạt động mình từng tham gia.' },
			{ key: 'D', text: 'Mình chưa biết nên bắt đầu từ đâu.' },
		],
	},
	q4: {
		id: 'q4',
		shortLabel: 'Điều muốn kể',
		prompt: 'Trong những việc từng làm, bạn muốn kể điều gì nhất trong CV?',
		hint: 'Nếu đã làm nhiều loại, hãy chọn loại bạn muốn kể nhất.',
		options: [
			{ key: 'A', text: 'Bài tập nhóm, dự án môn học.' },
			{ key: 'B', text: 'Câu lạc bộ, tình nguyện, tổ chức sự kiện.' },
			{ key: 'C', text: 'Làm thêm, dạy kèm, bán hàng, cộng tác viên.' },
			{ key: 'D', text: 'Thực tập, dự án riêng hoặc tự kinh doanh.' },
			{ key: 'E', text: 'Mình chưa biết việc nào đáng để kể.' },
		],
	},
	q5: {
		id: 'q5',
		shortLabel: 'Mức độ giống công việc',
		lead: 'Ba câu cuối nhé. Hãy nghĩ về tin tuyển dụng bạn đã đọc.',
		prompt: 'So với công việc trong tin tuyển dụng đó, những việc bạn từng làm giống đến đâu?',
		options: [
			{ key: 'A', text: 'Gần như chưa có gì giống.' },
			{
				key: 'B',
				text: 'Khác công việc, nhưng có dùng những kỹ năng giống nhau.',
				example:
					'Ví dụ: phục vụ quán cà phê và chăm sóc khách hàng đều cần giao tiếp, xử lý tình huống với khách.',
			},
			{
				key: 'C',
				text: 'Mình đã trực tiếp làm những việc tương tự.',
				example: 'Ở công ty, CLB, dự án môn học hay tự làm đều được tính.',
			},
			{ key: 'D', text: 'Mình vẫn chưa rõ vị trí đó thực sự làm những gì.' },
		],
	},
	q6: {
		id: 'q6',
		shortLabel: 'Ví dụ cho một yêu cầu',
		prompt:
			'Nghĩ tới một yêu cầu quan trọng trong tin tuyển dụng. Nếu người tuyển dụng hỏi “Bạn đã từng làm việc này chưa?”, bạn sẽ trả lời thế nào?',
		hint: 'Ví dụ từ bài tập nhóm, CLB, việc làm thêm hay dự án cá nhân đều được tính, miễn là bạn thực sự tham gia làm.',
		options: [
			{ key: 'A', text: 'Mình kể được ngay một lần đã trực tiếp làm việc đó.' },
			{ key: 'B', text: 'Mình có ví dụ từ một việc khác, dùng kỹ năng gần giống.' },
			{ key: 'C', text: 'Mình mới học hoặc tập làm, chưa có ví dụ nào thật rõ.' },
			{ key: 'D', text: 'Mình chưa nghĩ ra ví dụ cụ thể nào.' },
		],
	},
	q7: {
		id: 'q7',
		shortLabel: 'Số yêu cầu có ví dụ',
		prompt:
			'Nhìn lại các yêu cầu chính trong tin tuyển dụng, bạn có ví dụ thực tế để chứng minh mình làm được bao nhiêu yêu cầu?',
		hint: 'Một ví dụ có thể đến từ việc học, làm thêm, CLB, thực tập hoặc dự án của riêng bạn.',
		options: [
			{ key: 'A', text: 'Phần lớn các yêu cầu.' },
			{ key: 'B', text: 'Một số yêu cầu.' },
			{ key: 'C', text: 'Rất ít yêu cầu.' },
			{ key: 'D', text: 'Mình chưa rõ những yêu cầu đó nói gì.' },
		],
	},
};

export function optionText(id: QuestionId, key: OptionKey): string {
	return QUESTIONS[id].options.find((option) => option.key === key)?.text ?? '';
}

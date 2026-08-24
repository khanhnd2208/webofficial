export const TEST_QUESTION_CSV_TEMPLATE = `stem,type,option_a,option_b,option_c,option_d,correct_option,feedback_a,feedback_b,explanation,difficulty,tags
Ý nào đúng nhất với phần Tổng quan của bài HRM là gì?,MCQ_SINGLE,Đây là đáp án nhiễu — không liên quan.,HRM quản trị con người để tổ chức đạt mục tiêu.,HRM chỉ lo lương thưởng.,HRM thay thế quản trị chiến lược.,B,Nhiễu.,Đúng: HRM gắn người với mục tiêu tổ chức.,HRM gắn người với mục tiêu tổ chức.,2,hrm
Reliability nghĩa là gì?,MCQ_SINGLE,Điểm số ổn định qua lần đo,Đo đúng thứ cần đo,Luôn cho điểm cao,Không cần đo lường,A,Đúng: tính nhất quán.,Reliability là độ tin cậy của phép đo.,Reliability là tính nhất quán của phép đo.,1,measurement
`;

export const TEST_QUESTION_CSV_COLUMNS = [
	{
		key: 'stem',
		aliases: 'câu hỏi, question',
		required: true,
		description: 'Nội dung câu hỏi. Fill-blank dùng token [[1]], [[2]]',
		example: 'Ý nào đúng nhất với phần Tổng quan?',
	},
	{
		key: 'type',
		aliases: 'loại',
		required: false,
		description: 'MCQ_SINGLE, MCQ_MULTI hoặc FILL_BLANK — mặc định MCQ_SINGLE',
		example: 'MCQ_SINGLE',
	},
	{
		key: 'option_a',
		aliases: 'a',
		required: false,
		description: 'Đáp án A (bắt buộc với MCQ)',
		example: 'Đây là đáp án nhiễu — không liên quan.',
	},
	{
		key: 'option_b',
		aliases: 'b',
		required: false,
		description: 'Đáp án B',
		example: 'HRM quản trị con người để tổ chức đạt mục tiêu.',
	},
	{
		key: 'option_c',
		aliases: 'c',
		required: false,
		description: 'Đáp án C — để trống thì bỏ qua',
		example: 'HRM chỉ lo lương thưởng.',
	},
	{
		key: 'option_d',
		aliases: 'd',
		required: false,
		description: 'Đáp án D — để trống thì bỏ qua',
		example: 'HRM thay thế quản trị chiến lược.',
	},
	{
		key: 'correct_option',
		aliases: 'đáp án, answer, correct',
		required: false,
		description: 'MCQ: A–F. MCQ_MULTI: A|C',
		example: 'B',
	},
	{
		key: 'explanation',
		aliases: 'giải thích',
		required: false,
		description: 'Giải thích hiện sau khi nộp bài',
		example: 'HRM gắn người với mục tiêu tổ chức.',
	},
	{
		key: 'difficulty',
		aliases: 'độ khó, bloom',
		required: false,
		description: 'Bloom 1–6, mặc định 2 (Hiểu)',
		example: '2',
	},
	{
		key: 'tags',
		aliases: 'nhãn',
		required: false,
		description: 'Tags, phân tách bằng | hoặc ,',
		example: 'hrm',
	},
	{
		key: 'blank_1_answers',
		aliases: 'blank_1',
		required: false,
		description: 'Fill-blank: các đáp án chấp nhận, phân tách |',
		example: 'reliability|do tin cay',
	},
	{
		key: 'blank_1_length',
		aliases: '',
		required: false,
		description: 'Fill-blank: số ô chữ hiển thị',
		example: '11',
	},
] as const;

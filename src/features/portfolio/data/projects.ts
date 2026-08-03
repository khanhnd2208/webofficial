export const projectCategories = [
	'Tất cả',
	'Giảng dạy quản trị',
	'Ứng dụng AI',
	'Tư vấn doanh nghiệp',
	'Nghiên cứu',
] as const;

export type ProjectCategory = Exclude<(typeof projectCategories)[number], 'Tất cả'>;

export type ProjectMedia = {
	src: string;
	alt: string;
	caption: string;
	kind: 'illustration' | 'photo' | 'slide' | 'course-map' | 'worksheet' | 'workflow' | 'report';
	approval: 'pending' | 'approved' | 'rejected';
	proofStatus: 'temporary' | 'verified';
};

export type Project = {
	title: string;
	slug: string;
	category: ProjectCategory;
	kicker: string;
	year: string;
	status: string;
	summary: string;
	coverImage: string;
	gallery: ProjectMedia[];
	role: string;
	audience: string;
	scope: string;
	context: string;
	problem: string;
	approach: string[];
	deliverables: string[];
	outcomes: string;
	projectFacts: Array<{ value: string; label: string }>;
	verifiedImpact?: Array<{ value: string; label: string }>;
	evidenceNote: string;
	testimonial?: {
		quote: string;
		personName?: string;
		role?: string;
		organization?: string;
		anonymous?: boolean;
	};
	cta: { label: string; inquiryType: string };
	lessons: string;
	relatedProjects: string[];
	featured: boolean;
};

export const projects: Project[] = [
	{
		title: 'AI50 — AI cho mọi người',
		slug: 'ai50-ai-cho-moi-nguoi',
		category: 'Ứng dụng AI',
		kicker: 'Course Design · Applied AI',
		year: '2026',
		status: 'Đang phát triển',
		summary:
			'Một chương trình giúp người mới hiểu AI, giao việc rõ hơn, kiểm chứng đầu ra và xây dựng quy trình làm việc phù hợp.',
		coverImage: '/brand/learning-as-becoming-desktop.jpg',
		gallery: [
			{
				src: '/brand/hero-landscape.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa cấu trúc học tập AI50',
				caption:
					'Hình minh họa tạm thời cho vòng lặp hiểu — thực hành — kiểm chứng; sẽ được thay bằng course map đã phê duyệt.',
			},
			{
				src: '/brand/hero-journey.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa hành trình người học trong chương trình AI50',
				caption:
					'Hình minh họa tạm thời; sẽ được thay bằng một trang học liệu thể hiện vai trò và trách nhiệm của người học.',
			},
		],
		role: 'Course Designer & Lecturer',
		audience: 'Người mới sử dụng AI',
		scope: 'Cấu trúc chương trình, học liệu, hoạt động thực hành và hệ thống kiểm chứng',
		context:
			'AI50 được phát triển cho những người muốn đưa AI vào học tập và công việc nhưng chưa có một phương pháp đủ rõ để bắt đầu.',
		problem:
			'Người mới thường tiếp cận AI qua các mẹo prompt rời rạc. Họ có thể tạo đầu ra nhanh nhưng khó xác định khi nào nên dùng AI, cần giao việc ra sao và phải kiểm tra điều gì.',
		approach: [
			'Xác định những năng lực nền tảng cần có trước khi học công cụ.',
			'Cấu trúc nội dung theo một quy trình làm việc lặp lại được.',
			'Dùng bài tập gần với công việc thật để luyện cách giao việc và kiểm chứng.',
			'Đặt trách nhiệm và quyền quyết định của con người ở trung tâm.',
		],
		deliverables: [
			'Course structure',
			'Slide deck',
			'Practice activities',
			'Verification checklist',
			'Workflow templates',
		],
		outcomes:
			'Dự án đang hình thành một cấu trúc học thống nhất, giúp người mới đi từ hiểu khái niệm đến tự thiết kế cách cộng tác với AI.',
		projectFacts: [
			{
				value: '5',
				label:
					'nhóm đầu ra đang thiết kế: cấu trúc khóa học, slide, bài tập, checklist và workflow',
			},
		],
		evidenceNote:
			'Kết quả định lượng sẽ chỉ được bổ sung sau khi chương trình có dữ liệu học tập đủ tin cậy.',
		cta: { label: 'Trao đổi về đào tạo AI', inquiryType: 'ai' },
		lessons:
			'Dạy AI hiệu quả không bắt đầu bằng việc cung cấp thật nhiều prompt, mà bằng việc giúp người học hiểu công việc và tiêu chuẩn của chính họ.',
		relatedProjects: ['ai-in-recruitment-research', 'strategic-management-learning-experience'],
		featured: true,
	},
	{
		title: 'Strategic Management Learning Experience',
		slug: 'strategic-management-learning-experience',
		category: 'Giảng dạy quản trị',
		kicker: 'Management Education',
		year: 'Hiện tại',
		status: 'Đang sử dụng và tiếp tục cải tiến',
		summary:
			'Thiết kế lại trải nghiệm học Strategic Management theo hướng trực quan, có cấu trúc và gắn với các doanh nghiệp thực tế.',
		coverImage: '/brand/hero-journey.jpg',
		gallery: [
			{
				src: '/brand/hero-figure.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa người học trong trải nghiệm Strategic Management',
				caption:
					'Hình minh họa tạm thời; sẽ được thay bằng slide thật về hành trình phân tích — lựa chọn — thực thi.',
			},
			{
				src: '/brand/hero-landscape.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa bản đồ liên kết các quyết định chiến lược',
				caption:
					'Hình minh họa tạm thời; sẽ được thay bằng một artefact case đã ẩn thông tin người học.',
			},
		],
		role: 'Course Designer & Lecturer',
		audience: 'Sinh viên học Strategic Management',
		scope: 'Cấu trúc bài học, slide, case và hoạt động học tập',
		context:
			'Học phần có nhiều mô hình phân tích và các khái niệm liên kết chặt chẽ, nhưng thường được trình bày như những công cụ tách rời.',
		problem:
			'Nếu chỉ đi lần lượt theo textbook, người học dễ nhớ tên công cụ nhưng khó hiểu mối quan hệ giữa phân tích, lựa chọn và thực thi chiến lược.',
		approach: [
			'Rà soát mục tiêu học tập và nguồn lý thuyết cốt lõi.',
			'Xác định các khái niệm người học bắt buộc phải hiểu.',
			'Sắp xếp nội dung thành một hành trình phân tích — lựa chọn — thực thi.',
			'Dùng case doanh nghiệp để nối lý thuyết với quyết định thực tế.',
			'Thiết kế hoạt động kiểm tra mức độ hiểu và khả năng áp dụng.',
		],
		deliverables: [
			'Course structure',
			'Slide deck',
			'Reading materials',
			'Case studies',
			'Learning activities',
		],
		outcomes:
			'Dự án giúp hình thành một cấu trúc bài học thống nhất hơn và giảm sự rời rạc giữa các công cụ phân tích.',
		projectFacts: [{ value: '5', label: 'nhóm học liệu trong cùng một hệ thống trải nghiệm học' }],
		evidenceNote:
			'Tác động được mô tả ở mức thiết kế; số liệu người học chỉ công bố khi được tổng hợp và xác minh.',
		cta: { label: 'Trao đổi về học tập quản trị', inquiryType: 'training' },
		lessons:
			'Một case tốt không chỉ minh họa lý thuyết; nó phải buộc người học nhìn thấy mối quan hệ giữa dữ liệu, lựa chọn và hệ quả.',
		relatedProjects: ['ai50-ai-cho-moi-nguoi', 'moonie-cafe-business-development'],
		featured: true,
	},
	{
		title: 'Moonie Café Business Development',
		slug: 'moonie-cafe-business-development',
		category: 'Tư vấn doanh nghiệp',
		kicker: 'Business Advisory',
		year: 'Hiện tại',
		status: 'Hồ sơ đang hoàn thiện',
		summary:
			'Phân tích mô hình hoạt động, tài chính, marketing, vận hành và phát triển con người cho một doanh nghiệp dịch vụ nhỏ.',
		coverImage: '/brand/hero-landscape.jpg',
		gallery: [
			{
				src: '/brand/hero-journey.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa hành trình phát triển doanh nghiệp Moonie Café',
				caption:
					'Hình minh họa tạm thời; sẽ được thay bằng process map khi quyền chia sẻ được xác nhận.',
			},
			{
				src: '/brand/hero-figure.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa vai trò con người trong cải tiến vận hành',
				caption:
					'Hình minh họa tạm thời; sẽ được thay bằng trích đoạn recommendation report đã được phép công bố.',
			},
		],
		role: 'Business Advisor',
		audience: 'Doanh nghiệp dịch vụ nhỏ',
		scope: 'Phân tích mô hình hoạt động, vận hành, marketing và phát triển đội ngũ',
		context:
			'Một doanh nghiệp nhỏ cần nhìn lại cách các quyết định về khách hàng, vận hành, tài chính và con người ảnh hưởng lẫn nhau.',
		problem:
			'Các vấn đề vận hành thường được xử lý riêng lẻ, khiến giải pháp ngắn hạn ở một điểm có thể tạo thêm áp lực ở điểm khác.',
		approach: [
			'Làm rõ mục tiêu và các dấu hiệu cho thấy hoạt động đang gặp trở ngại.',
			'Tổng hợp dữ liệu theo các dòng công việc thay vì theo phòng ban.',
			'Phân tích mối liên hệ giữa trải nghiệm khách hàng, vận hành và nguồn lực.',
			'Xây dựng các lựa chọn cải thiện theo mức độ ưu tiên và khả năng thực hiện.',
		],
		deliverables: [
			'Business analysis',
			'Process map',
			'Priority framework',
			'Recommendation report',
		],
		outcomes:
			'Hồ sơ dự án đang được hoàn thiện; các kết luận định lượng chỉ được công bố khi có dữ liệu đủ tin cậy.',
		projectFacts: [
			{
				value: '4',
				label:
					'lăng kính trong phạm vi phân tích: mô hình hoạt động, vận hành, marketing và con người',
			},
		],
		evidenceNote: 'Không công bố KPI khi hồ sơ dữ liệu và quyền chia sẻ chưa được xác nhận.',
		cta: { label: 'Trao đổi về vấn đề doanh nghiệp', inquiryType: 'business' },
		lessons:
			'Với doanh nghiệp nhỏ, giải pháp tốt phải cân bằng tham vọng thay đổi với năng lực vận hành thực tế của đội ngũ.',
		relatedProjects: ['strategic-management-learning-experience', 'ai-in-recruitment-research'],
		featured: true,
	},
	{
		title: 'AI in Recruitment Research',
		slug: 'ai-in-recruitment-research',
		category: 'Nghiên cứu',
		kicker: 'Research · Human Resource Management',
		year: 'Hiện tại',
		status: 'Nghiên cứu đang tiếp tục',
		summary:
			'Nghiên cứu ứng dụng AI trong tuyển dụng, tập trung vào lợi ích, rủi ro, tính minh bạch và quản trị AI có trách nhiệm.',
		coverImage: '/brand/hero-figure.jpg',
		gallery: [
			{
				src: '/brand/hero-landscape.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa bản đồ rủi ro AI trong tuyển dụng',
				caption: 'Hình minh họa tạm thời; sẽ được thay bằng bản đồ rủi ro trích từ nghiên cứu.',
			},
			{
				src: '/brand/learning-as-becoming-desktop.jpg',
				kind: 'illustration',
				approval: 'approved',
				proofStatus: 'temporary',
				alt: 'Minh họa nguyên tắc sử dụng AI có trách nhiệm',
				caption:
					'Hình minh họa tạm thời; sẽ được thay bằng responsible-use checklist đã hoàn thiện.',
			},
		],
		role: 'Researcher',
		audience: 'Nhà quản lý và người làm nhân sự',
		scope: 'Tổng hợp nghiên cứu, phân tích rủi ro và khung ứng dụng có trách nhiệm',
		context:
			'AI đang tham gia ngày càng sâu vào tuyển dụng, trong khi tiêu chí đánh giá, mức độ minh bạch và trách nhiệm ra quyết định chưa phải lúc nào cũng rõ.',
		problem:
			'Tổ chức có thể tối ưu tốc độ xử lý nhưng đồng thời làm tăng rủi ro thiên lệch, khó giải thích và phụ thuộc vào đầu ra không được kiểm chứng.',
		approach: [
			'Xác định các điểm AI tham gia trong quy trình tuyển dụng.',
			'Đối chiếu lợi ích vận hành với rủi ro đối với ứng viên và tổ chức.',
			'Tổng hợp các nguyên tắc minh bạch, giám sát và quyền quyết định của con người.',
			'Chuyển kết quả nghiên cứu thành câu hỏi kiểm tra có thể dùng trong thực tế.',
		],
		deliverables: [
			'Research synthesis',
			'Risk map',
			'Responsible-use checklist',
			'Teaching materials',
		],
		outcomes:
			'Nghiên cứu tạo nền tảng để thảo luận AI trong tuyển dụng một cách cân bằng hơn giữa hiệu quả, công bằng và trách nhiệm.',
		projectFacts: [
			{
				value: '4',
				label: 'cấu phần nghiên cứu: tổng hợp tài liệu, bản đồ rủi ro, checklist và học liệu',
			},
		],
		evidenceNote:
			'Đây là nghiên cứu đang tiếp tục; các kết luận sẽ được cập nhật khi nguồn và phạm vi phân tích thay đổi.',
		cta: { label: 'Trao đổi về nghiên cứu AI', inquiryType: 'ai' },
		lessons:
			'Một ứng dụng AI chỉ có ý nghĩa khi tổ chức có thể giải thích mục tiêu, dữ liệu, giới hạn và người chịu trách nhiệm cho quyết định cuối cùng.',
		relatedProjects: ['ai50-ai-cho-moi-nguoi', 'moonie-cafe-business-development'],
		featured: false,
	},
];

export function getProject(slug: string): Project | undefined {
	return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
	return projects.filter((project) => project.featured);
}

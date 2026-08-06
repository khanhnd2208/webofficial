export const projectCategories = [
	'Tất cả',
	'Lớp học và thiết kế học tập',
	'AI và nghiên cứu',
	'Quản trị trong thực tế',
] as const;

export type ProjectCategory = Exclude<(typeof projectCategories)[number], 'Tất cả'>;

export type ProjectTemplate = 'courseDesign' | 'learningLab' | 'inquiry';

export type ProjectMedia = {
	src: string;
	alt: string;
	caption: string;
	kind: 'illustration' | 'photo' | 'slide' | 'course-map' | 'worksheet' | 'workflow' | 'report';
	approval: 'pending' | 'approved' | 'rejected';
	proofStatus: 'temporary' | 'verified';
};

export type DesignJourneyStep = {
	label: string;
	body: string;
};

export type ProjectArtefact = {
	title: string;
	purpose: string;
	media?: ProjectMedia;
};

export type Project = {
	title: string;
	slug: string;
	template: ProjectTemplate;
	category: ProjectCategory;
	kicker: string;
	subtitle?: string;
	year: string;
	status: string;
	summary: string;
	coverImage: string;
	role: string;
	audience: string;
	timeframe: string;
	openingQuestion: string;
	intendedChange: string[];
	designJourney?: DesignJourneyStep[];
	artefacts: ProjectArtefact[];
	gallery: ProjectMedia[];
	inClassroom?: string;
	observed: string[];
	notYetConcluded: string[];
	/** Inquiry template fields */
	workingAssumptions?: string[];
	debateMap?: string[];
	openQuestions?: string[];
	sources?: string[];
	lastUpdated?: string;
	lessonsLearned: string;
	nextVersion: string[];
	cta: { label: string; inquiryType: string };
	relatedProjects: string[];
	featured: boolean;
	flagship?: boolean;
};

export function isVerifiedMedia(media: ProjectMedia): boolean {
	return media.approval === 'approved' && media.proofStatus === 'verified';
}

export function getVerifiedGallery(project: Project): ProjectMedia[] {
	return project.gallery.filter(isVerifiedMedia);
}

export function getVerifiedArtefacts(project: Project): ProjectArtefact[] {
	return project.artefacts.filter(
		(artefact) => !artefact.media || isVerifiedMedia(artefact.media),
	);
}

export const projects: Project[] = [
	{
		title: 'Strategic Management Learning Experience',
		slug: 'strategic-management-learning-experience',
		template: 'courseDesign',
		category: 'Lớp học và thiết kế học tập',
		kicker: 'Teaching & Learning',
		subtitle:
			'Thiết kế lại cách người học nhìn thấy chiến lược như một quá trình liên kết, không phải một danh sách mô hình.',
		year: 'Hiện tại',
		status: 'Đang được giảng dạy',
		summary:
			'Thiết kế lại trải nghiệm học Strategic Management theo hướng trực quan, có cấu trúc và gắn với các doanh nghiệp thực tế.',
		coverImage: '/brand/portrait-journey.png',
		role: 'Course Designer & Lecturer',
		audience: 'Sinh viên học Strategic Management',
		timeframe: 'Đang giảng dạy và tiếp tục cải tiến',
		openingQuestion:
			'Tôi nhận thấy người học dễ nhớ tên từng công cụ chiến lược hơn là nhìn thấy mối liên hệ giữa phân tích, lựa chọn và thực thi. Nếu chỉ đi lần lượt theo textbook, họ nắm được mô hình nhưng khó giải thích vì sao một quyết định chiến lược lại hợp lý trong bối cảnh cụ thể.',
		intendedChange: [
			'Người học hiểu chiến lược như một quá trình liên kết, không phải danh sách mô hình.',
			'Người học biết dùng case để quan sát dữ liệu, đặt câu hỏi và giải thích lựa chọn.',
			'Người học trải nghiệm việc phải chịu trách nhiệm cho một quyết định trong điều kiện thông tin không hoàn hảo.',
		],
		designJourney: [
			{
				label: 'Starting point',
				body: 'Làm rõ mục tiêu học tập và những khái niệm bắt buộc phải hiểu trước khi đi vào công cụ.',
			},
			{
				label: 'Learning journey',
				body: 'Sắp xếp nội dung thành hành trình phân tích → lựa chọn → thực thi.',
			},
			{
				label: 'Practice',
				body: 'Dùng case doanh nghiệp để buộc người học nối lý thuyết với quyết định thực tế.',
			},
			{
				label: 'Reflection',
				body: 'Tạo không gian để người học giải thích cơ sở lựa chọn của mình, không chỉ nêu kết luận.',
			},
			{
				label: 'Assessment',
				body: 'Kiểm tra mức độ hiểu qua khả năng vận dụng, không chỉ qua việc nhớ tên công cụ.',
			},
		],
		artefacts: [
			{
				title: 'Course journey map',
				purpose: 'Giúp người học nhìn thấy toàn bộ hành trình trước khi đi vào từng công cụ.',
			},
			{
				title: 'Slide deck tiêu biểu',
				purpose: 'Làm rõ mối liên hệ giữa phân tích, lựa chọn và thực thi trong từng buổi học.',
			},
			{
				title: 'Case doanh nghiệp',
				purpose: 'Buộc người học đặt câu hỏi và lựa chọn trong một bối cảnh có ràng buộc thật.',
			},
			{
				title: 'Learning activities',
				purpose: 'Tạo không gian thực hành quan sát, thảo luận và giải thích quyết định.',
			},
		],
		gallery: [],
		inClassroom:
			'Trong lớp, người học làm việc theo nhóm trên case, trình bày lựa chọn và nhận phản hồi về mức độ liên kết giữa dữ liệu và quyết định. Phần mạnh nhất thường không nằm ở câu trả lời đúng, mà ở khả năng giải thích đánh đổi.',
		observed: [
			'Cấu trúc bài học thống nhất hơn và giảm sự rời rạc giữa các công cụ phân tích.',
			'Người học bắt đầu đặt câu hỏi về mối liên hệ giữa các bước thay vì chỉ liệt kê mô hình.',
		],
		notYetConcluded: [
			'Tác động định lượng lên kết quả học tập chưa được tổng hợp đủ để công bố.',
			'Mức độ chuyển giao sang môn học khác vẫn đang được quan sát.',
		],
		lessonsLearned:
			'Một case tốt không chỉ minh họa lý thuyết; nó phải buộc người học nhìn thấy mối quan hệ giữa dữ liệu, lựa chọn và hệ quả. Thiết kế dự án này khiến tôi coi việc dạy như việc dựng một hành trình suy nghĩ, không phải một danh mục kiến thức.',
		nextVersion: [
			'Bổ sung course map trực quan vào học liệu công khai.',
			'Thử thêm reflection cá nhân sau mỗi case lớn.',
			'Thu thập feedback có phép đăng để hiểu chỗ người học còn vướng.',
		],
		cta: { label: 'Trao đổi về việc học quản trị', inquiryType: 'training' },
		relatedProjects: ['ai50-ai-cho-moi-nguoi', 'learning-at-moonie-cafe'],
		featured: true,
		flagship: true,
	},
	{
		title: 'AI50 — AI cho mọi người',
		slug: 'ai50-ai-cho-moi-nguoi',
		template: 'courseDesign',
		category: 'AI và nghiên cứu',
		kicker: 'Teaching & Learning · Applied AI',
		subtitle:
			'Không dạy AI bằng mẹo prompt rời rạc, mà đi từ hiểu công việc tới giao việc và kiểm chứng.',
		year: '2026',
		status: 'Đang phát triển',
		summary:
			'Một chương trình giúp người mới hiểu AI, giao việc rõ hơn, kiểm chứng đầu ra và xây dựng cách làm việc phù hợp.',
		coverImage: '/brand/portrait-journey.png',
		role: 'Course Designer & Lecturer',
		audience: 'Người mới sử dụng AI',
		timeframe: 'Pilot / đang phát triển',
		openingQuestion:
			'Tôi nhận thấy người mới thường tiếp cận AI qua các mẹo prompt. Họ tạo đầu ra nhanh nhưng khó xác định khi nào nên dùng AI, cần giao việc ra sao và phải kiểm tra điều gì trước khi tin vào kết quả.',
		intendedChange: [
			'Người học hiểu công việc của mình đủ rõ để biết AI nên tham gia ở đâu.',
			'Người học giao việc cho AI với mục tiêu, ràng buộc và tiêu chuẩn đầu ra.',
			'Người học giữ quyền đánh giá và chịu trách nhiệm cho quyết định cuối cùng.',
		],
		designJourney: [
			{
				label: 'Starting point',
				body: 'Bắt đầu từ công việc và tiêu chuẩn của con người, không từ danh sách công cụ.',
			},
			{
				label: 'Learning journey',
				body: 'Sáu bài học đi từ hiểu AI → chọn việc → giao việc → kiểm chứng → xây workflow → giữ trách nhiệm.',
			},
			{
				label: 'Practice',
				body: 'Thực hành trên tình huống gần với học tập và công việc thật.',
			},
			{
				label: 'Reflection',
				body: 'Người học tự đánh giá đâu là chỗ AI hữu ích và đâu là chỗ không nên giao.',
			},
			{
				label: 'Assessment',
				body: 'Kiểm tra qua khả năng thiết kế một vòng làm việc có kiểm chứng, không qua số lượng prompt.',
			},
		],
		artefacts: [
			{
				title: 'Course structure — sáu bài học',
				purpose: 'Cho thấy logic giữa các bài: mỗi bài mở một năng lực cần có trước bài tiếp theo.',
			},
			{
				title: 'Exercise mẫu',
				purpose: 'Luyện cách giao việc rõ ràng trên một tình huống công việc cụ thể.',
			},
			{
				title: 'Verification checklist',
				purpose: 'Giúp người học biết phải kiểm tra điều gì trước khi chấp nhận đầu ra của AI.',
			},
			{
				title: 'Workflow mẫu',
				purpose: 'Chuyển bài học thành một vòng làm việc có thể lặp lại trong thực tế.',
			},
		],
		gallery: [],
		inClassroom:
			'AI50 đang ở giai đoạn pilot. Mục tiêu của các buổi thử là quan sát chỗ người học còn nhầm giữa tốc độ tạo đầu ra và chất lượng quyết định.',
		observed: [
			'Cấu trúc học thống nhất giúp người mới đi từ hiểu khái niệm đến tự thiết kế cách cộng tác với AI.',
			'Người học dễ tiếp cận hơn khi bài bắt đầu từ công việc của họ thay vì từ tính năng công cụ.',
		],
		notYetConcluded: [
			'Dữ liệu học tập từ các vòng pilot chưa đủ để công bố kết quả định lượng.',
			'Mức độ phù hợp theo từng nhóm đối tượng vẫn đang được tinh chỉnh.',
		],
		lessonsLearned:
			'Dạy AI hiệu quả không bắt đầu bằng việc cung cấp thật nhiều prompt, mà bằng việc giúp người học hiểu công việc và tiêu chuẩn của chính họ.',
		nextVersion: [
			'Hoàn thiện verification checklist để dùng trong lớp.',
			'Thêm workflow mẫu cho hai nhóm đối tượng phổ biến.',
			'Chạy thêm một vòng pilot và ghi nhận quan sát có hệ thống.',
		],
		cta: { label: 'Trao đổi về một chương trình AI', inquiryType: 'ai' },
		relatedProjects: ['ai-in-recruitment-research', 'strategic-management-learning-experience'],
		featured: true,
	},
	{
		title: 'Learning at Moonie Café',
		slug: 'learning-at-moonie-cafe',
		template: 'learningLab',
		category: 'Quản trị trong thực tế',
		kicker: 'Business in Practice · Learning Lab',
		subtitle: 'Dạy và học quản trị trong một doanh nghiệp nhỏ đang vận hành thật.',
		year: 'Hiện tại',
		status: 'Đang phát triển',
		summary:
			'Một không gian học tập gắn với doanh nghiệp dịch vụ nhỏ, nơi người học quan sát hoạt động thật và nối lý thuyết quản trị với vấn đề đang diễn ra.',
		coverImage: '/brand/portrait-journey.png',
		role: 'Educator & Learning Designer',
		audience: 'Người học quản trị và đội ngũ doanh nghiệp nhỏ',
		timeframe: 'Đang phát triển các module học tập',
		openingQuestion:
			'Tôi muốn biết điều gì xảy ra khi người học không chỉ đọc case trên giấy, mà được quan sát một doanh nghiệp nhỏ đang vận hành — với khách hàng thật, ràng buộc thật và những đánh đổi không thể trì hoãn.',
		intendedChange: [
			'Người học nhìn thấy mối liên hệ giữa khách hàng, vận hành, tài chính và con người trong một bối cảnh sống.',
			'Người học biết đặt câu hỏi quản trị từ quan sát thực địa, không chỉ từ mô hình có sẵn.',
			'Doanh nghiệp và lớp học cùng được lợi từ việc làm rõ vấn đề trước khi tìm giải pháp.',
		],
		designJourney: [
			{
				label: 'Starting point',
				body: 'Làm rõ câu hỏi học tập và ranh giới của những gì có thể quan sát tại doanh nghiệp.',
			},
			{
				label: 'Learning journey',
				body: 'Thiết kế các module xoay quanh trải nghiệm khách hàng, vận hành, con người và quyết định.',
			},
			{
				label: 'Practice',
				body: 'Người học quan sát hoạt động, ghi nhận dấu hiệu và nối với khung lý thuyết phù hợp.',
			},
			{
				label: 'Reflection',
				body: 'Đối chiếu những gì quan sát được với giả định ban đầu và nêu đánh đổi nhìn thấy.',
			},
			{
				label: 'Assessment',
				body: 'Đánh giá qua khả năng đặt đúng vấn đề và đề xuất bước đi phù hợp với nguồn lực thực tế.',
			},
		],
		artefacts: [
			{
				title: 'Module map',
				purpose: 'Cho thấy các chủ đề học gắn với dòng hoạt động thật của quán.',
			},
			{
				title: 'Observation guide',
				purpose: 'Giúp người học quan sát có cấu trúc thay vì ghi nhận cảm tính.',
			},
			{
				title: 'Field reflection prompts',
				purpose: 'Buộc người học nối quan sát với khái niệm quản trị đã học.',
			},
		],
		gallery: [],
		inClassroom:
			'Learning lab này đang được dựng dần. Ưu tiên hiện tại là giữ ranh giới rõ giữa trải nghiệm học tập và hoạt động kinh doanh, để cả hai bên đều được tôn trọng.',
		observed: [
			'Bối cảnh doanh nghiệp nhỏ làm cho khái niệm quản trị trở nên cụ thể nhanh hơn case giả định.',
			'Người học đặt câu hỏi sâu hơn khi thấy ràng buộc nguồn lực ngay trước mắt.',
		],
		notYetConcluded: [
			'Các module học tập vẫn đang được thiết kế và chưa có đủ artefact công khai.',
			'Tác động lên cả người học và đội ngũ vận hành cần thêm thời gian quan sát.',
		],
		lessonsLearned:
			'Dạy quản trị trong doanh nghiệp thật đòi hỏi sự khiêm tốn: không mang giải pháp có sẵn vào, mà giúp người học và đội ngũ nhìn rõ vấn đề trước đã.',
		nextVersion: [
			'Hoàn thiện observation guide cho buổi thực địa đầu tiên.',
			'Thiết kế hai module xoay quanh trải nghiệm khách hàng và vận hành.',
			'Xác định rõ những gì có thể chia sẻ công khai mà không ảnh hưởng doanh nghiệp.',
		],
		cta: { label: 'Trao đổi về một vấn đề doanh nghiệp', inquiryType: 'business' },
		relatedProjects: ['strategic-management-learning-experience', 'ai-in-recruitment-research'],
		featured: true,
	},
	{
		title: 'AI in Recruitment Research',
		slug: 'ai-in-recruitment-research',
		template: 'inquiry',
		category: 'AI và nghiên cứu',
		kicker: 'Ongoing Inquiry · Human Resource Management',
		subtitle: 'Nghiên cứu đang diễn ra về lợi ích, rủi ro và trách nhiệm khi AI tham gia tuyển dụng.',
		year: 'Hiện tại',
		status: 'Nghiên cứu đang diễn ra',
		summary:
			'Một cuộc điều tra đang tiếp diễn về ứng dụng AI trong tuyển dụng, tập trung vào lợi ích, rủi ro, tính minh bạch và quyền quyết định của con người.',
		coverImage: '/brand/portrait-journey.png',
		role: 'Researcher',
		audience: 'Nhà quản lý và người làm nhân sự',
		timeframe: 'Ongoing research',
		openingQuestion:
			'Khi AI tham gia ngày càng sâu vào tuyển dụng, tổ chức đang tối ưu điều gì — và đánh đổi điều gì về công bằng, minh bạch và trách nhiệm ra quyết định?',
		intendedChange: [
			'Làm rõ các điểm AI tham gia trong quy trình tuyển dụng.',
			'Đối chiếu lợi ích vận hành với rủi ro đối với ứng viên và tổ chức.',
			'Chuyển kết quả nghiên cứu thành câu hỏi kiểm tra có thể dùng trong thực tế.',
		],
		artefacts: [
			{
				title: 'Research synthesis',
				purpose: 'Tổng hợp các nguồn và khái niệm chính đang định hình cuộc tranh luận.',
			},
			{
				title: 'Debate map',
				purpose: 'Nhìn thấy các lập luận đối lập thay vì chỉ liệt kê lợi ích.',
			},
			{
				title: 'Working framework',
				purpose: 'Giữ một khung tạm thời để kiểm tra giả định khi nguồn mới xuất hiện.',
			},
		],
		gallery: [],
		observed: [
			'AI trong tuyển dụng thường được bàn luận theo hiệu quả vận hành trước, trong khi tiêu chí công bằng và giải thích còn mờ.',
			'Quyền quyết định của con người cần được thiết kế chủ động, không phải để lại như phần dư của tự động hóa.',
		],
		notYetConcluded: [
			'Phạm vi nguồn và bối cảnh tổ chức vẫn đang mở rộng.',
			'Các giả định làm việc sẽ thay đổi khi có thêm bằng chứng thực địa.',
		],
		workingAssumptions: [
			'Một ứng dụng AI chỉ có ý nghĩa khi tổ chức giải thích được mục tiêu, dữ liệu, giới hạn và người chịu trách nhiệm.',
			'Tối ưu tốc độ xử lý không tự động đồng nghĩa với quyết định tuyển dụng tốt hơn.',
			'Minh bạch với ứng viên và giám sát nội bộ là điều kiện, không phải phần phụ.',
		],
		debateMap: [
			'Hiệu quả sàng lọc nhanh hơn ↔ rủi ro thiên lệch bị khuếch đại.',
			'Tính nhất quán của thuật toán ↔ khó giải thích quyết định với ứng viên.',
			'Tự động hóa quy trình ↔ nhu cầu giữ phán đoán của người làm nhân sự.',
		],
		openQuestions: [
			'Tổ chức nhỏ có thể giám sát AI tuyển dụng ở mức nào là thực tế?',
			'Những tín hiệu nào cho thấy AI đang tối ưu sai mục tiêu?',
			'Làm sao dạy người làm nhân sự đặt câu hỏi đúng trước khi tin vào đầu ra?',
		],
		sources: [
			'Tổng hợp nghiên cứu học thuật về AI trong HRM',
			'Nguyên tắc sử dụng AI có trách nhiệm trong tuyển dụng',
			'Quan sát từ thực tiễn đào tạo và tư vấn liên quan',
		],
		lastUpdated: '2026-06',
		lessonsLearned:
			'Nghiên cứu đang dạy tôi rằng câu hỏi tốt quan trọng hơn kết luận sớm. Việc giữ trạng thái “đang diễn ra” một cách trung thực cũng là một phần của trách nhiệm học thuật.',
		nextVersion: [
			'Cập nhật bản đồ tranh luận khi có nguồn mới.',
			'Chuyển một phần giả định thành checklist dạy được trong lớp.',
			'Viết ghi chép công khai về một điểm còn chưa rõ.',
		],
		cta: { label: 'Trao đổi về nghiên cứu AI', inquiryType: 'ai' },
		relatedProjects: ['ai50-ai-cho-moi-nguoi', 'learning-at-moonie-cafe'],
		featured: false,
	},
];

export function getProject(slug: string): Project | undefined {
	return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
	return projects.filter((project) => project.featured);
}

export function getFlagshipProject(): Project | undefined {
	return projects.find((project) => project.flagship) ?? projects.find((project) => project.featured);
}

/**
 * Seed published My Class sample courses large enough to exercise UI.
 * HRM keeps the original slugs (e2e). Three extra courses clone the same
 * placeholder shape with unique prefixes. Content is not a real syllabus.
 * Run: npm run db:seed:my-class
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
	PrismaClient,
	type MyClassCourseLevel,
	type MyClassQuestionType,
	type Prisma,
} from '@prisma/client';

expand(config({ path: '.env.local' }));

const connectionString =
	process.env.DATABASE_URL ??
	'postgresql://postgres:postgres@127.0.0.1:5433/teaching_platform_vocab';
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const now = new Date();
const pad = (value: number) => String(value).padStart(2, '0');

type LessonSpec = { slug: string; title: string; blurb: string };

type CourseSpec = {
	slug: string;
	title: string;
	summary: string;
	description: string;
	level: MyClassCourseLevel;
	tags: string[];
	kuPrefix: string;
	questionPrefix: string;
	legacyKuSlugs?: string[];
	legacyQuestionSlugs?: string[];
	lessons: readonly LessonSpec[];
	sectionTitles: readonly string[];
	/** When false, only course + first 2 lesson tests + first section test. */
	fullTests: boolean;
};

const HRM_LESSONS = [
	{ slug: 'hrm-la-gi', title: 'HRM là gì?', blurb: 'Người, việc, và tổ chức.' },
	{ slug: 'tuyen-dung', title: 'Tuyển dụng', blurb: 'Tìm và chọn người.' },
	{ slug: 'dao-tao-phat-trien', title: 'Đào tạo và phát triển', blurb: 'Học để làm tốt hơn.' },
	{ slug: 'dai-ngo-giu-chan', title: 'Đãi ngộ và giữ chân', blurb: 'Trả và giữ người.' },
	{ slug: 'van-hoa-to-chuc', title: 'Văn hóa tổ chức', blurb: 'Cách mọi người làm việc với nhau.' },
	{ slug: 'quan-he-lao-dong', title: 'Quan hệ lao động', blurb: 'Nội quy, đối thoại, kỷ luật.' },
	{ slug: 'suc-khoe-an-toan', title: 'Sức khỏe và an toàn', blurb: 'Làm việc mà không bị tổn hại.' },
	{ slug: 'du-lieu-nhan-su', title: 'Dữ liệu nhân sự', blurb: 'Số liệu để ra quyết định.' },
	{ slug: 'lanh-dao-nhom', title: 'Lãnh đạo nhóm', blurb: 'Sếp, nhóm, và công việc hàng ngày.' },
	{ slug: 'quan-ly-thay-doi', title: 'Quản lý thay đổi', blurb: 'Khi tổ chức đổi hướng.' },
] as const;

const STRATEGY_LESSONS = [
	{ slug: 'chien-luoc-la-gi', title: 'Chiến lược là gì?', blurb: 'Hướng đi dài hạn của tổ chức.' },
	{ slug: 'phan-tich-moi-truong', title: 'Phân tích môi trường', blurb: 'Cơ hội và đe dọa bên ngoài.' },
	{ slug: 'nang-luc-canh-tranh', title: 'Năng lực cạnh tranh', blurb: 'Việc tổ chức làm tốt hơn đối thủ.' },
	{ slug: 'lua-chon-chien-luoc', title: 'Lựa chọn chiến lược', blurb: 'Chọn hướng rồi cam kết.' },
	{ slug: 'thuc-thi-chien-luoc', title: 'Thực thi chiến lược', blurb: 'Đưa kế hoạch vào việc hàng ngày.' },
] as const;

const PROJECT_LESSONS = [
	{ slug: 'du-an-la-gi', title: 'Dự án là gì?', blurb: 'Công việc có đích và hạn.' },
	{ slug: 'pham-vi-lich', title: 'Phạm vi và lịch', blurb: 'Làm gì, khi nào xong.' },
	{ slug: 'chi-phi-rui-ro', title: 'Chi phí và rủi ro', blurb: 'Tiền và điều có thể lệch.' },
	{ slug: 'nhom-du-an', title: 'Nhóm dự án', blurb: 'Người làm việc cùng một đích.' },
	{ slug: 'giam-sat-dong', title: 'Giám sát và đóng dự án', blurb: 'Theo dõi rồi kết thúc gọn.' },
] as const;

const ETHICS_LESSONS = [
	{ slug: 'dao-duc-la-gi', title: 'Đạo đức kinh doanh là gì?', blurb: 'Đúng–sai khi làm ăn.' },
	{ slug: 'ben-lien-quan', title: 'Bên liên quan', blurb: 'Ai bị ảnh hưởng bởi quyết định.' },
	{ slug: 'quyet-dinh-dao-duc', title: 'Quyết định đạo đức', blurb: 'Cách chọn khi có xung đột.' },
	{ slug: 'van-hoa-liem-chinh', title: 'Văn hóa liêm chính', blurb: 'Thói quen trung thực trong tổ chức.' },
	{ slug: 'trach-nhiem-xa-hoi', title: 'Trách nhiệm xã hội', blurb: 'Tổ chức với cộng đồng.' },
] as const;

const SECTION_TITLES = [
	'Tổng quan',
	'Khái niệm then chốt',
	'Quy trình thực hiện',
	'Công cụ và chỉ số',
	'Tình huống lớp học',
] as const;

const EXTRA_SECTION_TITLES = ['Tổng quan', 'Khái niệm then chốt', 'Tình huống lớp học'] as const;

const KU_LABELS = ['Khái niệm', 'Ví dụ', 'Nguyên tắc', 'Bước làm', 'Lưu ý'] as const;

const QUESTIONS_PER_TEST = 10;

const COURSES: CourseSpec[] = [
	{
		slug: 'hrm-toi-gian',
		title: 'HRM tối giản',
		summary: 'Sample 10 bài × 5 phần × 4–5 Knowledge Unit để test My Class.',
		description:
			'Course mẫu đủ dài để cuộn, mở lesson, đọc KU 3 cấp, làm test theo COURSE / LESSON / SECTION. Nội dung là placeholder, không phải giáo trình chuẩn.',
		level: 'BEGINNER',
		tags: ['Nhân sự', 'Quản trị'],
		kuPrefix: 'hrm-sample-',
		questionPrefix: 'hrm-toi-gian-q-',
		legacyKuSlugs: [
			'dinh-nghia-hrm',
			'vai-tro-nha-quan-tri-nhan-su',
			'chuc-nang-hrm',
			'hrm-chien-luoc',
			'phan-tich-cong-viec',
			'hoach-dinh-nhan-su',
			'nguon-tuyen-dung',
			'lua-chon-ung-vien',
			'nhu-cau-dao-tao',
			'phuong-phap-dao-tao',
			'lo-trinh-nghe-nghiep',
			'danh-gia-hieu-suat',
			'he-thong-luong',
			'phuc-loi',
			'gan-ket-nhan-vien',
			'giu-chan-nhan-tai',
		],
		legacyQuestionSlugs: ['hrm-toi-gian-q1', 'hrm-toi-gian-q2', 'hrm-toi-gian-q3'],
		lessons: HRM_LESSONS,
		sectionTitles: SECTION_TITLES,
		fullTests: true,
	},
	{
		slug: 'quan-tri-chien-luoc',
		title: 'Quản trị chiến lược',
		summary: 'Sample clone từ HRM — 5 bài để lấp catalog My Class.',
		description:
			'Khóa mẫu clone cấu trúc HRM. Nội dung placeholder để test lưới khóa, landing và workspace.',
		level: 'INTERMEDIATE',
		tags: ['Chiến lược', 'Quản trị'],
		kuPrefix: 'qtc-sample-',
		questionPrefix: 'qtc-q-',
		lessons: STRATEGY_LESSONS,
		sectionTitles: EXTRA_SECTION_TITLES,
		fullTests: false,
	},
	{
		slug: 'quan-ly-du-an',
		title: 'Quản lý dự án',
		summary: 'Sample clone từ HRM — phạm vi, lịch, rủi ro, nhóm.',
		description:
			'Khóa mẫu clone cấu trúc HRM. Nội dung placeholder để test catalog nhiều khóa.',
		level: 'BEGINNER',
		tags: ['Dự án', 'Quản trị'],
		kuPrefix: 'qld-sample-',
		questionPrefix: 'qld-q-',
		lessons: PROJECT_LESSONS,
		sectionTitles: EXTRA_SECTION_TITLES,
		fullTests: false,
	},
	{
		slug: 'dao-duc-kinh-doanh',
		title: 'Đạo đức kinh doanh',
		summary: 'Sample clone từ HRM — bên liên quan, quyết định, liêm chính.',
		description:
			'Khóa mẫu clone cấu trúc HRM. Nội dung placeholder để test catalog nhiều khóa.',
		level: 'ADVANCED',
		tags: ['Đạo đức', 'Quản trị'],
		kuPrefix: 'ddkd-sample-',
		questionPrefix: 'ddkd-q-',
		lessons: ETHICS_LESSONS,
		sectionTitles: EXTRA_SECTION_TITLES,
		fullTests: false,
	},
];

const requestedCourseSlug = process.argv
	.find((argument) => argument.startsWith('--course='))
	?.slice('--course='.length)
	.trim();

const selectedCourses = requestedCourseSlug
	? COURSES.filter((course) => course.slug === requestedCourseSlug)
	: COURSES;
const contentOnly = process.argv.includes('--content-only');

if (requestedCourseSlug && selectedCourses.length === 0) {
	throw new Error(
		`Unknown My Class course slug: ${requestedCourseSlug}. Expected one of: ${COURSES.map((course) => course.slug).join(', ')}`,
	);
}

const options = (items: Array<[string, string]>) => items.map(([key, text]) => ({ key, text }));

function pickKu(slugs: string[], index: number) {
	return slugs[index % slugs.length]!;
}

function representativeQuestions(input: {
	slugPrefix: string;
	lessonTitle: string;
	sectionTitle?: string;
	kuSlugs: string[];
}) {
	const scope = input.sectionTitle
		? `phần “${input.sectionTitle}” của bài “${input.lessonTitle}”`
		: `bài “${input.lessonTitle}”`;
	const ku0 = pickKu(input.kuSlugs, 0);
	const ku1 = pickKu(input.kuSlugs, 1);
	const ku2 = pickKu(input.kuSlugs, 2);

	return [
		{
			slug: `${input.slugPrefix}-01`,
			stem: `Ý nào đúng nhất với ${scope}?`,
			optionItems: [
				['A', 'Đây là đáp án nhiễu — không liên quan.'],
				['B', `Ý đúng mang tính mẫu cho ${scope}.`],
				['C', 'Chỉ dùng cho kế toán, không liên quan nhân sự.'],
				['D', 'Bỏ qua toàn bộ phần này.'],
			] as Array<[string, string]>,
			correctKey: 'B',
			explanation: `Câu ngắn để test layout mặc định. Phạm vi: ${scope}.`,
			difficulty: 1,
			kuSlugs: [ku0],
		},
		{
			slug: `${input.slugPrefix}-02`,
			stem: `Khi ôn ${scope}, học viên cần nhớ rằng nội dung seed chỉ là placeholder để kiểm tra layout: đề dài xuống dòng, thanh tiến độ, và lưới nhảy câu. Phát biểu nào mô tả đúng mục đích này?`,
			optionItems: [
				['A', 'Dùng để thay giáo trình thật.'],
				['B', 'Dùng để đo điểm học phần chính thức.'],
				['C', 'Dùng để test UI/UX của TestRunner với đề dài.'],
				['D', 'Dùng để ẩn toàn bộ kiến thức unit.'],
			] as Array<[string, string]>,
			correctKey: 'C',
			explanation: 'Câu stem dài để test wrapping trên mobile và desktop.',
			difficulty: 2,
			kuSlugs: [ku1],
		},
		{
			slug: `${input.slugPrefix}-03`,
			stem: `Chọn phương án có nội dung dài nhất phù hợp khi làm quiz ${scope}.`,
			optionItems: [
				['A', 'Ngắn.'],
				[
					'B',
					`Phương án dài: trong ${scope}, đáp án mẫu cố ý chiếm hai–ba dòng để kiểm tra radio label có xuống dòng, căn lề và vùng chạm tối thiểu khi học viên chọn.`,
				],
				['C', 'Một dòng vừa phải, không wrap.'],
				['D', 'Để trống.'],
			] as Array<[string, string]>,
			correctKey: 'B',
			explanation: 'Câu option dài để test hàng lựa chọn wrap.',
			difficulty: 2,
			kuSlugs: [ku2],
		},
		{
			slug: `${input.slugPrefix}-04`,
			stem: `Với ${scope}, chọn số phương án đúng cho câu 3 lựa chọn.`,
			optionItems: [
				['A', `Đúng — quiz ${scope} vẫn chạy với 3 options.`],
				['B', 'Sai — luôn phải có đúng 4 options.'],
				['C', 'Sai — chỉ được 2 options.'],
			] as Array<[string, string]>,
			correctKey: 'A',
			explanation: 'Câu 3 lựa chọn để test radiogroup không cố định 4 hàng.',
			difficulty: 1,
			kuSlugs: [ku0],
		},
		{
			slug: `${input.slugPrefix}-05`,
			stem: `Giải thích sau khi nộp bài cho ${scope} nên hiện thế nào?`,
			optionItems: [
				['A', 'Không hiện gì.'],
				['B', 'Chỉ hiện key đáp án, không có HTML.'],
				['C', 'Có thể hiện HTML (đoạn, list) trong phần xem lại.'],
				['D', 'Chỉ hiện khi đăng nhập admin.'],
			] as Array<[string, string]>,
			correctKey: 'C',
			explanation: `<p>Đúng vì TestRunner render explanation dạng HTML.</p><ul><li>Phạm vi: ${scope}.</li><li>Dùng để test <strong>review</strong> sau khi nộp.</li></ul>`,
			difficulty: 3,
			kuSlugs: [ku1],
		},
		{
			slug: `${input.slugPrefix}-06`,
			stem: `Câu này gắn hai Knowledge Unit trong ${scope}. Ý nào đúng?`,
			optionItems: [
				['A', 'Breakdown theo KU sẽ không hiện.'],
				['B', 'Một câu có thể đóng góp evidence cho hơn một KU.'],
				['C', 'Chỉ KU đầu tiên được tính.'],
				['D', 'Câu hai KU bị hệ thống từ chối.'],
			] as Array<[string, string]>,
			correctKey: 'B',
			explanation: 'Câu 2 KU để test KU breakdown trên màn kết quả.',
			difficulty: 3,
			kuSlugs: [ku0, ku1],
		},
		{
			slug: `${input.slugPrefix}-07`,
			stem: `Ý nào SAI khi nói về ${scope}?`,
			optionItems: [
				['A', 'Đây là nội dung placeholder để test.'],
				['B', 'Học viên có thể nhảy giữa các câu bằng lưới số.'],
				['C', 'Đây là đề thi tuyển dụng chính thức của công ty.'],
				['D', 'Có thể bỏ qua câu rồi quay lại sau.'],
			] as Array<[string, string]>,
			correctKey: 'C',
			explanation: 'Câu phủ định (“ý nào SAI”) — đáp án C.',
			difficulty: 4,
			kuSlugs: [ku2],
		},
		{
			slug: `${input.slugPrefix}-08`,
			stem: `Nhớ nhanh: ${scope} dùng để làm gì trong sample course?`,
			optionItems: [
				['A', 'Lấp chỗ trống UI.'],
				['B', 'Tính lương nhân sự thật.'],
				['C', 'Xuất chứng chỉ quốc tế.'],
				['D', 'Xóa tiến độ học viên.'],
			] as Array<[string, string]>,
			correctKey: 'A',
			explanation: 'Câu foundation, đáp án A — test không luôn chọn B.',
			difficulty: 1,
			kuSlugs: [ku0],
		},
		{
			slug: `${input.slugPrefix}-09`,
			stem: `Một nhóm đang học ${scope}. Họ muốn kiểm tra nút Trước / Tiếp / Bỏ qua và ô nhảy câu 1–10. Việc nên làm là gì?`,
			optionItems: [
				['A', 'Chỉ làm câu 1 rồi nộp ngay.'],
				['B', 'Trả lời đủ 10 câu, nhảy lung tung, rồi nộp.'],
				['C', 'Tắt JavaScript.'],
				['D', 'Xóa toàn bộ course.'],
			] as Array<[string, string]>,
			correctKey: 'B',
			explanation: 'Câu tình huống để test pager và jump grid 10 ô.',
			difficulty: 4,
			kuSlugs: [ku1],
		},
		{
			slug: `${input.slugPrefix}-10`,
			stem: `Chọn cách dùng đúng khi ôn ${scope} trên TestRunner.`,
			optionItems: [
				['A', 'Nộp khi còn câu chưa chọn — hệ thống sẽ tự điền.'],
				['B', 'Đáp án đúng luôn là D.'],
				['C', 'Không cần đọc stem.'],
				['D', 'Chọn đáp án, theo dõi “đã chọn”, rồi nộp khi đủ câu.'],
			] as Array<[string, string]>,
			correctKey: 'D',
			explanation: `Câu ứng dụng, đáp án D. Phạm vi: ${scope}.`,
			difficulty: 5,
			kuSlugs: [ku0, ku2],
		},
	];
}

function kuCountForSection(sectionIndex: number) {
	return sectionIndex % 2 === 0 ? 4 : 5;
}

function levelHtml(level: string, lessonTitle: string, sectionTitle: string, kuTitle: string) {
	return [
		`<p>Đây là nội dung <strong>${level}</strong> của “${kuTitle}” trong bài <em>${lessonTitle}</em>, phần ${sectionTitle}.</p>`,
		'<h3>Điểm chính</h3>',
		`<ul><li>${level}: nắm ý chính, chưa cần thuộc lòng.</li><li>Dùng để test layout heading, list và đoạn văn.</li><li>Kiến thức chỉ là placeholder.</li></ul>`,
		`<p><strong>Ghi nhớ:</strong> ${lessonTitle} → ${sectionTitle} → ${kuTitle}.</p>`,
	].join('');
}

function slugifySection(title: string, sectionIndex: number) {
	return `phan-${sectionIndex + 1}-${
		title
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '') || sectionIndex + 1
	}`;
}

async function clearExisting(spec: CourseSpec) {
	const knowledgeUnitWhere = {
		OR: [
			{ slug: { startsWith: spec.kuPrefix } },
			...(spec.legacyKuSlugs?.length ? [{ slug: { in: spec.legacyKuSlugs } }] : []),
		],
	};
	const existingCourse = await prisma.myClassCourse.findUnique({ where: { slug: spec.slug } });
	if (existingCourse) {
		await prisma.myClassTestAttempt.deleteMany({
			where: {
				OR: [{ courseId: existingCourse.id }, { test: { slug: { startsWith: spec.slug } } }],
			},
		});
		await prisma.myClassTest.deleteMany({ where: { slug: { startsWith: spec.slug } } });
		await prisma.myClassCourse.delete({ where: { id: existingCourse.id } });
	}

	await prisma.myClassQuestion.deleteMany({
		where: {
			OR: [
				{ slug: { startsWith: spec.questionPrefix } },
				...(spec.legacyQuestionSlugs?.length ? [{ slug: { in: spec.legacyQuestionSlugs } }] : []),
			],
		},
	});
	await prisma.myClassQuestionKnowledgeUnit.deleteMany({
		where: { knowledgeUnit: knowledgeUnitWhere },
	});
	await prisma.knowledgeUnit.updateMany({
		where: knowledgeUnitWhere,
		data: { currentPublishedRevisionId: null },
	});
	await prisma.knowledgeUnit.deleteMany({
		where: knowledgeUnitWhere,
	});
}

async function seedCourse(spec: CourseSpec) {
	const subject = await prisma.myClassSubject.upsert({
		where: { slug: `seed-${spec.slug}` },
		update: {
			name: spec.title,
			summary: `Môn mẫu cho ${spec.title}`,
			status: 'PUBLISHED',
		},
		create: {
			slug: `seed-${spec.slug}`,
			name: spec.title,
			summary: `Môn mẫu cho ${spec.title}`,
			status: 'PUBLISHED',
		},
	});
	const course = await prisma.myClassCourse.create({
		data: {
			slug: spec.slug,
			title: spec.title,
			summary: spec.summary,
			description: spec.description,
			level: spec.level,
			tags: spec.tags,
			subjectId: subject.id,
			status: 'PUBLISHED',
			publishedAt: now,
		},
	});

	const createdLessons: Array<{
		id: string;
		slug: string;
		title: string;
		sections: Array<{ id: string; title: string; unitSlugs: string[] }>;
	}> = [];

	const kuPayload: Array<{
		slug: string;
		title: string;
		summary: string;
		foundationHtml: string;
		academicHtml: string;
		expertHtml: string;
		sectionId: string;
		position: number;
	}> = [];

	for (const [lessonIndex, lessonSpec] of spec.lessons.entries()) {
		const lesson = await prisma.myClassLesson.create({
			data: {
				courseId: course.id,
				slug: lessonSpec.slug,
				title: lessonSpec.title,
				summary: `${lessonSpec.blurb} ${spec.sectionTitles.length} phần placeholder.`,
				position: lessonIndex,
				status: 'PUBLISHED',
			},
		});

		const lessonSections: Array<{ id: string; title: string; unitSlugs: string[] }> = [];
		for (const [sectionIndex, sectionTitle] of spec.sectionTitles.entries()) {
			const section = await prisma.myClassSection.create({
				data: {
					lessonId: lesson.id,
					slug: slugifySection(sectionTitle, sectionIndex),
					title: sectionTitle,
					summary: `${sectionTitle} của bài ${lessonSpec.title} — dùng để test lưới KU.`,
					position: sectionIndex,
					status: 'PUBLISHED',
				},
			});

			const count = Math.min(kuCountForSection(sectionIndex), KU_LABELS.length);
			const unitSlugs: string[] = [];
			for (let kuIndex = 0; kuIndex < count; kuIndex += 1) {
				const label = KU_LABELS[kuIndex]!;
				const slug = `${spec.kuPrefix}l${pad(lessonIndex + 1)}-s${pad(sectionIndex + 1)}-k${pad(kuIndex + 1)}`;
				const title = `${label} — ${lessonSpec.title}`;
				unitSlugs.push(slug);
				kuPayload.push({
					slug,
					title,
					summary: `${label} trong phần ${sectionTitle}, bài ${lessonSpec.title}.`,
					foundationHtml: levelHtml('Foundation', lessonSpec.title, sectionTitle, title),
					academicHtml: levelHtml('Academic', lessonSpec.title, sectionTitle, title),
					expertHtml: levelHtml('Expert', lessonSpec.title, sectionTitle, title),
					sectionId: section.id,
					position: kuIndex,
				});
			}
			lessonSections.push({ id: section.id, title: sectionTitle, unitSlugs });
		}

		createdLessons.push({ id: lesson.id, slug: lesson.slug, title: lesson.title, sections: lessonSections });
	}

	const vocabWords = [
		['recruitment', 'The process of finding and choosing people for a job.', 'noun'],
		['retention', 'The ability to keep employees in an organisation.', 'noun'],
		['onboarding', 'The first structured experience that helps a new employee start well.', 'noun'],
		['performance', 'How well a person or team achieves agreed results.', 'noun'],
		['feedback', 'Useful information about what to continue or improve.', 'noun'],
		['competency', 'A combination of knowledge, skill and behaviour.', 'noun'],
		['engagement', 'The energy and commitment people bring to their work.', 'noun'],
		['workforce', 'All people who work for an organisation.', 'noun'],
		['coaching', 'A guided conversation that helps someone improve.', 'noun'],
		['policy', 'A rule or principle that guides decisions.', 'noun'],
		['equity', 'Fair access to opportunities and rewards.', 'noun'],
		['culture', 'Shared ways of working and making meaning.', 'noun'],
	] as const;
	const vocabFixtures = contentOnly
		? []
		: [
				{ title: `${spec.title} essentials`, lessonId: null as string | null },
				{ title: `${spec.title} · Bài 1 từ khóa`, lessonId: createdLessons[0]?.id ?? null },
			];
	for (const fixture of vocabFixtures) {
		const existing = await prisma.vocabSet.findFirst({
			where: { ownerId: 'seed-my-class-admin', title: fixture.title },
		});
		const set = existing
			? await prisma.vocabSet.update({
					where: { id: existing.id },
					data: { description: 'Bộ từ mẫu cho My Class' },
				})
			: await prisma.vocabSet.create({
					data: {
						title: fixture.title,
						description: 'Bộ từ mẫu cho My Class',
						ownerId: 'seed-my-class-admin',
						ownerName: 'My Class Seed',
					},
				});
		await prisma.word.deleteMany({ where: { vocabSetId: set.id } });
		await prisma.word.createMany({
			data: vocabWords.map(([term, definition, partOfSpeech], index) => ({
				vocabSetId: set.id,
				term,
				definition,
				partOfSpeech,
				example: `Example ${index + 1}: ${term} in a people team.`,
				hintsHard: index < 6 ? [`A people topic: ${term[0]?.toUpperCase() ?? ''}…`] : [],
				hintsMedium: index < 6 ? [`Used in ${spec.title} discussions.`] : [],
				hintsEasy: index < 6 ? [`Think about ${term}.`] : [],
			})),
		});
		const scopeKey = fixture.lessonId
			? `lesson:${fixture.lessonId}:set:${set.id}`
			: `course:${course.id}:set:${set.id}`;
		await prisma.myClassVocabAssignment.upsert({
			where: { scopeKey },
			update: { courseId: course.id, lessonId: fixture.lessonId, position: fixture.lessonId ? 1 : 0 },
			create: {
				courseId: course.id,
				lessonId: fixture.lessonId,
				vocabSetId: set.id,
				scopeKey,
				position: fixture.lessonId ? 1 : 0,
			},
		});
	}

	const units = await prisma.knowledgeUnit.createManyAndReturn({
		data: kuPayload.map((unit) => ({ slug: unit.slug, status: 'PUBLISHED' as const })),
	});
	const kuIdBySlug = new Map(units.map((unit) => [unit.slug, unit.id]));

	await prisma.knowledgeUnitRevision.createMany({
		data: kuPayload.map((unit) => ({
			knowledgeUnitId: kuIdBySlug.get(unit.slug)!,
			version: 1,
			title: unit.title,
			summary: unit.summary,
			foundationHtml: unit.foundationHtml,
			academicHtml: unit.academicHtml,
			expertHtml: unit.expertHtml,
			status: 'PUBLISHED' as const,
			publishedAt: now,
		})),
	});

	await prisma.$executeRaw`
		UPDATE "KnowledgeUnit" AS ku
		SET "currentPublishedRevisionId" = r.id
		FROM "KnowledgeUnitRevision" AS r
		WHERE r."knowledgeUnitId" = ku.id
			AND ku.slug LIKE ${`${spec.kuPrefix}%`}
	`;

	await prisma.myClassSectionKnowledgeUnit.createMany({
		data: kuPayload.map((unit) => ({
			sectionId: unit.sectionId,
			knowledgeUnitId: kuIdBySlug.get(unit.slug)!,
			position: unit.position,
		})),
	});
	const existingTopic = await prisma.myClassTopic.findFirst({
		where: { subjectId: subject.id, path: 'noi-dung-mau' },
	});
	const topic = existingTopic
		? await prisma.myClassTopic.update({
				where: { id: existingTopic.id },
				data: { name: 'Nội dung mẫu', status: 'PUBLISHED' },
			})
		: await prisma.myClassTopic.create({
				data: {
					subjectId: subject.id,
					slug: 'noi-dung-mau',
					name: 'Nội dung mẫu',
					path: 'noi-dung-mau',
					depth: 0,
					status: 'PUBLISHED',
				},
			});
	await prisma.myClassTopicKnowledgeUnit.deleteMany({ where: { topicId: topic.id } });
	await prisma.myClassTopicKnowledgeUnit.createMany({
		data: kuPayload.map((unit) => ({
			topicId: topic.id,
			knowledgeUnitId: kuIdBySlug.get(unit.slug)!,
		})),
	});

	const createdQuestions: Array<{ id: string; slug: string; lessonIndex: number; kuSlugs: string[] }> =
		[];
	const lessonQuestionIds: string[][] = createdLessons.map(() => []);
	const sectionQuestionIds: Array<{ lessonIndex: number; sectionIndex: number; ids: string[] }> = [];

	async function insertQuestion(input: {
		slug: string;
		stem: string;
		optionItems: Array<[string, string]>;
		correctKey: string;
		explanation: string;
		difficulty: number;
		kuSlugs: string[];
		lessonIndex: number;
		type?: MyClassQuestionType;
		answer?: Prisma.InputJsonValue;
	}) {
		const type = input.type ?? 'MCQ_SINGLE';
		const question = await prisma.myClassQuestion.create({
			data: {
				slug: input.slug,
				type,
				stem: input.stem,
				options: type === 'FILL_BLANK' ? [] : options(input.optionItems),
				answer: input.answer ?? { type: 'MCQ_SINGLE', correctKey: input.correctKey },
				explanation: input.explanation,
				difficulty: input.difficulty,
				subjectId: subject.id,
				topicId: topic.id,
				tags: ['seed', spec.slug],
				knowledgeUnits: {
					create: input.kuSlugs.map((slug) => ({ knowledgeUnitId: kuIdBySlug.get(slug)! })),
				},
			},
		});
		createdQuestions.push({
			id: question.id,
			slug: question.slug,
			lessonIndex: input.lessonIndex,
			kuSlugs: input.kuSlugs,
		});
		return question.id;
	}

	function polymorphicQuestion(
		question: ReturnType<typeof representativeQuestions>[number],
		index: number,
	) {
		if (index === 1) {
			const secondCorrect =
				question.optionItems.find(([key]) => key !== question.correctKey)?.[0] ?? 'A';
			return {
				...question,
				type: 'MCQ_MULTI' as const,
				answer: {
					type: 'MCQ_MULTI',
					correctKeys: [question.correctKey, secondCorrect],
					scoring: 'PARTIAL',
				} satisfies Prisma.InputJsonValue,
			};
		}
		if (index === 2) {
			return {
				...question,
				type: 'FILL_BLANK' as const,
				stem: `${question.stem} [[1]]`,
				optionItems: [] as Array<[string, string]>,
				answer: {
					type: 'FILL_BLANK',
					scoring: 'PARTIAL',
					blanks: [
						{
							id: '1',
							length: 3,
							accepted: ['mau', 'mẫu'],
							caseSensitive: false,
							ignoreDiacritics: true,
							hint: 'Ba ký tự',
						},
					],
				} satisfies Prisma.InputJsonValue,
			};
		}
		return question;
	}

	const lessonIndexesForQuestions = spec.fullTests
		? createdLessons.map((_, index) => index)
		: [0, 1].filter((index) => index < createdLessons.length);

	for (const lessonIndex of lessonIndexesForQuestions) {
		const lesson = createdLessons[lessonIndex]!;
		const kuSlugs = lesson.sections.flatMap((section) => section.unitSlugs);
		const specs = representativeQuestions({
			slugPrefix: `${spec.questionPrefix}l${pad(lessonIndex + 1)}`,
			lessonTitle: lesson.title,
			kuSlugs,
		});
		for (const [index, questionSpec] of specs.entries()) {
			const id = await insertQuestion({ ...polymorphicQuestion(questionSpec, index), lessonIndex });
			lessonQuestionIds[lessonIndex]!.push(id);
		}
	}

	const sectionFixtures = spec.fullTests
		? [
				{ lessonIndex: 0, sectionIndex: 0 },
				{ lessonIndex: 1, sectionIndex: 0 },
			]
		: [{ lessonIndex: 0, sectionIndex: 0 }];
	for (const fixture of sectionFixtures) {
		const lesson = createdLessons[fixture.lessonIndex];
		const section = lesson?.sections[fixture.sectionIndex];
		if (!lesson || !section) continue;
		const specs = representativeQuestions({
			slugPrefix: `${spec.questionPrefix}s${pad(fixture.lessonIndex + 1)}s${pad(fixture.sectionIndex + 1)}`,
			lessonTitle: lesson.title,
			sectionTitle: section.title,
			kuSlugs: section.unitSlugs,
		});
		const ids: string[] = [];
		for (const [index, questionSpec] of specs.entries()) {
			ids.push(
				await insertQuestion({
					...polymorphicQuestion(questionSpec, index),
					lessonIndex: fixture.lessonIndex,
				}),
			);
		}
		sectionQuestionIds.push({ ...fixture, ids });
	}

	const tests: Array<{ slug: string; scope: string; questionCount: number }> = [];

	async function createTest(input: {
		slug: string;
		title: string;
		description: string;
		scope: 'COURSE' | 'LESSON' | 'SECTION';
		lessonId?: string;
		sectionId?: string;
		questionIds: string[];
	}) {
		if (input.questionIds.length === 0) return;
		const test = await prisma.myClassTest.create({
			data: {
				slug: input.slug,
				title: input.title,
				description: input.description,
				subjectId: subject.id,
				tags: ['seed', spec.slug],
				status: 'PUBLISHED',
				publishedAt: now,
				questions: {
					create: input.questionIds.map((questionId, position) => ({ questionId, position, points: 1 })),
				},
			},
		});
		await prisma.myClassTestPlacement.create({
			data: {
				testId: test.id,
				courseId: course.id,
				lessonId: input.lessonId ?? null,
				sectionId: input.sectionId ?? null,
				scope: input.scope,
				status: 'PUBLISHED',
				placementKey: `${test.id}:${course.id}:${input.lessonId ?? '-'}:${input.sectionId ?? '-'}`,
			},
		});
		tests.push({ slug: input.slug, scope: input.scope, questionCount: input.questionIds.length });
		return test;
	}

	const courseQuestionIds = lessonQuestionIds.flatMap((ids) => (ids[0] ? [ids[0]] : []));
	const overviewTest = await createTest({
		slug: `${spec.slug}-tong-quan`,
		title: 'Test tổng quan',
		description: `${courseQuestionIds.length} câu đại diện. Dùng để test trang làm bài và KU breakdown.`,
		scope: 'COURSE',
		questionIds: courseQuestionIds,
	});
	const reusableLesson = createdLessons[0];
	if (overviewTest && reusableLesson) {
		await prisma.myClassTestPlacement.create({
			data: {
				testId: overviewTest.id,
				courseId: course.id,
				lessonId: reusableLesson.id,
				scope: 'LESSON',
				status: 'PUBLISHED',
				position: 1,
				placementKey: `${overviewTest.id}:${course.id}:${reusableLesson.id}:-`,
			},
		});
	}

	const lessonIndexesForTests = spec.fullTests
		? createdLessons.map((_, index) => index)
		: lessonIndexesForQuestions;
	for (const lessonIndex of lessonIndexesForTests) {
		const lesson = createdLessons[lessonIndex]!;
		await createTest({
			slug: `${spec.slug}-bai-${lessonIndex + 1}`,
			title: `Test bài ${lessonIndex + 1} — ${lesson.title}`,
			description: `${QUESTIONS_PER_TEST} câu đại diện để test UI/UX bài “${lesson.title}”.`,
			scope: 'LESSON',
			lessonId: lesson.id,
			questionIds: lessonQuestionIds[lessonIndex]!,
		});
	}

	for (const [index, fixture] of sectionQuestionIds.entries()) {
		const lesson = createdLessons[fixture.lessonIndex]!;
		const section = lesson.sections[fixture.sectionIndex]!;
		await createTest({
			slug: `${spec.slug}-phan-${index + 1}`,
			title: `Test phần ${section.title} — bài ${fixture.lessonIndex + 1}`,
			description: `${QUESTIONS_PER_TEST} câu đại diện scope SECTION — stem/option dài ngắn, 3–4 lựa chọn, 1–2 KU.`,
			scope: 'SECTION',
			lessonId: lesson.id,
			sectionId: section.id,
			questionIds: fixture.ids,
		});
	}

	let cohortCount = 0;
	if (!contentOnly) {
		const cohort1 = await prisma.myClassCohort.create({
			data: {
				courseId: course.id,
				name: `Kỳ mẫu HK1 · ${spec.title}`,
				term: '2026-1',
				startsAt: new Date('2026-01-15T00:00:00.000Z'),
				endsAt: new Date('2026-05-31T00:00:00.000Z'),
				status: 'PUBLISHED',
			},
		});
		await prisma.myClassMembership.createMany({
			data: [
				{
					cohortId: cohort1.id,
					courseId: course.id,
					email: `student.active.${spec.slug}@example.com`,
					name: 'Học viên Active',
					status: 'ACTIVE',
					activatedAt: now,
				},
				{
					cohortId: cohort1.id,
					courseId: course.id,
					email: `student.an.${spec.slug}@example.com`,
					name: 'Nguyễn An',
					status: 'ACTIVE',
					activatedAt: now,
				},
				{
					cohortId: cohort1.id,
					courseId: course.id,
					email: `student.pending.${spec.slug}@example.com`,
					name: 'Học viên Pending',
					status: 'PENDING',
				},
			],
		});
		cohortCount = 1;
	}

	if (!contentOnly && spec.fullTests) {
		const cohort2 = await prisma.myClassCohort.create({
			data: {
				courseId: course.id,
				name: `Kỳ mẫu HK2 · ${spec.title}`,
				term: '2026-2',
				startsAt: new Date('2026-08-01T00:00:00.000Z'),
				endsAt: new Date('2026-12-31T00:00:00.000Z'),
				status: 'PUBLISHED',
			},
		});
		await prisma.myClassMembership.createMany({
			data: [
				{
					cohortId: cohort2.id,
					courseId: course.id,
					email: `student.binh.${spec.slug}@example.com`,
					name: 'Trần Bình',
					status: 'PENDING',
				},
				{
					cohortId: cohort2.id,
					courseId: course.id,
					email: `student.removed.${spec.slug}@example.com`,
					name: 'Lê Chi (đã gỡ)',
					status: 'REMOVED',
					removedAt: now,
				},
			],
		});
		cohortCount = 2;
	}

	return {
		course: { id: course.id, slug: course.slug, title: course.title, status: course.status },
		counts: {
			lessons: createdLessons.length,
			sections: createdLessons.length * spec.sectionTitles.length,
			knowledgeUnits: kuPayload.length,
			questions: createdQuestions.length,
			tests: tests.length,
			cohorts: cohortCount,
			vocabSets: vocabFixtures.length,
		},
		lessons: createdLessons.map((lesson) => ({ slug: lesson.slug, title: lesson.title })),
		tests,
		urls: {
			learner: `/my-space/my-class/${spec.slug}`,
			admin: '/admin/my-class',
			adminCourse: `/admin/my-class/courses/${course.id}`,
		},
	};
}

async function main() {
	for (const spec of selectedCourses) {
		await clearExisting(spec);
	}

	const seeded = [];
	for (const spec of selectedCourses) {
		seeded.push(await seedCourse(spec));
	}

	console.log(JSON.stringify({ courses: seeded }, null, 2));
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});

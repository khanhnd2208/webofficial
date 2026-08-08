/**
 * Route map — single source of truth for URL paths.
 *
 * Use these constants for links, redirects, and auth page config.
 * Do not hardcode path strings in UI or navigation.
 */

export const routes = {
	// ─── Public marketing ─────────────────────────────────────────────────────
	/** Cover / entry — "Trở thành" intro before the destination menu. */
	home: '/',
	/** Table of contents — destination gate (Giới thiệu / Dự án / Dịch vụ / …). */
	toc: '/muc-luc',
	/** @deprecated Home no longer has an in-page classroom section; prefer routes.projects. */
	homeLearningExperiences: '/du-an',
	about: '/gioi-thieu',
	projects: '/du-an',
	project: (slug: string) => `/du-an/${slug}` as const,
	services: '/dich-vu',
	/** Personal experiments hub — boardgames, podcast, tests (evidence-gated tiles). */
	mySpace: '/my-space',
	mySpaceTests: '/my-space/tests',
	mySpaceTest: (slug: string) => `/my-space/tests/${slug}` as const,
	mySpaceTestPlay: (slug: string) => `/my-space/tests/${slug}/play` as const,
	/** In-page anchors on /gioi-thieu */
	aboutServices: '/gioi-thieu#dich-vu',
	aboutTeaching: '/gioi-thieu#giang-day-workshop',
	aboutAdvisory: '/gioi-thieu#tu-van-phat-trien',
	aboutLearningDesign: '/gioi-thieu#thiet-ke-chuong-trinh',
	aboutMilestones: '/gioi-thieu#dau-moc',
	aboutProcess: '/gioi-thieu#quy-trinh',
	contact: '/lien-he',
	notes: '/ghi-chep',
	note: (slug: string) => `/ghi-chep/${slug}` as const,
	growth: '/phat-trien-ban-than',
	growthEpisode: (slug: string) => `/phat-trien-ban-than/${slug}` as const,
	archive: '/archive',

	// ─── Legacy service hubs (redirect targets live in next.config) ───────────
	accompany: '/dong-hanh',
	mentoring: '/dong-hanh/mentoring',
	businessAdvisory: '/dong-hanh/co-van-doanh-nghiep',
	trainingWorkshop: '/dong-hanh/dao-tao-workshop',
	aiApplied: '/dong-hanh/ai-ung-dung',

	// ─── Journal / Writing (legacy /bai-viet redirects to /ghi-chep) ───────────
	posts: '/bai-viet',
	post: (slug: string) => `/bai-viet/${slug}` as const,
	postPillar: (slug: string) => `/bai-viet/chu-de/${slug}` as const,
	postCollection: (slug: string) => `/bai-viet/bo-suu-tap/${slug}` as const,

	// ─── Archived public surfaces (hubs redirect via PUBLIC_REDIRECTS) ─────────
	// UI: src/_archived/marketing/routes-v1 · lab boardgames → features/kstrip-2026
	lab: '/goc-cua-khanh',
	labBoardgame: '/goc-cua-khanh/boardgame',
	labTools: '/goc-cua-khanh/cong-cu',
	labResources: '/goc-cua-khanh/tai-nguyen',
	labExperiments: '/goc-cua-khanh/thu-nghiem',
	caseStudies: '/case-study',
	caseStudy: (slug: string) => `/case-study/${slug}` as const,

	// ─── Policies (utility, not primary nav) ──────────────────────────────────
	policyPrivacy: '/chinh-sach/bao-mat',
	policyTerms: '/chinh-sach/dieu-khoan',
	policyCancellation: '/chinh-sach/huy-doi-lich',
	policyAi: '/chinh-sach/ai',

	// ─── Auth & account ───────────────────────────────────────────────────────
	login: '/dang-nhap',
	account: '/tai-khoan',
	accountLearning: '/tai-khoan/hoc',
	messagePublic: (slug: string) => `/m/${slug}` as const,

	// ─── Learning (learner surfaces; not marketing chrome) ────────────────────
	learn: '/hoc',
	learnPrograms: '/hoc/chuong-trinh',
	course: (slug: string) => `/hoc/khoa-hoc/${slug}` as const,
	lesson: (courseSlug: string, lessonSlug: string) =>
		`/hoc/khoa-hoc/${courseSlug}/bai/${lessonSlug}` as const,

	/** @deprecated Prefer aboutTeaching; kept for temporary redirects. */
	teaching: '/giang-day',

	// ─── Admin ────────────────────────────────────────────────────────────────
	admin: {
		home: '/admin',
		posts: '/admin/posts',
		postCreate: '/admin/posts/create',
		postEdit: (id: string) => `/admin/posts/${id}/edit` as const,
		courses: '/admin/courses',
		courseEdit: (courseId: string) => `/admin/courses/${courseId}` as const,
		lessonEdit: (courseId: string, lessonId: string) =>
			`/admin/courses/${courseId}/lessons/${lessonId}` as const,
		enrollments: '/admin/enrollments',
		inquiries: '/admin/inquiries',
		tools: '/admin/tools',
		vocabulary: '/admin/tools/vocabulary',
		luckyCard: '/admin/tools/lucky-card',
		messages: '/admin/tools/messages',
		myspaceTests: '/admin/myspace-tests',
		myspaceTestNew: '/admin/myspace-tests/new',
		myspaceTestEdit: (id: string) => `/admin/myspace-tests/${id}` as const,
		myspaceTestAnalytics: '/admin/myspace-tests/analytics',
		myspaceQuestions: '/admin/myspace-tests/questions',
		myspaceQuestionsImport: '/admin/myspace-tests/import',
		myspaceSubjects: '/admin/myspace-tests/subjects',
		users: '/admin/users',
		media: '/admin/media',
		settings: '/admin/settings',
	},
} as const;

/** Legacy paths kept only for permanent redirects in next.config. */
export const legacyRoutes = {
	blog: '/blog',
	blogPost: (slug: string) => `/blog/${slug}` as const,
	login: '/login',
	dashboard: '/dashboard',
	profile: '/profile',
	adminVocabulary: '/admin/vocabulary',
	messages: '/messages',
} as const;

/**
 * Permanent redirect map for retired marketing URLs.
 * Hashes are not sent in HTTP redirects — use `?section=` and scroll on /gioi-thieu.
 * Lab/course detail URLs stay reachable (noindex) via /archive; only hubs redirect.
 */
export const PUBLIC_REDIRECTS: ReadonlyArray<{
	source: string;
	destination: string;
	permanent: boolean;
}> = [
	{ source: '/dong-hanh', destination: '/dich-vu', permanent: true },
	{
		source: '/dong-hanh/mentoring',
		destination: '/dich-vu',
		permanent: true,
	},
	{
		source: '/dong-hanh/co-van-doanh-nghiep',
		destination: '/dich-vu',
		permanent: true,
	},
	{
		source: '/dong-hanh/dao-tao-workshop',
		destination: '/dich-vu',
		permanent: true,
	},
	{ source: '/dong-hanh/ai-ung-dung', destination: '/dich-vu', permanent: true },
	{ source: '/dong-hanh/:path*', destination: '/dich-vu', permanent: true },
	{ source: '/case-study', destination: '/du-an', permanent: true },
	{ source: '/case-study/:path*', destination: '/du-an', permanent: true },
	{ source: '/giang-day', destination: '/dich-vu', permanent: true },
	{ source: '/goc-cua-khanh', destination: '/du-an', permanent: true },
	{ source: '/goc-cua-khanh/:path*', destination: '/du-an', permanent: true },
	{ source: '/bai-viet', destination: '/ghi-chep', permanent: true },
	{ source: '/bai-viet/:path*', destination: '/ghi-chep', permanent: true },
	{
		source: '/du-an/moonie-cafe-business-development',
		destination: '/du-an/learning-at-moonie-cafe',
		permanent: true,
	},
	{ source: '/phat-trien-ban-than', destination: '/', permanent: true },
	{ source: '/phat-trien-ban-than/:path*', destination: '/', permanent: true },
	{ source: '/archive', destination: '/', permanent: true },
	{ source: '/hoc', destination: '/', permanent: true },
	{ source: '/hoc/chuong-trinh', destination: '/', permanent: true },
];

export type PublicRoute =
	| typeof routes.home
	| typeof routes.toc
	| typeof routes.projects
	| typeof routes.services
	| typeof routes.mySpace
	| typeof routes.notes
	| typeof routes.posts
	| typeof routes.about
	| typeof routes.growth
	| typeof routes.login
	| typeof routes.contact
	| typeof routes.archive;

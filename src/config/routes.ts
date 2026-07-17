/**
 * Route map — single source of truth for URL paths.
 *
 * Use these constants for links, redirects, and auth page config.
 * Do not hardcode path strings in UI or navigation.
 */

export const routes = {
	// ─── Public marketing ─────────────────────────────────────────────────────
	home: '/',
	homeLearningExperiences: '/#learning-experiences',
	about: '/gioi-thieu',
	/** In-page anchors on /gioi-thieu */
	aboutServices: '/gioi-thieu#dich-vu',
	aboutTeaching: '/gioi-thieu#giang-day-workshop',
	aboutAdvisory: '/gioi-thieu#tu-van-phat-trien',
	aboutLearningDesign: '/gioi-thieu#thiet-ke-chuong-trinh',
	aboutMilestones: '/gioi-thieu#dau-moc',
	aboutProcess: '/gioi-thieu#quy-trinh',
	contact: '/lien-he',
	growth: '/phat-trien-ban-than',
	growthEpisode: (slug: string) => `/phat-trien-ban-than/${slug}` as const,
	archive: '/archive',

	// ─── Legacy service hubs (redirect targets live in next.config) ───────────
	accompany: '/dong-hanh',
	mentoring: '/dong-hanh/mentoring',
	businessAdvisory: '/dong-hanh/co-van-doanh-nghiep',
	trainingWorkshop: '/dong-hanh/dao-tao-workshop',
	aiApplied: '/dong-hanh/ai-ung-dung',

	// ─── Journal / Writing ────────────────────────────────────────────────────
	posts: '/bai-viet',
	post: (slug: string) => `/bai-viet/${slug}` as const,
	postPillar: (slug: string) => `/bai-viet/chu-de/${slug}` as const,
	postCollection: (slug: string) => `/bai-viet/bo-suu-tap/${slug}` as const,

	// ─── Archived public surfaces (noindex; reachable via /archive) ───────────
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
	{ source: '/dong-hanh', destination: '/gioi-thieu?section=dich-vu', permanent: true },
	{
		source: '/dong-hanh/mentoring',
		destination: '/gioi-thieu?section=tu-van-phat-trien',
		permanent: true,
	},
	{
		source: '/dong-hanh/co-van-doanh-nghiep',
		destination: '/gioi-thieu?section=tu-van-phat-trien',
		permanent: true,
	},
	{
		source: '/dong-hanh/dao-tao-workshop',
		destination: '/gioi-thieu?section=giang-day-workshop',
		permanent: true,
	},
	{ source: '/dong-hanh/ai-ung-dung', destination: '/gioi-thieu?section=dich-vu', permanent: true },
	{ source: '/dong-hanh/:path*', destination: '/gioi-thieu?section=dich-vu', permanent: true },
	{ source: '/case-study', destination: '/gioi-thieu?section=dau-moc', permanent: true },
	{ source: '/case-study/:path*', destination: '/gioi-thieu?section=dau-moc', permanent: true },
	{ source: '/giang-day', destination: '/gioi-thieu?section=giang-day-workshop', permanent: true },
	{ source: '/goc-cua-khanh', destination: '/archive', permanent: true },
	{ source: '/hoc', destination: '/archive', permanent: true },
	{ source: '/hoc/chuong-trinh', destination: '/archive', permanent: true },
];

export type PublicRoute =
	| typeof routes.home
	| typeof routes.posts
	| typeof routes.about
	| typeof routes.growth
	| typeof routes.login
	| typeof routes.contact
	| typeof routes.archive;

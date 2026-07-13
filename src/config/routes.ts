/**
 * Route map — single source of truth for URL paths.
 *
 * Use these constants for links, redirects, and auth page config.
 * Do not hardcode path strings in UI or navigation.
 */

export const routes = {
	// ─── Public marketing ─────────────────────────────────────────────────────
	home: '/',
	about: '/gioi-thieu',
	/** Temporary about anchor until Phase 2 ships a standalone about page. */
	aboutAnchor: '/#gioi-thieu',
	contact: '/lien-he',

	// ─── Đồng hành (services) ─────────────────────────────────────────────────
	accompany: '/dong-hanh',
	mentoring: '/dong-hanh/mentoring',
	businessAdvisory: '/dong-hanh/co-van-doanh-nghiep',
	trainingWorkshop: '/dong-hanh/dao-tao-workshop',
	aiApplied: '/dong-hanh/ai-ung-dung',

	// ─── Journal (HANOICAM) ───────────────────────────────────────────────────
	posts: '/bai-viet',
	post: (slug: string) => `/bai-viet/${slug}` as const,
	postPillar: (slug: string) => `/bai-viet/chu-de/${slug}` as const,
	postCollection: (slug: string) => `/bai-viet/bo-suu-tap/${slug}` as const,

	// ─── Góc của Khánh ────────────────────────────────────────────────────────
	lab: '/goc-cua-khanh',
	labBoardgame: '/goc-cua-khanh/boardgame',
	labTools: '/goc-cua-khanh/cong-cu',
	labResources: '/goc-cua-khanh/tai-nguyen',
	labExperiments: '/goc-cua-khanh/thu-nghiem',

	// ─── Trust ────────────────────────────────────────────────────────────────
	caseStudies: '/case-study',
	caseStudy: (slug: string) => `/case-study/${slug}` as const,
	policyPrivacy: '/chinh-sach/bao-mat',
	policyTerms: '/chinh-sach/dieu-khoan',
	policyCancellation: '/chinh-sach/huy-doi-lich',
	policyAi: '/chinh-sach/ai',

	// ─── Auth & account ───────────────────────────────────────────────────────
	login: '/dang-nhap',
	account: '/tai-khoan',
	accountLearning: '/tai-khoan/hoc',
	messagePublic: (slug: string) => `/m/${slug}` as const,

	// ─── Learning ─────────────────────────────────────────────────────────────
	learn: '/hoc',
	learnPrograms: '/hoc/chuong-trinh',
	course: (slug: string) => `/hoc/khoa-hoc/${slug}` as const,
	lesson: (courseSlug: string, lessonSlug: string) =>
		`/hoc/khoa-hoc/${courseSlug}/bai/${lessonSlug}` as const,

	/** @deprecated Prefer routes.learn; kept for temporary redirects. */
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

export type PublicRoute =
	| typeof routes.home
	| typeof routes.posts
	| typeof routes.teaching
	| typeof routes.about
	| typeof routes.login
	| typeof routes.contact
	| typeof routes.accompany
	| typeof routes.learn
	| typeof routes.lab;

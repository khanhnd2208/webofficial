/**
 * Route map — single source of truth for URL paths.
 *
 * Use these constants for links, redirects, and auth page config.
 * Do not hardcode path strings in UI or navigation.
 */

export const routes = {
	// ─── Public brand ──────────────────────────────────────────────────────────
	home: '/',
	services: '/dong-hanh',
	mentoring: '/dong-hanh/mentoring',
	businessAdvisory: '/dong-hanh/co-van-doanh-nghiep',
	training: '/dong-hanh/dao-tao-workshop',
	aiAdvisory: '/dong-hanh/ai-ung-dung',
	teaching: '/giang-day',
	lab: '/goc-cua-khanh',
	about: '/gioi-thieu',
	contact: '/lien-he',

	// ─── Editorial ─────────────────────────────────────────────────────────────
	posts: '/bai-viet',
	post: (slug: string) => `/bai-viet/${slug}` as const,
	messagePublic: (slug: string) => `/m/${slug}` as const,

	// ─── Learner ──────────────────────────────────────────────────────────────
	learn: '/hoc',
	course: (slug: string) => `/hoc/khoa-hoc/${slug}` as const,
	lesson: (courseSlug: string, lessonSlug: string) =>
		`/hoc/khoa-hoc/${courseSlug}/bai/${lessonSlug}` as const,
	account: '/tai-khoan',
	login: '/dang-nhap',

	// ─── Admin ────────────────────────────────────────────────────────────────
	admin: {
		home: '/admin',
		posts: '/admin/posts',
		postCreate: '/admin/posts/create',
		postEdit: (id: string) => `/admin/posts/${id}/edit` as const,
		courses: '/admin/courses',
		courseEdit: (courseId: string) => `/admin/courses/${courseId}` as const,
		lessonEdit: (courseId: string, lessonId: string) => `/admin/courses/${courseId}/lessons/${lessonId}` as const,
		enrollments: '/admin/enrollments',
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
	| typeof routes.services
	| typeof routes.mentoring
	| typeof routes.businessAdvisory
	| typeof routes.training
	| typeof routes.aiAdvisory
	| typeof routes.teaching
	| typeof routes.lab
	| typeof routes.about
	| typeof routes.contact
	| typeof routes.posts
	| typeof routes.login;

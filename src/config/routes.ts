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
	/** Focused hub for Teaching. */
	mySpace: '/my-space',
	boardGame: '/my-space/board-game',
	boardGameTest: '/my-space/board-game/test',
	spyFall: '/my-space/board-game/spy-fall',
	spyFallRoom: (code: string) => `/my-space/board-game/spy-fall/room/${code}` as const,
	spyFallGuide: '/my-space/board-game/spy-fall/guide',
	maSoi: '/my-space/board-game/ma-soi',
	maSoiRoom: (code: string) => `/my-space/board-game/ma-soi/room/${code}` as const,
	cheeseThief: '/my-space/board-game/cheese-thief',
	cheeseThiefRoom: (code: string) => `/my-space/board-game/cheese-thief/room/${code}` as const,
	/** @deprecated Active Recall now lives inside Teaching class boards. */
	activeRecall: '/my-space/active-recall',
	/** @deprecated Use teachingPublicRecallDeck */
	activeRecallDeck: (slug: string) => `/my-space/active-recall/${slug}` as const,
	mySpaceTests: '/my-space/tests',
	mySpaceTest: (slug: string) => `/my-space/tests/${slug}` as const,
	mySpaceTestPlay: (slug: string) => `/my-space/tests/${slug}/play` as const,
	myClass: '/my-space/my-class',
	myClassCourse: (courseSlug: string) => `/my-space/my-class/${courseSlug}` as const,
	myClassModule: (courseSlug: string, lessonSlug: string, moduleSlug: string) =>
		`/my-space/my-class/${courseSlug}/modules/${lessonSlug}/${moduleSlug}` as const,
	myClassCourseEdit: (courseSlug: string) => `/my-space/my-class/${courseSlug}?edit=1` as const,
	myClassLesson: (courseSlug: string, lessonSlug: string) =>
		`/my-space/my-class/${courseSlug}?lesson=${encodeURIComponent(lessonSlug)}` as const,
	myClassUnit: (courseSlug: string, lessonSlug: string, unitSlug: string, options?: { sectionSlug?: string | null; level?: string | null }) => {
		const path = `/my-space/my-class/${courseSlug}/${lessonSlug}/${unitSlug}`;
		const params = new URLSearchParams();
		if (options?.sectionSlug) params.set('s', options.sectionSlug);
		if (options?.level) params.set('level', options.level);
		const query = params.toString();
		return `${path}${query ? `?${query}` : ''}` as const;
	},
	myClassReview: (courseSlug: string) => `/my-space/my-class/${courseSlug}/review` as const,
	myClassKnowledge: (courseSlug: string, kuSlug: string) =>
		`/my-space/my-class/${courseSlug}/knowledge/${kuSlug}` as const,
	myClassVocabIndex: (courseSlug: string) => `/my-space/my-class/${courseSlug}/vocab` as const,
	myClassVocab: (courseSlug: string, setId: string) =>
		`/my-space/my-class/${courseSlug}/vocab/${setId}` as const,
	myClassTest: (courseSlug: string, testSlug: string) =>
		`/my-space/my-class/${courseSlug}/tests/${testSlug}` as const,
	myClassProgress: '/my-space/my-class/progress',
	/** Self-paced courses: catalog, reader and admin studio. */
	learnCourses: '/my-space/courses',
	learnCourse: (slug: string, sectionId?: string | null) =>
		`/my-space/courses/${slug}${sectionId ? `?s=${encodeURIComponent(sectionId)}` : ''}` as const,
	learnStudio: (slug: string, sectionId?: string | null) =>
		`/my-space/courses/${slug}/studio${sectionId ? `?s=${encodeURIComponent(sectionId)}` : ''}` as const,
	mySpaceTeaching: '/my-space/teaching',
	mySpaceTeachingNew: '/my-space/teaching/new',
	mySpaceTeachingCourseNewClass: (courseId: string) =>
		`/my-space/teaching/new?courseId=${encodeURIComponent(courseId)}` as const,
	mySpaceTeachingImport: '/my-space/teaching/import',
	mySpaceTeachingCourse: (id: string) => `/my-space/teaching/courses/${id}` as const,
	mySpaceTeachingCourseTab: (id: string, tab: string) =>
		`/my-space/teaching/courses/${id}?tab=${tab}` as const,
	mySpaceTeachingRecallNew: (courseId: string) =>
		`/my-space/teaching/courses/${courseId}/recall/new` as const,
	mySpaceTeachingRecallEdit: (courseId: string, deckId: string) =>
		`/my-space/teaching/courses/${courseId}/recall/${deckId}` as const,
	mySpaceTeachingClass: (id: string) => `/my-space/teaching/${id}` as const,
	mySpaceTeachingClassTab: (id: string, tab: string, week?: number, tutorial?: string) => {
		const params = new URLSearchParams({ tab });
		if (week) params.set('week', String(week));
		if (tutorial) params.set('tutorial', tutorial);
		return `/my-space/teaching/${id}?${params.toString()}` as const;
	},
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
	teachingPublicClass: (slug: string) => `/lop/${slug}` as const,
	teachingPublicClassTab: (
		slug: string,
		tab: 'attendance' | 'cp' | 'groups' | 'learning' | 'notes' | 'recall',
		tutorial?: string,
	) => {
		const params = new URLSearchParams({ tab });
		if (tutorial) params.set('tutorial', tutorial);
		return `/lop/${slug}?${params.toString()}` as const;
	},
	teachingPublicRecallDeck: (classSlug: string, deckSlug: string) =>
		`/lop/${classSlug}/active-recall/${deckSlug}` as const,
	teachingPublicAttendance: (slug: string) => `/lop/${slug}` as const,
	vocabStore: '/vocabulary/store',

	/** @deprecated Prefer aboutTeaching; kept for temporary redirects. */
	teaching: '/giang-day',

	// ─── Admin ────────────────────────────────────────────────────────────────
		admin: {
		home: '/admin',
		website: '/admin/website',
		archive: '/admin/archive',
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
		activeRecall: '/admin/tools/active-recall',
		activeRecallNew: '/admin/tools/active-recall/new',
		activeRecallEdit: (id: string) => `/admin/tools/active-recall/${id}` as const,
		messages: '/admin/tools/messages',
		messagesNew: '/admin/tools/messages/create',
		messageEdit: (slug: string) => `/admin/tools/messages/${slug}` as const,
		myspaceTests: '/admin/myspace-tests',
		learnAnalytics: '/admin/learn-analytics',
		myspaceTestNew: '/admin/myspace-tests/new',
		myspaceTestEdit: (id: string) => `/admin/myspace-tests/${id}` as const,
		myspaceTestAnalytics: '/admin/myspace-tests/analytics',
		myspaceQuestions: '/admin/myspace-tests/questions',
		myspaceQuestionsImport: '/admin/myspace-tests/import',
		myspaceSubjects: '/admin/myspace-tests/subjects',
		myClass: '/admin/my-class',
		myClassCourses: '/admin/my-class/courses',
		myClassCourseNew: '/admin/my-class/courses/new',
		myClassCourse: (id: string) => `/admin/my-class/courses/${id}` as const,
		myClassCourseOverview: (id: string) => `/admin/my-class/courses/${id}/overview` as const,
		myClassCourseContent: (id: string) => `/admin/my-class/courses/${id}/content` as const,
		myClassCourseVocabulary: (id: string) => `/admin/my-class/courses/${id}/vocabulary` as const,
		myClassCoursePractice: (id: string) => `/admin/my-class/courses/${id}/practice` as const,
		myClassCourseStudents: (id: string) => `/admin/my-class/courses/${id}/students` as const,
		myClassCourseResults: (id: string) => `/admin/my-class/courses/${id}/results` as const,
		myClassCourseSettings: (id: string) => `/admin/my-class/courses/${id}/settings` as const,
		myClassKnowledge: '/admin/my-class/knowledge',
		myClassKnowledgeNew: '/admin/my-class/knowledge/new',
		myClassKnowledgeEdit: (id: string) => `/admin/my-class/knowledge/${id}` as const,
		myClassTests: '/admin/my-class/tests',
		myClassTestNew: '/admin/my-class/tests/new',
		myClassTestEdit: (id: string) => `/admin/my-class/tests/${id}` as const,
		myClassVocabulary: '/admin/my-class/vocabulary',
		myClassVocabularyNew: '/admin/my-class/vocabulary/new',
		myClassVocabularyEdit: (id: string) => `/admin/my-class/vocabulary/${id}` as const,
		myClassBank: '/admin/my-class/bank',
		myClassQuestions: '/admin/my-class/questions',
		myClassQuestionNew: '/admin/my-class/questions/new',
		myClassQuestionEdit: (id: string) => `/admin/my-class/questions/${id}` as const,
		myClassCohorts: '/admin/my-class/cohorts',
		myClassCohortNew: '/admin/my-class/cohorts/new',
		myClassCohortEdit: (id: string) => `/admin/my-class/cohorts/${id}` as const,
		myClassImport: '/admin/my-class/import',
		myClassPerformance: '/admin/my-class/performance',
		/** @deprecated Use routes.mySpaceTeaching */
		teaching: '/admin/teaching',
		/** @deprecated Use routes.mySpaceTeachingNew */
		teachingNew: '/admin/teaching/new',
		/** @deprecated Use routes.mySpaceTeachingImport */
		teachingImport: '/admin/teaching/import',
		/** @deprecated Use routes.mySpaceTeachingClass */
		teachingClass: (id: string) => `/admin/teaching/${id}` as const,
		/** @deprecated Use routes.mySpaceTeachingClassTab */
		teachingClassTab: (id: string, tab: string, week?: number) =>
			week
				? (`/admin/teaching/${id}?tab=${tab}&week=${week}` as const)
				: (`/admin/teaching/${id}?tab=${tab}` as const),
		/** @deprecated Use routes.mySpaceTeachingClassTab(id, 'attendance') */
		teachingGradebook: (id: string) => `/admin/teaching/${id}/gradebook` as const,
		/** @deprecated Use routes.mySpaceTeachingClassTab(id, 'students') */
		teachingRoster: (id: string) => `/admin/teaching/${id}/roster` as const,
		/** @deprecated Use routes.mySpaceTeachingClassTab(id, 'setup') */
		teachingSessions: (id: string) => `/admin/teaching/${id}/sessions` as const,
		/** @deprecated Use routes.mySpaceTeachingClassTab(id, 'setup') */
		teachingSettings: (id: string) => `/admin/teaching/${id}/settings` as const,
		/** @deprecated Use routes.mySpaceTeachingClassTab(id, 'setup') */
		teachingPublic: (id: string) => `/admin/teaching/${id}/public` as const,
		/** @deprecated Use routes.mySpaceTeachingClassTab(id, 'share') */
		teachingAttendanceBoard: (id: string) => `/admin/teaching/${id}/attendance-board` as const,
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

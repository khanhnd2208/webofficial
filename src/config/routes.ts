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
	/** Table of contents — two doors, Về tôi and Học tập. */
	toc: '/muc-luc',
	/** Parent of the Teaching and course workspaces; the bare path redirects to Mục lục. */
	mySpace: '/my-space',
	publicCourseRecallRoot: '/active-recall',
	publicCourseRecall: (courseId: string) =>
		`/active-recall/${encodeURIComponent(courseId)}` as const,
	publicCourseRecallDeck: (courseId: string, deckSlug: string) =>
		`/active-recall/${encodeURIComponent(courseId)}/${encodeURIComponent(deckSlug)}` as const,
	/** Legacy public index. Share course-scoped links from Teaching. */
	activeRecall: '/my-space/active-recall',
	/** Legacy standalone deck address. */
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
	myClassUnit: (
		courseSlug: string,
		lessonSlug: string,
		unitSlug: string,
		options?: { sectionSlug?: string | null; level?: string | null },
	) => {
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
	/**
	 * Self-paced courses. `/khoa-hoc` is the one course address: the catalog for guests and, signed
	 * in, the same page with progress. `/khoa-hoc/*` readers are served by the `/my-space/courses/*`
	 * pages (see LEARN_COURSE_ALIASES), so shared links keep working.
	 */
	learnCourses: '/khoa-hoc',
	/** The signed-in course list; the same page as learnCourses. */
	myCourses: '/khoa-hoc',
	/** The admin's course management view of the course list. */
	myCoursesManage: '/khoa-hoc?xem=quan-ly',
	/** Học tập, tab Lớp học: class pages opened on this device (and, for admins, active classes). */
	classes: '/lop',
	learnCourse: (slug: string, sectionId?: string | null) =>
		`/khoa-hoc/${slug}${sectionId ? `?s=${encodeURIComponent(sectionId)}` : ''}` as const,
	learnStudio: (slug: string, sectionId?: string | null) =>
		`/khoa-hoc/${slug}/studio${sectionId ? `?s=${encodeURIComponent(sectionId)}` : ''}` as const,
	mySpaceTeaching: '/my-space/teaching',
	mySpaceTeachingRecallAnalytics: '/my-space/teaching/recall-analytics',
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
	/** Kiểm tra bài cũ for a whole course; a class id ticks that class first. */
	mySpaceTeachingArena: (courseId: string, classId?: string) =>
		classId
			? (`/my-space/teaching/courses/${courseId}/arena?class=${encodeURIComponent(classId)}` as const)
			: (`/my-space/teaching/courses/${courseId}/arena` as const),
	mySpaceTeachingClassTab: (id: string, tab: string, week?: number, tutorial?: string) => {
		const params = new URLSearchParams({ tab });
		if (week) params.set('week', String(week));
		if (tutorial) params.set('tutorial', tutorial);
		return `/my-space/teaching/${id}?${params.toString()}` as const;
	},
	contact: '/lien-he',
	/** UNRELEASED workshop: pre-workshop quiz and registration. */
	unreleased: '/unreleased',
	/** UNRELEASED workshop: anonymous post-workshop feedback and gift. */
	unreleasedGift: '/unreleasedgift',
	unreleasedGiftThanks: '/unreleasedgift/thank-you',
	/** FMT 2026 booth: PIN-gated prize draw on the event laptop. */
	fmt2026: '/fmt2026',
	notes: '/ghi-chep',
	note: (slug: string) => `/ghi-chep/${slug}` as const,

	// ─── Journal / Writing (legacy /bai-viet redirects to /ghi-chep) ───────────
	posts: '/bai-viet',

	// ─── Policies (utility, not primary nav) ──────────────────────────────────
	policyPrivacy: '/chinh-sach/bao-mat',
	policyTerms: '/chinh-sach/dieu-khoan',
	policyCancellation: '/chinh-sach/huy-doi-lich',
	policyAi: '/chinh-sach/ai',

	// ─── Auth & account ───────────────────────────────────────────────────────
	login: '/dang-nhap',
	account: '/tai-khoan',
	messagePublic: (slug: string) => `/m/${slug}` as const,

	// ─── Learning (learner surfaces; not marketing chrome) ────────────────────
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
	vocabStore: '/vocabulary/store',

	// ─── Admin ────────────────────────────────────────────────────────────────
	admin: {
		home: '/admin',
		archive: '/admin/archive',
		posts: '/admin/posts',
		postCreate: '/admin/posts/create',
		postEdit: (id: string) => `/admin/posts/${id}/edit` as const,
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
		unreleasedQuiz: '/admin/unreleased-quiz',
		unreleasedQuizExport: '/api/admin/unreleased-quiz/export',
		unreleasedGift: '/admin/unreleased-gift',
		unreleasedGiftExport: '/api/admin/unreleased-gift/export',
		fmt2026: '/admin/fmt2026',
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
		/** Old Teaching hub; next.config redirects it to routes.mySpaceTeaching. */
		teaching: '/admin/teaching',
		users: '/admin/users',
		media: '/admin/media',
		settings: '/admin/settings',
	},
} as const;

/**
 * Course reader aliases keep existing student links working. `/khoa-hoc/<slug>` is rewritten to the
 * `/my-space/courses/...` route files, and the old `/my-space/courses/...` links keep working
 * untouched, so links already handed to students never break.
 */
export const LEARN_COURSE_ALIASES: ReadonlyArray<{ source: string; destination: string }> = [
	{ source: '/khoa-hoc/:path*', destination: '/my-space/courses/:path*' },
];

/**
 * Permanent redirect map for retired marketing URLs.
 * Legacy hubs point directly to their replacement sections; hubs with no replacement land on
 * Mục lục (the site map), not the intro cover, so an old link never strands a visitor.
 * Lab/course detail URLs stay reachable (noindex) via /archive; only hubs redirect.
 */
export const PUBLIC_REDIRECTS: ReadonlyArray<{
	source: string;
	destination: string;
	permanent: boolean;
}> = [
	// The introduction, stories, projects and services pages are retired; Về tôi replaces them all.
	{ source: '/gioi-thieu', destination: routes.contact, permanent: true },
	{ source: '/trai-nghiem', destination: routes.contact, permanent: true },
	{ source: '/trai-nghiem/:path*', destination: routes.contact, permanent: true },
	{ source: '/du-an', destination: routes.contact, permanent: true },
	{ source: '/du-an/:path*', destination: routes.contact, permanent: true },
	{ source: '/dich-vu', destination: routes.contact, permanent: true },
	{ source: '/dong-hanh', destination: routes.contact, permanent: true },
	{ source: '/dong-hanh/:path*', destination: routes.contact, permanent: true },
	{ source: '/case-study', destination: routes.contact, permanent: true },
	{ source: '/case-study/:path*', destination: routes.contact, permanent: true },
	{ source: '/giang-day', destination: routes.contact, permanent: true },
	{ source: '/goc-cua-khanh', destination: routes.contact, permanent: true },
	{ source: '/goc-cua-khanh/:path*', destination: routes.contact, permanent: true },
	{ source: '/bai-viet', destination: routes.toc, permanent: true },
	{ source: '/bai-viet/:path*', destination: routes.toc, permanent: true },
	{ source: '/phat-trien-ban-than', destination: routes.toc, permanent: true },
	{ source: '/phat-trien-ban-than/:path*', destination: routes.toc, permanent: true },
	{ source: '/archive', destination: routes.toc, permanent: true },
	{ source: '/hoc', destination: routes.toc, permanent: true },
	{ source: '/hoc/chuong-trinh', destination: routes.toc, permanent: true },
	// The retired Chương–Bài course system: its readers now use the self-paced courses.
	{ source: '/hoc/khoa-hoc', destination: routes.learnCourses, permanent: true },
	{ source: '/hoc/khoa-hoc/:path*', destination: routes.learnCourses, permanent: true },
	{ source: '/tai-khoan/hoc', destination: routes.learnCourses, permanent: true },
	{ source: '/admin/courses/:path*', destination: routes.learnCourses, permanent: true },
	{ source: '/admin/enrollments', destination: routes.learnCourses, permanent: true },
	// The catalog's former address, from before /khoa-hoc became the real page.
	{ source: '/kham-pha-khoa-hoc', destination: routes.learnCourses, permanent: true },
	// The signed-in course list moved to /khoa-hoc. Redirect here, before the sign-in layout, so a
	// signed-out visitor with an old link reaches the public page instead of the login form.
	// `?xem=quan-ly` carries over.
	{ source: '/my-space/courses', destination: routes.learnCourses, permanent: false },
];

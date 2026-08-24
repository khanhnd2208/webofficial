import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { disconnectTestPrisma, getTestPrisma } from '@/test/helpers/db.postgres';
import {
	attachKnowledgeUnit,
	commitCurriculumImport,
	commitQuestionsImport,
	commitRoster,
	createAdminCourse,
	createCohort,
	createKnowledgeUnit,
	createLesson,
	createQuestion,
	createSection,
	createTest,
	createTestPlacement,
	listTestPlacements,
	validateAdminTestPublish,
	getCourse,
	getAssignedVocabSet,
	searchVocabSets,
	listAdminTests,
	getAdminCourse,
	getKnowledgeUnit,
	getAuthoringCourse,
	getAuthoringKnowledgeUnit,
	getTest,
	markKnowledgeViewed,
	completeKnowledgeUnit,
	claimGuestProgress,
	assignVocabSet,
	createAndAssignVocabSet,
	unassignVocabSet,
	addAssignedVocabToLibrary,
	importVocabSetForScope,
	reorderCourseNodes,
	previewCurriculumImport,
	previewQuestionsImport,
	publishRevision,
	publishTest,
	reconcilePendingMemberships,
	saveDraftRevision,
	setTestQuestions,
	submitTest,
	archiveQuestion,
	archiveKnowledgeUnit,
	archiveCohort,
	getProgress,
	updateCourseNodeStatus,
	updateAdminCourse,
	type SubmitTestInput,
} from '@/features/my-class';
import { guestActorKey } from '@/features/my-class/domain/actor';

function allA(play: { questions: Array<{ id: string }> }): SubmitTestInput['answers'] {
	return Object.fromEntries(
		play.questions.map((question) => [question.id, 'A']),
	) as SubmitTestInput['answers'];
}

function mcq(input: {
	slug: string;
	stem: string;
	options: Array<{ key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; text: string }>;
	correctKey: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
	difficulty: number;
	knowledgeUnitIds: string[];
}) {
	return {
		slug: input.slug,
		stem: input.stem,
		type: 'MCQ_SINGLE' as const,
		options: input.options,
		answer: { type: 'MCQ_SINGLE' as const, correctKey: input.correctKey },
		difficulty: input.difficulty,
		knowledgeUnitIds: input.knowledgeUnitIds,
	};
}

const db = getTestPrisma();
const PREFIX = 'mc-int-';

async function cleanup() {
	await db.myClassVocabAssignment.deleteMany({
		where: { course: { slug: { startsWith: PREFIX } } },
	});
	await db.userVocabSet.deleteMany({
		where: { vocabSet: { title: { startsWith: PREFIX } } },
	});
	await db.vocabSet.deleteMany({ where: { title: { startsWith: PREFIX } } });
	await db.myClassAttemptAnswer.deleteMany({
		where: { attempt: { test: { slug: { startsWith: PREFIX } } } },
	});
	await db.myClassAttemptKuEvidence.deleteMany({
		where: { attempt: { test: { slug: { startsWith: PREFIX } } } },
	});
	await db.myClassTestAttempt.deleteMany({ where: { test: { slug: { startsWith: PREFIX } } } });
	await db.myClassKuProgress.deleteMany({ where: { course: { slug: { startsWith: PREFIX } } } });
	await db.myClassTestQuestion.deleteMany({ where: { test: { slug: { startsWith: PREFIX } } } });
	await db.myClassTestPlacement.deleteMany({ where: { test: { slug: { startsWith: PREFIX } } } });
	await db.myClassTest.deleteMany({ where: { slug: { startsWith: PREFIX } } });
	await db.myClassMembership.deleteMany({ where: { course: { slug: { startsWith: PREFIX } } } });
	await db.myClassCohort.deleteMany({ where: { course: { slug: { startsWith: PREFIX } } } });
	await db.myClassQuestionKnowledgeUnit.deleteMany({
		where: { question: { slug: { startsWith: PREFIX } } },
	});
	await db.myClassQuestion.deleteMany({ where: { slug: { startsWith: PREFIX } } });
	await db.knowledgeUnitRelation.deleteMany({
		where: {
			OR: [{ from: { slug: { startsWith: PREFIX } } }, { to: { slug: { startsWith: PREFIX } } }],
		},
	});
	await db.myClassSectionKnowledgeUnit.deleteMany({
		where: { knowledgeUnit: { slug: { startsWith: PREFIX } } },
	});
	await db.knowledgeUnit.updateMany({
		where: { slug: { startsWith: PREFIX } },
		data: { currentPublishedRevisionId: null },
	});
	await db.knowledgeUnitRevision.deleteMany({
		where: { knowledgeUnit: { slug: { startsWith: PREFIX } } },
	});
	await db.knowledgeUnit.deleteMany({ where: { slug: { startsWith: PREFIX } } });
	await db.myClassSection.deleteMany({
		where: { lesson: { course: { slug: { startsWith: PREFIX } } } },
	});
	await db.myClassLesson.deleteMany({ where: { course: { slug: { startsWith: PREFIX } } } });
	await db.myClassCourse.deleteMany({ where: { slug: { startsWith: PREFIX } } });
}

async function publishedGraph() {
	const course = await createAdminCourse({ title: 'HRM Int', slug: `${PREFIX}hrm` });
	const lesson = await createLesson(course.id, { title: 'Selection', slug: `${PREFIX}selection` });
	const sectionA = await createSection(lesson.id, { title: 'Quality' });
	const sectionB = await createSection(lesson.id, { title: 'Methods' });
	const ku = await createKnowledgeUnit({
		slug: `${PREFIX}reliability`,
		title: 'Reliability',
		foundationHtml: '<p>Foundation</p>',
		academicHtml: '<p>Academic</p>',
		expertHtml: '<p>Expert</p>',
	});
	await attachKnowledgeUnit(sectionA.id, ku.id);
	await attachKnowledgeUnit(sectionB.id, ku.id);
	await publishRevision(ku.id);
	await db.myClassLesson.update({ where: { id: lesson.id }, data: { status: 'PUBLISHED' } });
	await db.myClassSection.update({ where: { id: sectionA.id }, data: { status: 'PUBLISHED' } });
	await db.myClassSection.update({ where: { id: sectionB.id }, data: { status: 'PUBLISHED' } });
	await db.myClassCourse.update({
		where: { id: course.id },
		data: { status: 'PUBLISHED', publishedAt: new Date() },
	});
	const question = await createQuestion(
		mcq({
			slug: `${PREFIX}q1`,
			stem: 'Reliability means?',
			options: [
				{ key: 'A', text: 'Consistency' },
				{ key: 'B', text: 'Bias' },
			],
			correctKey: 'A',
			difficulty: 2,
			knowledgeUnitIds: [ku.id],
		}),
	);
	const multi = await createQuestion(
		mcq({
			slug: `${PREFIX}q2`,
			stem: 'Two KU question',
			options: [
				{ key: 'A', text: 'Yes' },
				{ key: 'B', text: 'No' },
			],
			correctKey: 'A',
			difficulty: 3,
			knowledgeUnitIds: [ku.id],
		}),
	);
	const test = await createTest({
		title: 'Selection quiz',
		slug: `${PREFIX}quiz`,
	});
	await setTestQuestions(test.id, [question.id, multi.id]);
	await createTestPlacement(test.id, { courseId: course.id, scope: 'COURSE' });
	await db.myClassTest.update({
		where: { id: test.id },
		data: { status: 'PUBLISHED', publishedAt: new Date() },
	});
	return { course, lesson, sectionA, sectionB, ku, question, multi, test };
}

beforeEach(cleanup);
afterAll(async () => {
	await cleanup();
	await disconnectTestPrisma();
});

describe('My Class integrity', () => {
	it('persists course level and tags through create and update', async () => {
		const created = await createAdminCourse({
			title: 'Course metadata',
			slug: `${PREFIX}metadata`,
			level: 'BEGINNER',
			tags: ['Nhân sự', 'Quản trị'],
		});
		expect(created.level).toBe('BEGINNER');
		expect(created.tags).toEqual(['Nhân sự', 'Quản trị']);

		const updated = await updateAdminCourse(created.id, {
			level: 'ADVANCED',
			tags: ['Chiến lược'],
			expectedUpdatedAt: created.updatedAt.toISOString(),
		});
		expect(updated.level).toBe('ADVANCED');
		expect(updated.tags).toEqual(['Chiến lược']);
	});

	it('places a library test on another course without moving the original', async () => {
		const graph = await publishedGraph();
		const second = await createAdminCourse({ title: 'Second', slug: `${PREFIX}second` });
		const placement = await createTestPlacement(graph.test.id, { courseId: second.id, scope: 'COURSE' });
		expect(placement.courseId).toBe(second.id);
		expect((await listTestPlacements(graph.test.id)).length).toBe(2);
	});

	it('aggregates KU evidence across multiple saved attempts', async () => {
		const { course, test } = await publishedGraph();
		const play = await getTest(course.slug, test.slug);
		await submitTest(course.slug, test.slug, { answers: allA(play) }, 'progress-user');
		await submitTest(course.slug, test.slug, { answers: allA(play) }, 'progress-user');
		const dashboard = await getProgress('progress-user');
		const row = dashboard.tests[0]?.kuAccuracy[0];
		expect(row?.attempts).toBe(2);
		expect(row?.questions).toBe(4);
	});

	it('archives a cohort and releases its active membership key', async () => {
		const { course } = await publishedGraph();
		const cohort = await createCohort({ courseId: course.id, name: 'Archive me' });
		await commitRoster(cohort.id, [{ email: 'archive@example.com' }]);
		await reconcilePendingMemberships('archive-user', 'archive@example.com');
		await archiveCohort(cohort.id);
		const membership = await db.myClassMembership.findFirst({ where: { cohortId: cohort.id } });
		expect(membership?.status).toBe('REMOVED');
		expect(membership?.activeCourseUserKey).toBeNull();
	});
	it('reuses one KU identity across two sections', async () => {
		const { ku, course } = await publishedGraph();
		const mappings = await db.myClassSectionKnowledgeUnit.findMany({
			where: { knowledgeUnitId: ku.id },
		});
		expect(mappings).toHaveLength(2);
		const publicCourse = await getCourse(course.slug);
		const slugs = publicCourse.lessons.flatMap((lesson) =>
			lesson.sections.flatMap((section) => section.knowledgeUnits.map((unit) => unit.slug)),
		);
		expect(slugs.filter((slug) => slug === ku.slug)).toHaveLength(2);
	});

	it('does not show draft revision content publicly after a later draft save', async () => {
		const { ku, course } = await publishedGraph();
		await saveDraftRevision(ku.id, {
			title: 'Draft only',
			foundationHtml: '<p>Secret draft</p>',
			academicHtml: '',
			expertHtml: '',
		});
		const publicCourse = await getCourse(course.slug);
		const outline = publicCourse.lessons[0]?.sections[0]?.knowledgeUnits[0];
		expect(outline?.title).toBe('Reliability');
		expect(outline).not.toHaveProperty('foundationHtml');
		const detail = await getKnowledgeUnit(course.slug, ku.slug);
		expect(detail.unit.foundationHtml).toContain('Foundation');
		expect(detail.unit.foundationHtml).not.toContain('Secret draft');
		const authoring = await getAuthoringCourse(course.slug, 'admin');
		expect(authoring.lessons[0]?.sections[0]?.knowledgeUnits[0]?.title).toBe('Draft only');
		const authoringUnit = await getAuthoringKnowledgeUnit(course.slug, ku.slug, 'admin');
		expect(authoringUnit.unit.foundationHtml).toContain('Secret draft');
		await expect(getAuthoringCourse(course.slug, 'student')).rejects.toThrow(/Forbidden/);
	});

	it('keeps unpublished lessons visible on the authoring tree only', async () => {
		const { course, lesson } = await publishedGraph();
		await createLesson(course.id, { title: 'Draft lesson', slug: `${PREFIX}draft-lesson` });
		const publicCourse = await getCourse(course.slug);
		expect(publicCourse.lessons.map((item) => item.slug)).toEqual([lesson.slug]);
		const authoring = await getAuthoringCourse(course.slug, 'admin');
		expect(authoring.lessons.map((item) => item.slug)).toEqual(
			expect.arrayContaining([lesson.slug, `${PREFIX}draft-lesson`]),
		);
		const leaked = JSON.stringify(await getCourse(course.slug));
		expect(leaked).not.toContain(`${PREFIX}draft-lesson`);
		expect(leaked).not.toContain('Secret draft');
		expect(leaked).not.toContain('"authoring"');
		expect(leaked).not.toMatch(/"status"\s*:\s*"DRAFT"/);
	});

	it('updates the published revision pointer on publish', async () => {
		const { ku } = await publishedGraph();
		await saveDraftRevision(ku.id, {
			title: 'Reliability v2',
			foundationHtml: '<p>Updated</p>',
			academicHtml: '<p>Updated</p>',
			expertHtml: '',
		});
		const published = await publishRevision(ku.id);
		expect(published.currentPublishedRevision?.title).toBe('Reliability v2');
		expect(published.currentPublishedRevisionId).toBe(published.currentPublishedRevision?.id);
	});

	it('omits correctKey from the public test DTO and snapshots answers after question edits', async () => {
		const { course, test, question } = await publishedGraph();
		const play = await getTest(course.slug, test.slug);
		expect(JSON.stringify(play.questions)).not.toContain('correctKey');
		expect(JSON.stringify(play.questions)).not.toContain('explanation');
		const first = await submitTest(course.slug, test.slug, { answers: allA(play) }, 'user-1');
		await db.myClassQuestion.update({
			where: { id: question.id },
			data: { answer: { type: 'MCQ_SINGLE', correctKey: 'B' }, stem: 'Changed stem' },
		});
		const stored = await db.myClassAttemptAnswer.findFirst({
			where: { attemptId: first.attemptId! },
		});
		expect(stored?.correctKey).toBe('A');
		expect(stored?.stemSnapshot).toBe('Reliability means?');
	});

	it('rejects incomplete, extra, and invalid option submissions', async () => {
		const { course, test } = await publishedGraph();
		const play = await getTest(course.slug, test.slug);
		await expect(
			submitTest(course.slug, test.slug, {
				answers: { [play.questions[0]!.id]: 'A' } as SubmitTestInput['answers'],
			}),
		).rejects.toThrow(/toàn bộ/);
		await expect(
			submitTest(course.slug, test.slug, {
				answers: { ...allA(play), extra: 'A' } as SubmitTestInput['answers'],
			}),
		).rejects.toThrow(/không thuộc/);
		await expect(
			submitTest(course.slug, test.slug, {
				answers: { [play.questions[0]!.id]: 'Z', [play.questions[1]!.id]: 'A' } as never,
			}),
		).rejects.toThrow();
	});

	it('persists guest attempts and stores authenticated attempts with 1/n evidence', async () => {
		const { course, test, ku } = await publishedGraph();
		const play = await getTest(course.slug, test.slug);
		const answers = allA(play);
		const guest = await submitTest(course.slug, test.slug, { answers }, { guestId: 'guest-int' });
		expect(guest.attemptId).toBeTruthy();
		expect(guest.saved).toBe(true);
		expect(
			await db.myClassTestAttempt.count({ where: { testId: test.id, guestId: 'guest-int' } }),
		).toBe(1);
		const saved = await submitTest(course.slug, test.slug, { answers }, 'user-2');
		expect(saved.attemptId).toBeTruthy();
		const evidence = await db.myClassAttemptKuEvidence.findMany({
			where: { attemptId: saved.attemptId! },
		});
		expect(evidence).toHaveLength(1);
		expect(evidence[0]?.knowledgeUnitId).toBe(ku.id);
		expect(evidence[0]?.questionCount).toBe(2);
		await submitTest(course.slug, test.slug, { answers }, 'user-2');
		expect(await db.myClassTestAttempt.count({ where: { userId: 'user-2' } })).toBe(2);
	});

	it('blocks further submits after maxAttempts for users and guests', async () => {
		const { course, test } = await publishedGraph();
		await db.myClassTest.update({ where: { id: test.id }, data: { maxAttempts: 1 } });
		const play = await getTest(course.slug, test.slug, { userId: 'user-max' });
		expect(play.maxAttempts).toBe(1);
		expect(play.attemptsUsed).toBe(0);
		await submitTest(course.slug, test.slug, { answers: allA(play) }, 'user-max');
		const after = await getTest(course.slug, test.slug, { userId: 'user-max' });
		expect(after.attemptsUsed).toBe(1);
		await expect(
			submitTest(course.slug, test.slug, { answers: allA(play) }, 'user-max'),
		).rejects.toThrow(/hết lượt/);

		const guestPlay = await getTest(course.slug, test.slug, { guestId: 'guest-max' });
		expect(guestPlay.attemptsUsed).toBe(0);
		await submitTest(course.slug, test.slug, { answers: allA(guestPlay) }, { guestId: 'guest-max' });
		await expect(
			submitTest(course.slug, test.slug, { answers: allA(guestPlay) }, { guestId: 'guest-max' }),
		).rejects.toThrow(/hết lượt/);
	});

	it('omits review when revealPolicy is NEVER', async () => {
		const { course, test } = await publishedGraph();
		await db.myClassTest.update({ where: { id: test.id }, data: { revealPolicy: 'NEVER' } });
		const play = await getTest(course.slug, test.slug);
		const result = await submitTest(course.slug, test.slug, { answers: allA(play) }, 'user-never');
		expect(result.review).toEqual([]);
		expect(result.score).toBeGreaterThanOrEqual(0);
	});

	it('activates one pending membership per course and stamps the cohort at submit time', async () => {
		const { course, test } = await publishedGraph();
		const cohort = await createCohort({ courseId: course.id, name: 'K1', term: '2026' });
		await commitRoster(cohort.id, [{ email: 'Student@Example.com', name: 'An' }]);
		await reconcilePendingMemberships('user-3', 'student@example.com');
		const membership = await db.myClassMembership.findFirst({ where: { userId: 'user-3' } });
		expect(membership?.status).toBe('ACTIVE');
		expect(membership?.activeCourseUserKey).toBe(`${course.id}:user-3`);
		const play = await getTest(course.slug, test.slug);
		const result = await submitTest(course.slug, test.slug, { answers: allA(play) }, 'user-3');
		const attempt = await db.myClassTestAttempt.findUnique({ where: { id: result.attemptId! } });
		expect(attempt?.cohortId).toBe(cohort.id);
		await expect(
			commitRoster(cohort.id, [{ email: 'student@example.com', name: 'An' }]),
		).rejects.toThrow();
	});

	it('does not backfill attempts submitted before activation', async () => {
		const { course, test } = await publishedGraph();
		const play = await getTest(course.slug, test.slug);
		const before = await submitTest(course.slug, test.slug, { answers: allA(play) }, 'user-4');
		const cohort = await createCohort({ courseId: course.id, name: 'K2' });
		await commitRoster(cohort.id, [{ email: 'late@example.com' }]);
		await reconcilePendingMemberships('user-4', 'late@example.com');
		const attempt = await db.myClassTestAttempt.findUnique({ where: { id: before.attemptId! } });
		expect(attempt?.cohortId).toBeNull();
	});

	it('rolls back a curriculum import when the course slug already exists', async () => {
		await publishedGraph();
		const payload = {
			course: { title: 'X', slug: `${PREFIX}hrm` },
			lessons: [{ slug: 'l', title: 'L', position: 0, sections: [] }],
		};
		const preview = await previewCurriculumImport(payload);
		expect(preview.courseExists).toBe(true);
		await expect(commitCurriculumImport(payload)).rejects.toThrow(/đã tồn tại/);
	});

	it('rejects progress for a KU that does not belong to the course', async () => {
		const { course } = await publishedGraph();
		await expect(
			markKnowledgeViewed('user-5', 'missing-ku', { courseId: course.id }),
		).rejects.toThrow(/không thuộc/);
	});

	it('warns when publishing a test whose questions map KU outside the course', async () => {
		const { course } = await publishedGraph();
		const outsider = await createKnowledgeUnit({
			slug: `${PREFIX}outsider`,
			title: 'Outsider',
			foundationHtml: '<p>x</p>',
		});
		await publishRevision(outsider.id);
		const question = await createQuestion(
			mcq({
				slug: `${PREFIX}out-q`,
				stem: 'Out?',
				options: [
					{ key: 'A', text: 'Yes' },
					{ key: 'B', text: 'No' },
				],
				correctKey: 'A',
				difficulty: 1,
				knowledgeUnitIds: [outsider.id],
			}),
		);
		const test = await createTest({
			title: 'Bad test',
			slug: `${PREFIX}bad`,
		});
		await setTestQuestions(test.id, [question.id]);
		await createTestPlacement(test.id, { courseId: course.id, scope: 'COURSE' });
		const issues = await validateAdminTestPublish(test.id);
		expect(issues.some((issue) => issue.code === 'TEST_KU_OUT_OF_COURSE')).toBe(true);
		await expect(publishTest(test.id)).resolves.toMatchObject({ status: 'PUBLISHED' });
	});

	it('splits evidence 1/n when a question maps two knowledge units', async () => {
		const graph = await publishedGraph();
		const second = await createKnowledgeUnit({
			slug: `${PREFIX}validity`,
			title: 'Validity',
			foundationHtml: '<p>Validity</p>',
		});
		await attachKnowledgeUnit(graph.sectionA.id, second.id);
		await publishRevision(second.id);
		const question = await createQuestion(
			mcq({
				slug: `${PREFIX}q-multi`,
				stem: 'Both?',
				options: [
					{ key: 'A', text: 'Yes' },
					{ key: 'B', text: 'No' },
				],
				correctKey: 'A',
				difficulty: 2,
				knowledgeUnitIds: [graph.ku.id, second.id],
			}),
		);
		const test = await createTest({
			title: 'Multi KU',
			slug: `${PREFIX}multi`,
		});
		await setTestQuestions(test.id, [question.id]);
		await createTestPlacement(test.id, { courseId: graph.course.id, scope: 'COURSE' });
		await db.myClassTest.update({
			where: { id: test.id },
			data: { status: 'PUBLISHED', publishedAt: new Date() },
		});
		const play = await getTest(graph.course.slug, test.slug);
		const result = await submitTest(
			graph.course.slug,
			test.slug,
			{ answers: allA(play) },
			'user-multi',
		);
		const evidence = await db.myClassAttemptKuEvidence.findMany({
			where: { attemptId: result.attemptId! },
		});
		expect(evidence).toHaveLength(2);
		expect(evidence.every((row) => row.questionCount === 0.5 && row.correctCount === 0.5)).toBe(
			true,
		);
	});

	it('reuses an existing KU identity during curriculum import without overwriting content', async () => {
		const { ku } = await publishedGraph();
		const payload = {
			course: { title: 'Reuse course', slug: `${PREFIX}reuse` },
			lessons: [
				{
					slug: 'l1',
					title: 'L1',
					position: 0,
					sections: [
						{
							title: 'S1',
							position: 0,
							knowledgeUnits: [
								{
									slug: ku.slug,
									title: 'Should not overwrite',
									position: 0,
									foundationHtml: '<p>overwrite?</p>',
								},
							],
						},
					],
				},
			],
		};
		const preview = await previewCurriculumImport(payload);
		expect(preview.knowledgeUnits[0]?.action).toBe('reuse-database');
		await commitCurriculumImport(payload);
		const reused = await db.knowledgeUnit.findUnique({
			where: { id: ku.id },
			include: { revisions: true },
		});
		expect(reused?.revisions.some((revision) => revision.title === 'Should not overwrite')).toBe(
			false,
		);
		expect(await db.myClassSectionKnowledgeUnit.count({ where: { knowledgeUnitId: ku.id } })).toBe(
			3,
		);
	});

	it('omits archived questions from the public test and keeps attempt snapshots', async () => {
		const { course, test, question } = await publishedGraph();
		const play = await getTest(course.slug, test.slug);
		const saved = await submitTest(course.slug, test.slug, { answers: allA(play) }, 'user-archive');
		await archiveQuestion(question.id);
		await expect(getTest(course.slug, test.slug)).rejects.toThrow(/Không tìm thấy Test/);
		expect((await db.myClassTest.findUnique({ where: { id: test.id } }))?.status).toBe('DRAFT');
		expect(await db.myClassAttemptAnswer.count({ where: { attemptId: saved.attemptId! } })).toBe(2);
		expect((await db.myClassQuestion.findUnique({ where: { id: question.id } }))?.status).toBe(
			'ARCHIVED',
		);
	});

	it('rolls back question CSV import when a later row fails inside the transaction', async () => {
		const { test, ku } = await publishedGraph();
		const extra = await createKnowledgeUnit({
			slug: `${PREFIX}csv-ku`,
			title: 'CSV KU',
			foundationHtml: '<p>x</p>',
		});
		const csv = [
			'test_slug,question_slug,stem,option_a,option_b,option_c,option_d,option_e,option_f,correct_option,explanation,difficulty,level,ku_slugs',
			`${test.slug},${PREFIX}csv-q1,Stem 1,Yes,No,,,,,A,,2,FOUNDATION,${ku.slug}`,
			`${test.slug},${PREFIX}csv-q2,Stem 2,Yes,No,,,,,A,,2,FOUNDATION,${extra.slug}`,
		].join('\n');
		const preview = await previewQuestionsImport(csv);
		expect(preview.every((row) => row.ok)).toBe(false);
		await expect(commitQuestionsImport(csv)).rejects.toThrow();
		expect(await db.myClassQuestion.count({ where: { slug: `${PREFIX}csv-q1` } })).toBe(0);
	});

	it('completes a KU idempotently for guests and updates learner state', async () => {
		const { course, ku } = await publishedGraph();
		const actor = {
			type: 'guest' as const,
			guestId: 'g-complete',
			actorKey: guestActorKey('g-complete'),
		};
		const first = await completeKnowledgeUnit({ actor, courseSlug: course.slug, kuSlug: ku.slug });
		expect(first.learnerState.completedItems).toBe(1);
		expect(first.learnerState.totalItems).toBe(1);
		expect(first.learnerState.percent).toBe(100);
		expect(first.progress.alreadyCompleted).toBe(false);
		const second = await completeKnowledgeUnit({ actor, courseSlug: course.slug, kuSlug: ku.slug });
		expect(second.progress.alreadyCompleted).toBe(true);
		expect(second.learnerState.completedItems).toBe(1);
	});

	it('rejects fake lesson or section context on the content endpoint', async () => {
		const { course, ku } = await publishedGraph();
		await expect(
			getKnowledgeUnit(course.slug, ku.slug, { lessonSlug: 'missing-lesson' }),
		).rejects.toThrow();
		await expect(
			getKnowledgeUnit(course.slug, ku.slug, { sectionId: 'missing-section' }),
		).rejects.toThrow();
	});

	it('claims guest progress and attempts in place without duplicating', async () => {
		const { course, test, ku } = await publishedGraph();
		const actor = {
			type: 'guest' as const,
			guestId: 'g-claim',
			actorKey: guestActorKey('g-claim'),
		};
		await completeKnowledgeUnit({ actor, courseSlug: course.slug, kuSlug: ku.slug });
		const play = await getTest(course.slug, test.slug);
		await submitTest(course.slug, test.slug, { answers: allA(play) }, { guestId: 'g-claim' });
		const first = await claimGuestProgress('user-claim', 'g-claim');
		const second = await claimGuestProgress('user-claim', 'g-claim');
		expect(first.attempts).toBe(1);
		expect(second.attempts).toBe(0);
		expect(
			await db.myClassTestAttempt.count({ where: { userId: 'user-claim', guestId: null } }),
		).toBe(1);
		expect(await db.myClassTestAttempt.count({ where: { guestId: 'g-claim' } })).toBe(0);
		expect(
			await db.myClassKuProgress.count({
				where: { actorKey: 'user:user-claim', completedAt: { not: null } },
			}),
		).toBe(1);
		expect(await db.myClassKuProgress.count({ where: { guestId: 'g-claim' } })).toBe(0);
	});

	it('validates vocab assignment scope and uniqueness', async () => {
		const { course, lesson } = await publishedGraph();
		const other = await createAdminCourse({ title: 'Other', slug: `${PREFIX}other-vocab` });
		const otherLesson = await createLesson(other.id, { title: 'X', slug: `${PREFIX}other-l` });
		const set = await db.vocabSet.create({
			data: { title: `${PREFIX}set`, ownerId: 'admin', ownerName: 'Admin' },
		});
		await expect(
			assignVocabSet(course.id, { vocabSetId: set.id, lessonId: otherLesson.id }),
		).rejects.toThrow(/không thuộc/i);
		await assignVocabSet(course.id, { vocabSetId: set.id, lessonId: lesson.id });
		await expect(
			assignVocabSet(course.id, { vocabSetId: set.id, lessonId: lesson.id }),
		).rejects.toThrow();
	});

	it('creates a course-only set and assignment atomically', async () => {
		const { course, lesson } = await publishedGraph();
		const result = await createAndAssignVocabSet(
			{ id: 'admin', name: 'Admin' },
			{
				title: `${PREFIX}created-set`,
				words: [{ term: 'scope', meaningVi: 'phạm vi' }],
				courseId: course.id,
				lessonId: lesson.id,
			},
		);
		expect(result.set?.title).toBe(`${PREFIX}created-set`);
		expect(result.set?.isCourseOnly).toBe(true);
		expect(result.assignment?.lessonId).toBe(lesson.id);
	});

	it('rejects attaching an archived set', async () => {
		const { course, lesson } = await publishedGraph();
		const set = await db.vocabSet.create({
			data: { title: `${PREFIX}archived`, ownerId: 'admin', ownerName: 'Admin', isArchived: true },
		});
		await expect(
			assignVocabSet(course.id, { vocabSetId: set.id, lessonId: lesson.id }),
		).rejects.toThrow(/lưu trữ/i);
	});

	it('archives an unused course-only set after unassign', async () => {
		const { course, lesson } = await publishedGraph();
		const created = await createAndAssignVocabSet(
			{ id: 'admin', name: 'Admin' },
			{
				title: `${PREFIX}orphan-set`,
				words: [{ term: 'risk', meaningVi: 'rủi ro' }],
				courseId: course.id,
				lessonId: lesson.id,
			},
		);
		await unassignVocabSet(course.id, created.assignment!.id);
		const set = await db.vocabSet.findUnique({ where: { id: created.set!.id } });
		expect(set?.isArchived).toBe(true);
	});

	it('keeps a course-only set when a learner has linked it', async () => {
		const { course, lesson } = await publishedGraph();
		const created = await createAndAssignVocabSet(
			{ id: 'admin', name: 'Admin' },
			{
				title: `${PREFIX}linked-set`,
				words: [{ term: 'stakeholder', meaningVi: 'bên liên quan' }],
				courseId: course.id,
				lessonId: lesson.id,
			},
		);
		await addAssignedVocabToLibrary('user-vocab', course.slug, created.set!.id);
		await unassignVocabSet(course.id, created.assignment!.id);
		const set = await db.vocabSet.findUnique({ where: { id: created.set!.id } });
		expect(set?.isArchived).toBe(false);
		const link = await db.userVocabSet.findUnique({
			where: { userId_vocabSetId: { userId: 'user-vocab', vocabSetId: created.set!.id } },
		});
		expect(link?.source).toBe('MY_CLASS');
		expect(link?.sourceCourseId).toBe(course.id);
	});

	it('blocks replacing a set that is not assigned to the course', async () => {
		const { course } = await publishedGraph();
		const foreign = await db.vocabSet.create({
			data: { title: `${PREFIX}foreign`, ownerId: 'admin', ownerName: 'Admin' },
		});
		await expect(
			importVocabSetForScope(course.id, { id: 'admin', name: 'Admin' }, {
				csv: 'term,meaning_vi\nalpha,một',
				mode: 'commit',
				targetSetId: foreign.id,
				strategy: 'replace',
			}),
		).rejects.toThrow(/đã gắn/i);
	});

	it('hides vocab assigned to an unpublished lesson from learners', async () => {
		const { course } = await publishedGraph();
		const draftLesson = await createLesson(course.id, {
			title: 'Draft vocab lesson',
			slug: `${PREFIX}draft-vocab-l`,
		});
		const set = await db.vocabSet.create({
			data: { title: `${PREFIX}draft-lesson-set`, ownerId: 'admin', ownerName: 'Admin' },
		});
		await assignVocabSet(course.id, { vocabSetId: set.id, lessonId: draftLesson.id });
		const publicCourse = await getCourse(course.slug);
		expect(publicCourse.vocabSets.map((item) => item.vocabSetId)).not.toContain(set.id);
		await expect(getAssignedVocabSet(course.slug, set.id)).rejects.toThrow(/không thuộc/i);
	});

	it('keeps a published section that only has a test', async () => {
		const { course, lesson } = await publishedGraph();
		const emptySection = await createSection(lesson.id, { title: 'Empty quiz section' });
		await db.myClassSection.update({
			where: { id: emptySection.id },
			data: { status: 'PUBLISHED' },
		});
		const sectionTest = await createTest({
			title: 'Empty section quiz',
			slug: `${PREFIX}empty-section-quiz`,
		});
		await createTestPlacement(sectionTest.id, {
			courseId: course.id,
			scope: 'SECTION',
			lessonId: lesson.id,
			sectionId: emptySection.id,
		});
		await db.myClassTest.update({
			where: { id: sectionTest.id },
			data: { status: 'PUBLISHED', publishedAt: new Date() },
		});
		const publicCourse = await getCourse(course.slug);
		const found = publicCourse.lessons[0]?.sections.find((section) => section.id === emptySection.id);
		expect(found?.tests.some((test) => test.slug === `${PREFIX}empty-section-quiz`)).toBe(true);
	});

	it('omits archived tests from the picker list and hides other-course-only vocab', async () => {
		const { course } = await publishedGraph();
		const archived = await createTest({
			title: `${PREFIX}archived-picker`,
			slug: `${PREFIX}archived-picker`,
		});
		await db.myClassTest.update({
			where: { id: archived.id },
			data: { status: 'ARCHIVED' },
		});
		const picker = await listAdminTests({ q: `${PREFIX}archived-picker` });
		expect(picker.map((item) => item.id)).not.toContain(archived.id);

		const other = await createAdminCourse({
			title: 'Other vocab course',
			slug: `${PREFIX}other-search`,
		});
		const foreign = await createAndAssignVocabSet(
			{ id: 'admin', name: 'Admin' },
			{
				title: `${PREFIX}foreign-only`,
				words: [{ term: 'foreign', meaningVi: 'ngoại' }],
				courseId: other.id,
			},
		);
		const hits = await searchVocabSets(`${PREFIX}foreign-only`, { courseId: course.id });
		expect(hits.map((item) => item.id)).not.toContain(foreign.set!.id);
	});

	it('reorders active lesson, section, and unit lists when archived siblings exist', async () => {
		const { course, lesson, sectionA, sectionB, ku } = await publishedGraph();

		const lesson2 = await createLesson(course.id, {
			title: 'Placement',
			slug: `${PREFIX}placement`,
		});
		const lesson2Section = await createSection(lesson2.id, { title: 'Basics' });
		const placementKu = await createKnowledgeUnit({
			slug: `${PREFIX}placement-ku`,
			title: 'Placement KU',
			foundationHtml: '<p>place</p>',
		});
		await attachKnowledgeUnit(lesson2Section.id, placementKu.id);
		await publishRevision(placementKu.id);
		await db.myClassSection.update({
			where: { id: lesson2Section.id },
			data: { status: 'PUBLISHED' },
		});
		await db.myClassLesson.update({ where: { id: lesson2.id }, data: { status: 'PUBLISHED' } });

		const archivedLesson = await createLesson(course.id, {
			title: 'Archived lesson',
			slug: `${PREFIX}arch-lesson`,
		});
		await db.myClassLesson.update({
			where: { id: archivedLesson.id },
			data: { status: 'ARCHIVED' },
		});

		const archivedSection = await createSection(lesson.id, { title: 'Archived section' });
		await db.myClassSection.update({
			where: { id: archivedSection.id },
			data: { status: 'ARCHIVED' },
		});

		const extraKu = await createKnowledgeUnit({
			slug: `${PREFIX}extra-ku`,
			title: 'Extra KU',
			foundationHtml: '<p>extra</p>',
		});
		await attachKnowledgeUnit(sectionA.id, extraKu.id);
		await publishRevision(extraKu.id);

		const archivedKu = await createKnowledgeUnit({
			slug: `${PREFIX}arch-ku`,
			title: 'Archived KU',
			foundationHtml: '<p>old</p>',
		});
		await attachKnowledgeUnit(sectionA.id, archivedKu.id);
		await archiveKnowledgeUnit(archivedKu.id);

		await reorderCourseNodes(course.id, {
			parentType: 'course',
			parentId: course.id,
			orderedNodeIds: [lesson2.id, lesson.id],
		});
		const afterLessons = await getAdminCourse(course.id);
		expect(afterLessons.lessons.map((item) => item.id)).toEqual([
			lesson2.id,
			lesson.id,
			archivedLesson.id,
		]);

		await reorderCourseNodes(course.id, {
			parentType: 'lesson',
			parentId: lesson.id,
			orderedNodeIds: [sectionB.id, sectionA.id],
		});
		const afterSections = (await getAdminCourse(course.id)).lessons.find((item) => item.id === lesson.id)!;
		expect(afterSections.sections.map((item) => item.id)).toEqual([
			sectionB.id,
			sectionA.id,
			archivedSection.id,
		]);

		await reorderCourseNodes(course.id, {
			parentType: 'section',
			parentId: sectionA.id,
			orderedNodeIds: [extraKu.id, ku.id],
		});
		const afterUnits = (await getAdminCourse(course.id)).lessons
			.flatMap((item) => item.sections)
			.find((item) => item.id === sectionA.id)!;
		expect(afterUnits.knowledge.map((item) => item.knowledgeUnit.id)).toEqual([
			extraKu.id,
			ku.id,
			archivedKu.id,
		]);

		await reorderCourseNodes(course.id, {
			parentType: 'course',
			parentId: course.id,
			orderedNodeIds: [lesson.id, lesson2.id, archivedLesson.id],
		});
		expect((await getAdminCourse(course.id)).lessons.map((item) => item.id)).toEqual([
			lesson.id,
			lesson2.id,
			archivedLesson.id,
		]);
	});

	it('rejects reorder across courses and save conflicts', async () => {
		const { course, ku } = await publishedGraph();
		const other = await createAdminCourse({ title: 'Other', slug: `${PREFIX}other-reorder` });
		await expect(
			reorderCourseNodes(other.id, {
				parentType: 'course',
				parentId: course.id,
				orderedNodeIds: [],
			}),
		).rejects.toThrow();
		await expect(
			saveDraftRevision(ku.id, {
				title: 'Conflict',
				foundationHtml: '<p>x</p>',
				expectedUpdatedAt: '2000-01-01T00:00:00.000Z',
			}),
		).rejects.toThrow(/cập nhật/);
	});

	it('does not republish a clean revision and enforces publish freshness', async () => {
		const { ku } = await publishedGraph();
		await expect(publishRevision(ku.id, '2000-01-01T00:00:00.000Z')).rejects.toThrow(/cập nhật/);
		await expect(publishRevision(ku.id)).rejects.toThrow(/bản nháp/i);
	});

	it('archives a section through the guarded status action and drafts linked tests', async () => {
		const { course, lesson, sectionA } = await publishedGraph();
		const sectionTest = await createTest({
			title: 'Section quiz',
			slug: `${PREFIX}section-quiz`,
		});
		await createTestPlacement(sectionTest.id, {
			courseId: course.id,
			scope: 'SECTION',
			lessonId: lesson.id,
			sectionId: sectionA.id,
		});
		await db.myClassTest.update({
			where: { id: sectionTest.id },
			data: { status: 'PUBLISHED', publishedAt: new Date() },
		});
		const fresh = await getAdminCourse(course.id);
		const section = fresh.lessons[0]!.sections[0]!;
		await updateCourseNodeStatus(course.id, 'section', section.id, {
			expectedUpdatedAt: section.updatedAt.toISOString(),
			status: 'ARCHIVED',
		});
		expect((await db.myClassTest.findUnique({ where: { id: sectionTest.id } }))?.status).toBe(
			'DRAFT',
		);
	});
});

describe('prisma client used by services', () => {
	it('shares the test database', async () => {
		expect(prisma).toBeDefined();
	});
});

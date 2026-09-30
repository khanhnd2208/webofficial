import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { guestActorKey, userActorKey, type MyClassActor } from '../domain/actor';
import { formatEvidenceSummary } from '../domain/format';
import {
	resolveLearnerState,
	seedsFromCourseOutline,
	nextUnfinishedAfter,
	toOutlineItemLink,
	type MyClassLearnerState,
} from '../domain/learnerState';
import { weightedAccuracy } from '../domain/scoring';
import { computeStreak } from '../domain/streak';
import * as courseRepo from '../repositories/courseRepository';
import * as progressRepo from '../repositories/progressRepository';
import type { MyClassProgressDashboard, MyClassProgressResponse } from '../types';
import * as vocabRepo from '../repositories/vocabAssignmentRepository';
import { isLearnerVisibleVocabAssignment } from '../domain/vocabScope';
import { mapPublicCourse, mapVocabAssignment } from './mappers';

async function resolveCourseId(courseId?: string, courseSlug?: string) {
	if (courseId) return courseId;
	if (!courseSlug) throw new AppError('Thiếu courseId', 400);
	const course = await courseRepo.findCourseBySlug(courseSlug);
	if (!course) throw new AppError('Không tìm thấy Course', 404);
	return course.id;
}

export async function loadCourseLearnerState(
	courseSlug: string,
	actor: MyClassActor | null,
	openedUnitId?: string | null,
): Promise<{ course: ReturnType<typeof mapPublicCourse>; learnerState: MyClassLearnerState }> {
	const courseRow = await courseRepo.findPublishedCourse(courseSlug);
	if (!courseRow) throw new AppError('Không tìm thấy lớp học', 404);
	const course = mapPublicCourse(courseRow);
	const assignments = await vocabRepo.listAssignments(course.id);
	course.vocabSets = assignments.filter(isLearnerVisibleVocabAssignment).map(mapVocabAssignment);
	const seeds = seedsFromCourseOutline(course);
	const completedUnitIds = actor ? await progressRepo.listCompletedUnitIds(actor, course.id) : [];
	const lastViewedUnitId = actor
		? await progressRepo.findLatestViewedUnitId(actor, course.id)
		: null;
	const activityResume =
		lastViewedUnitId && completedUnitIds.includes(lastViewedUnitId)
			? (nextUnfinishedAfter(lastViewedUnitId, seeds, completedUnitIds)?.knowledgeUnitId ?? null)
			: lastViewedUnitId;
	return {
		course,
		learnerState: resolveLearnerState({
			seeds,
			completedUnitIds,
			openedUnitId: openedUnitId ?? activityResume,
		}),
	};
}

export async function markKnowledgeViewed(
	actor: MyClassActor | string,
	knowledgeUnitId: string,
	courseRef: { courseId?: string; courseSlug?: string; lessonSlug?: string; sectionId?: string },
) {
	const resolved =
		typeof actor === 'string'
			? ({ type: 'user', userId: actor, actorKey: userActorKey(actor) } as const)
			: actor;
	const courseId = await resolveCourseId(courseRef.courseId, courseRef.courseSlug);
	const belongs =
		courseRef.lessonSlug || courseRef.sectionId
			? await progressRepo.kuBelongsToContext(courseId, knowledgeUnitId, {
					lessonSlug: courseRef.lessonSlug,
					sectionId: courseRef.sectionId,
				})
			: await progressRepo.kuBelongsToCourse(courseId, knowledgeUnitId);
	if (!belongs) throw new AppError('Nội dung không thuộc khóa học này', 422);
	return progressRepo.upsertViewed(courseId, knowledgeUnitId, resolved);
}

export async function markKnowledgeCompleted(
	actor: MyClassActor | string,
	knowledgeUnitId: string,
	courseRef: { courseId?: string; courseSlug?: string; lessonSlug?: string; sectionId?: string },
) {
	const resolved =
		typeof actor === 'string'
			? ({ type: 'user', userId: actor, actorKey: userActorKey(actor) } as const)
			: actor;
	const courseId = await resolveCourseId(courseRef.courseId, courseRef.courseSlug);
	const mapping = await progressRepo.kuBelongsToContext(courseId, knowledgeUnitId, {
		lessonSlug: courseRef.lessonSlug,
		sectionId: courseRef.sectionId,
	});
	if (!mapping) throw new AppError('Nội dung không thuộc khóa học này', 422);
	const row = await progressRepo.markCompleted(courseId, knowledgeUnitId, resolved);
	return row;
}

export async function completeKnowledgeUnit(input: {
	actor: MyClassActor;
	courseSlug: string;
	kuSlug: string;
	lessonSlug?: string;
	sectionId?: string;
}) {
	const courseRow = await courseRepo.findPublishedCourse(input.courseSlug);
	if (!courseRow) throw new AppError('Không tìm thấy lớp học', 404);
	const course = mapPublicCourse(courseRow);
	const seeds = seedsFromCourseOutline(course);
	const seed = seeds.find(
		(item) =>
			item.knowledgeUnitSlug === input.kuSlug &&
			(!input.lessonSlug || item.lessonSlug === input.lessonSlug) &&
			(!input.sectionId || item.sectionId === input.sectionId),
	);
	if (!seed) throw new AppError('Không tìm thấy nội dung', 404);
	if (input.lessonSlug || input.sectionId) {
		const belongs = await progressRepo.kuBelongsToContext(course.id, seed.knowledgeUnitId, {
			lessonSlug: input.lessonSlug,
			sectionId: input.sectionId,
		});
		if (!belongs) throw new AppError('Nội dung không thuộc ngữ cảnh này', 422);
	}

	const row = await progressRepo.markCompleted(course.id, seed.knowledgeUnitId, input.actor);
	const alreadyCompleted = 'alreadyCompleted' in row ? row.alreadyCompleted : false;
	const completedAt = row.completedAt ?? new Date();
	const completedUnitIds = await progressRepo.listCompletedUnitIds(input.actor, course.id);
	const learnerState = resolveLearnerState({
		seeds,
		completedUnitIds,
		openedUnitId: seed.knowledgeUnitId,
	});
	const transitionItem = nextUnfinishedAfter(seed.knowledgeUnitId, seeds, completedUnitIds);
	const transition = { openItem: transitionItem ? toOutlineItemLink(transitionItem, seeds) : null };

	return {
		progress: {
			completedAt: completedAt.toISOString(),
			alreadyCompleted: Boolean(alreadyCompleted),
		},
		learnerState,
		transition,
		// Kept for older clients; new clients must use transition.openItem.
		next: transition.openItem,
	};
}

export async function getActorProgress(
	actor: MyClassActor | null,
	courseSlug?: string,
): Promise<MyClassProgressResponse> {
	const courses = [];
	if (courseSlug) {
		const row = await courseRepo.findPublishedCourse(courseSlug);
		if (!row) throw new AppError('Không tìm thấy lớp học', 404);
		courses.push(row);
	} else {
		courses.push(...(await courseRepo.listPublishedCourseOutlines()));
	}
	const summaries = [];
	for (const row of courses) {
		const course = mapPublicCourse(row);
		const seeds = seedsFromCourseOutline(course);
		const completedUnitIds = actor ? await progressRepo.listCompletedUnitIds(actor, course.id) : [];
		const lastViewedUnitId = actor
			? await progressRepo.findLatestViewedUnitId(actor, course.id)
			: null;
		const activityResume =
			lastViewedUnitId && completedUnitIds.includes(lastViewedUnitId)
				? (nextUnfinishedAfter(lastViewedUnitId, seeds, completedUnitIds)?.knowledgeUnitId ?? null)
				: lastViewedUnitId;
		const state = resolveLearnerState({
			seeds,
			completedUnitIds,
			openedUnitId: activityResume,
		});
		const resumeSeed = state.resumeItem;
		const resumeEstimatedMinutes = resumeSeed?.estimatedMinutes ?? null;
		summaries.push({
			courseId: course.id,
			courseSlug: course.slug,
			courseTitle: course.title,
			thumbnailUrl: course.thumbnailUrl,
			level: course.level,
			tags: course.tags,
			lessonCount: course.lessonCount ?? course.lessons.length,
			unitCount: course.unitCount ?? state.totalItems,
			estimatedMinutes: course.estimatedMinutes ?? null,
			resumeEstimatedMinutes,
			totalItems: state.totalItems,
			completedItems: state.completedItems,
			percent: state.percent,
			currentItem: state.currentItem ? toOutlineItemLink(state.currentItem, seeds) : null,
			nextItem: state.nextItem ? toOutlineItemLink(state.nextItem, seeds) : null,
			resumeItem: state.resumeItem ? toOutlineItemLink(state.resumeItem, seeds) : null,
			afterResumeItem: state.afterResumeItem
				? toOutlineItemLink(state.afterResumeItem, seeds)
				: null,
			isComplete: state.isComplete,
		});
	}

	return {
		actor: { type: actor?.type ?? 'guest' },
		courses: summaries,
	};
}

export async function claimGuestProgress(userId: string, guestId: string | null) {
	if (!guestId) return { claimed: 0, attempts: 0 };
	const userKey = userActorKey(userId);
	const guestKey = guestActorKey(guestId);

	return prisma.$transaction(async (tx) => {
		const guestRows = await tx.myClassKuProgress.findMany({ where: { guestId } });
		const userRows = guestRows.length
			? await tx.myClassKuProgress.findMany({
					where: {
						actorKey: userKey,
						OR: guestRows.map((guest) => ({
							courseId: guest.courseId,
							knowledgeUnitId: guest.knowledgeUnitId,
						})),
					},
				})
			: [];
		const userBySlot = new Map(
			userRows.map((row) => [`${row.courseId}:${row.knowledgeUnitId}`, row] as const),
		);
		let claimed = 0;
		for (const guest of guestRows) {
			const userRow = userBySlot.get(`${guest.courseId}:${guest.knowledgeUnitId}`);
			const firstViewedCandidates = [guest.firstViewedAt, userRow?.firstViewedAt].filter(
				(value): value is Date => Boolean(value),
			);
			const firstViewedAt = firstViewedCandidates.length
				? new Date(Math.min(...firstViewedCandidates.map((value) => value.getTime())))
				: guest.firstViewedAt;
			const completedAt =
				guest.completedAt && userRow?.completedAt
					? new Date(Math.min(guest.completedAt.getTime(), userRow.completedAt.getTime()))
					: (guest.completedAt ?? userRow?.completedAt ?? null);
			const lastViewedCandidates = [guest.lastViewedAt, userRow?.lastViewedAt].filter(
				(value): value is Date => Boolean(value),
			);
			const lastViewedAt = lastViewedCandidates.length
				? new Date(Math.max(...lastViewedCandidates.map((value) => value.getTime())))
				: (guest.lastViewedAt ?? userRow?.lastViewedAt ?? null);

			if (userRow) {
				await tx.myClassKuProgress.update({
					where: { id: userRow.id },
					data: { firstViewedAt, completedAt, lastViewedAt },
				});
				await tx.myClassKuProgress.delete({ where: { id: guest.id } });
			} else {
				await tx.myClassKuProgress.update({
					where: { id: guest.id },
					data: {
						userId,
						guestId: null,
						actorKey: userKey,
						firstViewedAt,
						lastViewedAt,
						completedAt,
					},
				});
			}
			claimed += 1;
		}

		const guestAttemptCount = await tx.myClassTestAttempt.count({ where: { guestId } });
		if (guestAttemptCount) {
			await tx.myClassTestAttempt.updateMany({
				where: { guestId },
				data: { userId, guestId: null },
			});
		}

		const leftover = await tx.myClassKuProgress.count({ where: { actorKey: guestKey } });
		if (leftover) {
			await tx.myClassKuProgress.deleteMany({ where: { actorKey: guestKey } });
		}

		return { claimed, attempts: guestAttemptCount };
	});
}

export async function getProgress(userId: string): Promise<MyClassProgressDashboard> {
	const since = new Date();
	since.setUTCDate(since.getUTCDate() - 84);
	const [knowledge, attempts, activityRows] = await Promise.all([
		progressRepo.listProgress(userId),
		progressRepo.listUserAttempts(userId),
		progressRepo.listActivityDays(userActorKey(userId), since),
	]);

	const tests = new Map<string, MyClassProgressDashboard['tests'][number]>();
	for (const attempt of attempts) {
		const key = `${attempt.courseId ?? attempt.placement?.courseId ?? 'none'}:${attempt.testId}`;
		const courseSlug = attempt.course?.slug ?? attempt.placement?.course.slug ?? '';
		const current = tests.get(key) ?? {
			courseSlug,
			testSlug: attempt.test.slug,
			title: attempt.test.title,
			attemptCount: 0,
			latestScore: attempt.score,
			bestScore: attempt.score,
			total: attempt.total,
			attempts: [],
			kuAccuracy: [],
		};
		current.attemptCount += 1;
		current.bestScore = Math.max(current.bestScore, attempt.score);
		if (current.attempts.length === 0) current.latestScore = attempt.score;
		current.attempts.push({
			id: attempt.id,
			score: attempt.score,
			total: attempt.total,
			submittedAt: attempt.submittedAt.toISOString(),
		});
		for (const row of attempt.evidence) {
			const existing = current.kuAccuracy.find(
				(item) => item.slug === (row.knowledgeUnitSlugSnapshot ?? row.knowledgeUnit.slug),
			);
			const slug = row.knowledgeUnitSlugSnapshot ?? row.knowledgeUnit.slug;
			const title =
				row.knowledgeUnitTitleSnapshot ??
				row.knowledgeUnit.currentPublishedRevision?.title ??
				row.knowledgeUnit.slug;
			const questions = (existing?.questions ?? 0) + row.questionCount;
			const correct = (existing?.correct ?? 0) + row.correctCount;
			const accuracy = weightedAccuracy(correct, questions);
			const next = {
				slug,
				title,
				attempts: (existing?.attempts ?? 0) + 1,
				questions,
				correct,
				accuracy,
				lastActivityAt: attempt.submittedAt.toISOString(),
				evidenceLabel: formatEvidenceSummary(correct, questions, accuracy),
			};
			if (existing) Object.assign(existing, next);
			else current.kuAccuracy.push(next);
		}
		tests.set(key, current);
	}

	const activityDays = activityRows.map((row) => row.day.toISOString().slice(0, 10));

	return {
		knowledge: knowledge.map((item) => ({
			courseSlug: item.course.slug,
			courseTitle: item.course.title,
			knowledgeUnitSlug: item.knowledgeUnit.slug,
			knowledgeUnitId: item.knowledgeUnitId,
			title: item.knowledgeUnit.currentPublishedRevision?.title ?? item.knowledgeUnit.slug,
			viewedAt: item.firstViewedAt?.toISOString() ?? null,
			completedAt: item.completedAt?.toISOString() ?? null,
		})),
		tests: [...tests.values()],
		streak: computeStreak(activityDays),
		activityDays,
	};
}

/** Course-scoped review: keep best/latest scores, but wrong-item evidence comes from the latest attempt. */
export async function getSubjectReview(userId: string, courseSlug: string) {
	const [dashboard, attempts] = await Promise.all([
		getProgress(userId),
		progressRepo.listUserAttempts(userId),
	]);
	const latest = new Map<string, (typeof attempts)[number]>();
	for (const attempt of attempts) {
		const slug = attempt.course?.slug ?? attempt.placement?.course.slug ?? '';
		if (slug !== courseSlug) continue;
		const key = attempt.test.slug;
		const current = latest.get(key);
		if (!current || attempt.submittedAt > current.submittedAt) latest.set(key, attempt);
	}
	return dashboard.tests
		.filter((test) => test.courseSlug === courseSlug)
		.map((test) => {
			const attempt = latest.get(test.testSlug);
			if (!attempt) return test;
			return {
				...test,
				kuAccuracy: attempt.evidence.map((row) => {
					const slug = row.knowledgeUnitSlugSnapshot ?? row.knowledgeUnit.slug;
					const title =
						row.knowledgeUnitTitleSnapshot ??
						row.knowledgeUnit.currentPublishedRevision?.title ??
						slug;
					const accuracy = weightedAccuracy(row.correctCount, row.questionCount);
					return {
						slug,
						title,
						attempts: 1,
						questions: row.questionCount,
						correct: row.correctCount,
						accuracy,
						lastActivityAt: attempt.submittedAt.toISOString(),
						evidenceLabel: formatEvidenceSummary(row.correctCount, row.questionCount, accuracy),
					};
				}),
			};
		});
}

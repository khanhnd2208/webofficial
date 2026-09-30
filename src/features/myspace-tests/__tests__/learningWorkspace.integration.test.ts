import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import * as repo from '@/features/myspace-tests/repositories/myspaceTestsRepository';
import * as service from '@/features/myspace-tests/services/myspaceTestsService';
import { disconnectTestPrisma, getTestPrisma } from '@/test/helpers/db.postgres';

const db = getTestPrisma();

const PREFIX = 'lw-test-';

async function cleanup() {
	await db.spaceTestSession.deleteMany({
		where: {
			OR: [
				{ guestId: { startsWith: PREFIX } },
				{ userId: { startsWith: PREFIX } },
				{ spaceTest: { slug: { startsWith: PREFIX } } },
			],
		},
	});
	await db.mcqQuestion.deleteMany({
		where: { spaceTest: { slug: { startsWith: PREFIX } } },
	});
	await db.spaceTest.deleteMany({ where: { slug: { startsWith: PREFIX } } });
	await db.subject.deleteMany({ where: { slug: { startsWith: PREFIX } } });
}

async function seedPublishedTest(slugSuffix: string) {
	const subject = await db.subject.create({
		data: {
			name: `${PREFIX} Subject ${slugSuffix}`,
			slug: `${PREFIX}-subject-${slugSuffix}`,
		},
	});
	const test = await db.spaceTest.create({
		data: {
			slug: `${PREFIX}-${slugSuffix}`,
			title: `Learning Workspace ${slugSuffix}`,
			description: 'integration',
			subjectId: subject.id,
			questionCount: 1,
			displayOrder: 1,
			status: 'PUBLISHED',
			publishedAt: new Date(),
		},
	});
	const question = await db.mcqQuestion.create({
		data: {
			subjectId: subject.id,
			spaceTestId: test.id,
			topic: 'Topic',
			stem: 'Stem?',
			optionA: 'A',
			optionB: 'B',
			optionC: 'C',
			optionD: 'D',
			correctOption: 'A',
			difficulty: 2,
		},
	});
	return { subject, test, question };
}

beforeEach(cleanup);
afterAll(async () => {
	await cleanup();
	await disconnectTestPrisma();
});

describe('My Space Learning Workspace progress', () => {
	it('creates and reads personal progress via guest id', async () => {
		const { test, question } = await seedPublishedTest('guest');
		const guestId = `${PREFIX}-guest-1`;

		const session = await repo.createSession(test.id, [question.id], {
			engaged: true,
			guestId,
		});
		await repo.submitSession(session.id, 1, 1);

		const progress = await repo.getPersonalProgressByTestIds([test.id], { guestId });
		const item = progress.get(test.id)!;
		expect(item.status).toBe('completed');
		expect(item.completedCount).toBe(1);
		expect(item.bestScorePercent).toBe(100);
		expect(item.recentCompletions).toHaveLength(1);

		const orphanProgress = await repo.getPersonalProgressByTestIds([test.id], {
			guestId: `${PREFIX}-other`,
		});
		expect(orphanProgress.get(test.id)?.status).toBe('not_started');
	});

	it('does not leak ownerless analytics sessions into personal progress', async () => {
		const { test, question } = await seedPublishedTest('orphan');
		const session = await repo.createSession(test.id, [question.id], { engaged: true });
		await repo.submitSession(session.id, 1, 1);

		const progress = await repo.getPersonalProgressByTestIds([test.id], {
			userId: `${PREFIX}-user`,
			guestId: `${PREFIX}-guest`,
		});
		expect(progress.get(test.id)?.status).toBe('not_started');

		const stats = await repo.getAttemptStatsByTest();
		const row = stats.find((s) => s.spaceTestId === test.id);
		expect(row?.engaged).toBeGreaterThan(0);
	});

	it('restricts check/submit to the owning actor', async () => {
		const { test, question } = await seedPublishedTest('owner');
		const owner = `${PREFIX}-owner`;
		const other = `${PREFIX}-other`;

		const started = await service.startSession(
			test.slug,
			{ mode: 'default', persist: true, engage: true, questionIds: [question.id] },
			{ userId: owner },
		);
		expect(started.sessionId).toBeTruthy();

		await expect(
			service.checkAnswer(
				test.slug,
				started.sessionId!,
				{ questionId: question.id, chosen: 'A' },
				{ userId: other },
			),
		).rejects.toMatchObject({ status: 403 });

		const checked = await service.checkAnswer(
			test.slug,
			started.sessionId!,
			{ questionId: question.id, chosen: 'A' },
			{ userId: owner },
		);
		expect(checked.isCorrect).toBe(true);

		await expect(
			service.submitSession(
				test.slug,
				started.sessionId!,
				{ answers: [{ questionId: question.id, chosen: 'A' }] },
				{ userId: other },
			),
		).rejects.toMatchObject({ status: 403 });

		const submitted = await service.submitSession(
			test.slug,
			started.sessionId!,
			{ answers: [{ questionId: question.id, chosen: 'A' }] },
			{ userId: owner },
		);
		expect(submitted.score).toBe(1);
	});

	it('claims guest sessions onto a user account idempotently', async () => {
		const { test, question } = await seedPublishedTest('claim');
		const guestId = `${PREFIX}-guest-claim`;
		const userId = `${PREFIX}-user-claim`;

		const session = await repo.createSession(test.id, [question.id], {
			engaged: true,
			guestId,
		});
		await repo.submitSession(session.id, 1, 1);

		const first = await service.claimGuestProgress(userId, guestId);
		expect(first.claimed).toBe(1);

		const second = await service.claimGuestProgress(userId, guestId);
		expect(second.claimed).toBe(0);

		const asUser = await repo.getPersonalProgressByTestIds([test.id], { userId });
		expect(asUser.get(test.id)?.status).toBe('completed');

		const asGuest = await repo.getPersonalProgressByTestIds([test.id], { guestId });
		expect(asGuest.get(test.id)?.status).toBe('not_started');

		const row = await db.spaceTestSession.findUnique({ where: { id: session.id } });
		expect(row?.userId).toBe(userId);
		expect(row?.guestId).toBeNull();
	});

	it('sorts published catalogue by displayOrder before title', async () => {
		const subject = await db.subject.create({
			data: { name: `${PREFIX} Sort Subject`, slug: `${PREFIX}-sort-subject` },
		});
		await db.spaceTest.createMany({
			data: [
				{
					slug: `${PREFIX}-sort-10`,
					title: 'Chapter 10',
					subjectId: subject.id,
					questionCount: 1,
					displayOrder: 10,
					status: 'PUBLISHED',
					publishedAt: new Date(),
				},
				{
					slug: `${PREFIX}-sort-2`,
					title: 'Chapter 2',
					subjectId: subject.id,
					questionCount: 1,
					displayOrder: 2,
					status: 'PUBLISHED',
					publishedAt: new Date(),
				},
			],
		});

		const grouped = await service.listPublishedTestsGrouped();
		const group = grouped.find((g) => g.subjectId === subject.id);
		expect(group?.tests.map((t) => t.title)).toEqual(['Chapter 2', 'Chapter 10']);
	});
});

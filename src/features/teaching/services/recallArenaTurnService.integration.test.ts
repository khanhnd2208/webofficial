import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { disconnectTestPrisma } from '@/test/helpers/db.postgres';

import {
	listRecallArenaDays,
	listRecallArenaTurns,
	recordRecallArenaTurn,
} from './recallArenaTurnService';

const suffix = `turn-${Date.now().toString(36)}`;
const ids = { course: '', otherCourse: '', class: '', enrollment: '', student: '', card: '' };
// 09:00 on 3 Nov 2026 in Vietnam, and 23:30 the same Vietnam day (16:30 UTC).
const MORNING = Date.parse('2026-11-03T02:00:00.000Z');
const LATE = Date.parse('2026-11-03T16:30:00.000Z');

beforeAll(async () => {
	const [course, otherCourse] = await Promise.all(
		['A', 'B'].map((tag) =>
			prisma.teachingCourse.create({
				data: { courseCode: `T${tag}-${suffix}`.slice(0, 40), courseName: `Turn ${tag}` },
			}),
		),
	);
	const teachingClass = await prisma.teachingClass.create({
		data: {
			courseId: course!.id,
			courseCode: course!.courseCode,
			courseName: course!.courseName,
			groupNo: suffix.slice(0, 20),
			classCode: suffix.slice(0, 20),
			term: `Turn ${suffix}`,
		},
	});
	const student = await prisma.teachingStudent.create({
		data: {
			studentCode: `${suffix}-S`,
			studentCodeNormalized: `${suffix}-S`.toUpperCase(),
			familyName: 'Trần Thị',
			givenName: 'Mai',
		},
	});
	const enrollment = await prisma.teachingEnrollment.create({
		data: { classId: teachingClass.id, studentId: student.id, orderNo: 1 },
	});
	const deck = await prisma.activeRecallDeck.create({
		data: {
			slug: `turn-deck-${suffix}`,
			title: 'Turn deck',
			courseId: course!.id,
			subject: 'Turn',
			cards: { create: [{ question: '<p>Định nghĩa CP?</p>', answer: '<p>-</p>' }] },
		},
		include: { cards: true },
	});
	Object.assign(ids, {
		course: course!.id,
		otherCourse: otherCourse!.id,
		class: teachingClass.id,
		enrollment: enrollment.id,
		student: student.id,
		card: deck.cards[0]!.id,
	});
});

afterAll(async () => {
	await prisma.teachingClass.deleteMany({ where: { id: ids.class } });
	await prisma.teachingStudent.deleteMany({ where: { id: ids.student } });
	await prisma.activeRecallDeck.deleteMany({ where: { courseId: ids.course } });
	await prisma.teachingCourse.deleteMany({
		where: { id: { in: [ids.course, ids.otherCourse] } },
	});
	await disconnectTestPrisma();
});

describe('recall arena turn log', () => {
	it('saves a student call with the name, code and question from the database', async () => {
		const turn = await recordRecallArenaTurn(ids.course, {
			clientId: `${suffix}-one`,
			playedAt: MORNING,
			runKey: 'session-a~run1',
			enrollmentId: ids.enrollment,
			cardId: ids.card,
			result: 'pass',
			award: 1,
			cpAfter: 1,
		});
		expect(turn).toMatchObject({
			playedOn: '2026-11-03',
			runKey: 'session-a~run1',
			enrollmentId: ids.enrollment,
			guest: false,
			playerName: 'Trần Thị Mai',
			studentCode: `${suffix}-S`,
			question: '<p>Định nghĩa CP?</p>',
			result: 'pass',
			award: 1,
			cpAfter: 1,
			giftAfter: null,
		});
	});

	it('keeps a player outside the roster by the typed name and group', async () => {
		const turn = await recordRecallArenaTurn(ids.course, {
			clientId: `${suffix}-guest`,
			playedAt: LATE,
			guestName: 'Lê Văn Khách',
			guestGroup: 'SUPPORT',
			result: 'fail',
		});
		expect(turn).toMatchObject({
			playedOn: '2026-11-03',
			runKey: null,
			enrollmentId: null,
			guest: true,
			guestGroup: 'SUPPORT',
			playerName: 'Lê Văn Khách',
			cardId: null,
			result: 'fail',
		});
	});

	it('stores a resent turn once and updates its score', async () => {
		const again = await recordRecallArenaTurn(ids.course, {
			clientId: `${suffix}-one`,
			playedAt: MORNING,
			enrollmentId: ids.enrollment,
			cardId: ids.card,
			result: 'pass',
			award: 2,
			cpAfter: 2,
		});
		expect(again.cpAfter).toBe(2);
		const turns = await listRecallArenaTurns(ids.course, '2026-11-03');
		expect(turns.map((turn) => [turn.clientId, turn.runKey])).toEqual([
			[`${suffix}-one`, 'session-a~run1'],
			[`${suffix}-guest`, null],
		]);
		await expect(listRecallArenaDays(ids.course)).resolves.toEqual(['2026-11-03']);
	});

	it('refuses a student from another course and a turn saved for another course', async () => {
		await expect(
			recordRecallArenaTurn(ids.otherCourse, {
				clientId: `${suffix}-wrong`,
				playedAt: MORNING,
				enrollmentId: ids.enrollment,
				result: 'skip',
			}),
		).rejects.toMatchObject({ status: 404 });
		await expect(
			recordRecallArenaTurn(ids.otherCourse, {
				clientId: `${suffix}-guest`,
				playedAt: MORNING,
				guestName: 'Ai đó',
				result: 'skip',
			}),
		).rejects.toMatchObject({ status: 409 });
	});

	it('charges exactly one Gift for concurrent submissions and retries of the same turn', async () => {
		const input = {
			clientId: `${suffix}-gift`,
			playedAt: LATE,
			enrollmentId: ids.enrollment,
			cardId: ids.card,
			result: 'fail',
			grade: { kind: 'gift' },
		} as const;
		const turns = await Promise.all([
			recordRecallArenaTurn(ids.course, input),
			recordRecallArenaTurn(ids.course, input),
		]);
		expect(turns.map((turn) => turn.giftAfter)).toEqual([1, 1]);
		await expect(recordRecallArenaTurn(ids.course, input)).resolves.toMatchObject({ giftAfter: 1 });
		await expect(
			recordRecallArenaTurn(ids.course, { ...input, grade: undefined, result: 'pass' }),
		).rejects.toMatchObject({ status: 409 });
		const enrollment = await prisma.teachingEnrollment.findUniqueOrThrow({
			where: { id: ids.enrollment },
		});
		expect(enrollment.giftCount).toBe(1);
		expect(await prisma.teachingArenaTurn.count({ where: { clientId: input.clientId } })).toBe(1);
	});

	it('drops a card from another course instead of linking it', async () => {
		const otherDeck = await prisma.activeRecallDeck.create({
			data: {
				slug: `turn-other-${suffix}`,
				title: 'Other',
				courseId: ids.otherCourse,
				subject: 'Other',
				cards: { create: [{ question: 'Q', answer: 'A' }] },
			},
			include: { cards: true },
		});
		try {
			const turn = await recordRecallArenaTurn(ids.course, {
				clientId: `${suffix}-card`,
				playedAt: MORNING,
				guestName: 'Khách 2',
				cardId: otherDeck.cards[0]!.id,
				result: 'pass',
			});
			expect(turn).toMatchObject({ cardId: null, question: '' });
		} finally {
			await prisma.activeRecallDeck.delete({ where: { id: otherDeck.id } });
		}
	});
});

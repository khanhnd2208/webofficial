import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { disconnectTestPrisma } from '@/test/helpers/db.postgres';

import { recordRecallArenaTurn } from './recallArenaTurnService';
import { awardRecallArenaCp, getRecallArena, getRecallArenaCourseId } from './recallArenaService';

const suffix = `arena-${Date.now().toString(36)}`;
const ids = {
	course: '',
	class: '',
	otherClass: '',
	session: '',
	present: '',
	absent: '',
	students: [] as string[],
};

beforeAll(async () => {
	const course = await prisma.teachingCourse.create({
		data: { courseCode: `ARENA-${suffix}`.slice(0, 40), courseName: 'Arena course' },
	});
	const teachingClass = await prisma.teachingClass.create({
		data: {
			courseId: course.id,
			courseCode: course.courseCode,
			courseName: course.courseName,
			groupNo: suffix.slice(0, 20),
			classCode: suffix.slice(0, 20),
			term: `Arena ${suffix}`,
		},
	});
	const tutorial = await prisma.teachingTutorialClass.create({
		data: { classId: teachingClass.id, code: 'T1', name: 'Tutorial 1' },
	});
	const session = await prisma.teachingSession.create({
		data: {
			classId: teachingClass.id,
			tutorialClassId: tutorial.id,
			weekNumber: 1,
			attendanceTakenAt: new Date(),
			participationOpen: true,
		},
	});
	const [present, absent] = await Promise.all(
		['P', 'A'].map((tag) =>
			prisma.teachingStudent.create({
				data: {
					studentCode: `${suffix}-${tag}`,
					studentCodeNormalized: `${suffix}-${tag}`.toUpperCase(),
					familyName: 'Nguyễn',
					givenName: tag === 'P' ? 'An' : 'Bình',
				},
			}),
		),
	);
	const enrollPresent = await prisma.teachingEnrollment.create({
		data: {
			classId: teachingClass.id,
			tutorialClassId: tutorial.id,
			studentId: present!.id,
			orderNo: 1,
			learningExperience: 'CHALLENGE',
		},
	});
	const enrollAbsent = await prisma.teachingEnrollment.create({
		data: {
			classId: teachingClass.id,
			tutorialClassId: tutorial.id,
			studentId: absent!.id,
			orderNo: 2,
		},
	});
	await prisma.teachingAttendance.createMany({
		data: [
			{ sessionId: session.id, enrollmentId: enrollPresent.id, status: 'PRESENT' },
			{ sessionId: session.id, enrollmentId: enrollAbsent.id, status: 'ABSENT_UNEXCUSED' },
		],
	});
	const deck = await prisma.activeRecallDeck.create({
		data: {
			slug: `deck-${suffix}`,
			title: 'Arena deck',
			courseId: course.id,
			subject: 'Arena',
			lessonLabel: 'Bài 1',
			status: 'PUBLISHED',
			publishedAt: new Date(),
			cards: { create: [{ question: '<p>Q1</p>', answer: '<p>A1</p>', position: 0 }] },
		},
	});
	await prisma.teachingClassRecallDeck.create({
		data: { classId: teachingClass.id, deckId: deck.id, enabled: true },
	});
	// Left out of the arena: a deck with no cards and an archived deck.
	await prisma.activeRecallDeck.createMany({
		data: [
			{
				slug: `empty-${suffix}`,
				title: 'Empty deck',
				courseId: course.id,
				subject: 'Arena',
				status: 'DRAFT',
			},
			{
				slug: `old-${suffix}`,
				title: 'Old deck',
				courseId: course.id,
				subject: 'Arena',
				status: 'ARCHIVED',
			},
		],
	});
	const otherClass = await prisma.teachingClass.create({
		data: {
			courseId: course.id,
			courseCode: course.courseCode,
			courseName: course.courseName,
			groupNo: `${suffix}b`.slice(0, 20),
			classCode: `${suffix}b`.slice(0, 20),
			term: `Arena ${suffix}`,
		},
	});
	ids.otherClass = otherClass.id;
	Object.assign(ids, {
		course: course.id,
		class: teachingClass.id,
		session: session.id,
		present: enrollPresent.id,
		absent: enrollAbsent.id,
		students: [present!.id, absent!.id],
	});
});

afterAll(async () => {
	await prisma.teachingClass.deleteMany({ where: { id: { in: [ids.class, ids.otherClass] } } });
	await prisma.teachingStudent.deleteMany({ where: { id: { in: ids.students } } });
	await prisma.activeRecallDeck.deleteMany({ where: { courseId: ids.course } });
	await prisma.teachingCourse.deleteMany({ where: { id: ids.course } });
	await disconnectTestPrisma();
});

describe('recall arena service', () => {
	it('loads every active class of the course with players, attendance, group and lessons', async () => {
		const arena = await getRecallArena(ids.course);
		expect(arena.classes.map((item) => item.id).sort()).toEqual([ids.class, ids.otherClass].sort());
		const mine = arena.classes.find((item) => item.id === ids.class)!;
		expect(mine.defaultSessionId).toBe(ids.session);
		expect(mine.enabledDeckIds).toHaveLength(1);
		expect(arena.decks.map((deck) => deck.title)).toEqual(['Arena deck']);
		const present = arena.players.find((player) => player.enrollmentId === ids.present);
		expect(present?.classId).toBe(ids.class);
		expect(present?.group).toBe('CHALLENGE');
		expect(present?.attendance[ids.session]).toBe('PRESENT');
		expect(arena.players.find((player) => player.enrollmentId === ids.absent)?.group).toBeNull();
		expect(arena.cards.map((card) => card.question)).toEqual(['<p>Q1</p>']);
	});

	it('maps an old class link to its course', async () => {
		await expect(getRecallArenaCourseId(ids.class)).resolves.toBe(ids.course);
		await expect(getRecallArenaCourseId('missing-class')).rejects.toMatchObject({ status: 404 });
	});

	it('raises CP to the award and never lowers it', async () => {
		const first = await awardRecallArenaCp(ids.session, { enrollmentId: ids.present, points: 1 });
		expect(first).toMatchObject({ previous: 0, points: 1, changed: true });

		const lower = await awardRecallArenaCp(ids.session, {
			enrollmentId: ids.present,
			points: 0.5,
		});
		expect(lower).toMatchObject({ previous: 1, points: 1, changed: false });

		const higher = await awardRecallArenaCp(ids.session, { enrollmentId: ids.present, points: 2 });
		expect(higher).toMatchObject({ previous: 1, points: 2, changed: true });
	});

	it('keeps the note the lecturer wrote on the CP mark', async () => {
		await prisma.teachingParticipation.update({
			where: {
				sessionId_enrollmentId: { sessionId: ids.session, enrollmentId: ids.present },
			},
			data: { points: 0.5, note: 'phát biểu tốt' },
		});
		await awardRecallArenaCp(ids.session, { enrollmentId: ids.present, points: 1 });
		const mark = await prisma.teachingParticipation.findUnique({
			where: {
				sessionId_enrollmentId: { sessionId: ids.session, enrollmentId: ids.present },
			},
		});
		expect(Number(mark?.points)).toBe(1);
		expect(mark?.note).toBe('phát biểu tốt');
	});

	it('keeps the highest CP when concurrent awards both start with no mark', async () => {
		const enrollmentId = ids.absent;
		await prisma.teachingParticipation.deleteMany({
			where: { sessionId: ids.session, enrollmentId },
		});
		await Promise.all([
			awardRecallArenaCp(ids.session, { enrollmentId, points: 2 }),
			awardRecallArenaCp(ids.session, { enrollmentId, points: 0.5 }),
		]);
		const mark = await prisma.teachingParticipation.findUniqueOrThrow({
			where: { sessionId_enrollmentId: { sessionId: ids.session, enrollmentId } },
		});
		expect(Number(mark.points)).toBe(2);
	});

	it('commits the CP and the turn together and reuses the saved grade after a retry', async () => {
		const input = {
			clientId: `${suffix}-cp`,
			playedAt: Date.now(),
			enrollmentId: ids.present,
			result: 'pass',
			award: 2,
			grade: { kind: 'cp', sessionId: ids.session },
		} as const;
		await prisma.teachingSession.update({
			where: { id: ids.session },
			data: { participationOpen: false },
		});
		await expect(recordRecallArenaTurn(ids.course, input)).rejects.toMatchObject({ status: 409 });
		expect(
			await prisma.teachingArenaTurn.findUnique({ where: { clientId: input.clientId } }),
		).toBeNull();
		await prisma.teachingSession.update({
			where: { id: ids.session },
			data: { participationOpen: true },
		});
		await expect(recordRecallArenaTurn(ids.course, input)).resolves.toMatchObject({ cpAfter: 2 });
		await prisma.teachingSession.update({
			where: { id: ids.session },
			data: { participationOpen: false },
		});
		await expect(recordRecallArenaTurn(ids.course, input)).resolves.toMatchObject({ cpAfter: 2 });
		await prisma.teachingSession.update({
			where: { id: ids.session },
			data: { participationOpen: true },
		});
	});

	it('refuses to save while CP grading is locked for the week', async () => {
		await prisma.teachingSession.update({
			where: { id: ids.session },
			data: { participationOpen: false },
		});
		await expect(
			awardRecallArenaCp(ids.session, { enrollmentId: ids.absent, points: 1 }),
		).rejects.toMatchObject({ status: 409 });
		await prisma.teachingSession.update({
			where: { id: ids.session },
			data: { participationOpen: true },
		});
	});
});

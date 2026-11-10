import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { disconnectTestPrisma } from '@/test/helpers/db.postgres';

import { awardRecallArenaCp, getRecallArena } from './recallArenaService';

const suffix = `arena-${Date.now().toString(36)}`;
const ids = {
	course: '',
	class: '',
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
	await prisma.teachingClass.deleteMany({ where: { id: ids.class } });
	await prisma.teachingStudent.deleteMany({ where: { id: { in: ids.students } } });
	await prisma.activeRecallDeck.deleteMany({ where: { courseId: ids.course } });
	await prisma.teachingCourse.deleteMany({ where: { id: ids.course } });
	await disconnectTestPrisma();
});

describe('recall arena service', () => {
	it('loads players with attendance and group, plus the class cards', async () => {
		const arena = await getRecallArena(ids.class);
		expect(arena.defaultSessionId).toBe(ids.session);
		const present = arena.players.find((player) => player.enrollmentId === ids.present);
		expect(present?.group).toBe('CHALLENGE');
		expect(present?.attendance[ids.session]).toBe('PRESENT');
		expect(arena.players.find((player) => player.enrollmentId === ids.absent)?.group).toBeNull();
		expect(arena.cards.map((card) => card.question)).toEqual(['<p>Q1</p>']);
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

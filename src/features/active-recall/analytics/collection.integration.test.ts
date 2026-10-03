import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { beginRecallStudy, heartbeatRecallStudy } from './collection';
import { getRecallReport } from './report';
import { recallReportFilters } from './time';
import type { RecallBeginInput, RecallHeartbeatInput } from './contracts';
const authState = vi.hoisted(() => ({ admin: true }));
vi.mock('@/lib/auth', () => ({
	auth: vi.fn(async () => ({ user: { role: authState.admin ? 'admin' : 'student' } })),
}));

describe('anonymous Recall analytics with PostgreSQL', () => {
	const visitors: string[] = [],
		courses: string[] = [];
	let now: Date;
	beforeEach(() => {
		authState.admin = true;
		now = new Date('2026-10-03T10:00:00Z');
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(now);
	});
	afterEach(async () => {
		vi.useRealTimers();
		await prisma.recallVisitor.deleteMany({ where: { id: { in: visitors.splice(0) } } });
		await prisma.teachingClass.deleteMany({ where: { courseId: { in: courses } } });
		await prisma.activeRecallDeck.deleteMany({ where: { courseId: { in: courses } } });
		await prisma.teachingCourse.deleteMany({ where: { id: { in: courses.splice(0) } } });
	});
	function advance(seconds: number) {
		now = new Date(now.getTime() + seconds * 1000);
		vi.setSystemTime(now);
	}
	async function fixture() {
		const course = await prisma.teachingCourse.create({
			data: { courseCode: 'recall-test-' + randomUUID(), courseName: 'Analytics fixture' },
		});
		courses.push(course.id);
		const deck = await prisma.activeRecallDeck.create({
			data: {
				courseId: course.id,
				slug: 'recall-' + randomUUID(),
				title: 'Deck A',
				subject: 'Test',
				status: 'PUBLISHED',
				cards: { create: { question: 'Question', answer: 'Answer', position: 0 } },
			},
		});
		return { course, deck };
	}
	function actor() {
		const id = randomUUID();
		visitors.push(id);
		return id;
	}
	function input(deckId: string): RecallBeginInput {
		return { deckId, visitId: randomUUID(), clientId: randomUUID(), claimLease: true };
	}
	async function beat(
		visitor: string,
		b: Awaited<ReturnType<typeof beginRecallStudy>>,
		i: RecallBeginInput,
		sequence: number,
		patch: Partial<RecallHeartbeatInput> = {},
	) {
		return heartbeatRecallStudy(visitor, {
			sessionId: b.sessionId,
			visitId: b.visitId,
			clientId: i.clientId,
			sequence,
			seconds: 0,
			interactions: 0,
			answerReveals: 0,
			active: true,
			activityAgeSeconds: 0,
			releaseLease: false,
			...patch,
		});
	}
	function report(course: string, extra: Record<string, string> = {}) {
		return getRecallReport(
			recallReportFilters({ course, start: '2026-10-03', end: '2026-10-03', ...extra }),
		);
	}
	it('deduplicates concurrent begins, reloads and multiple decks into one browser session', async () => {
		const f = await fixture(),
			v = actor(),
			i = input(f.deck.id);
		const [a, b] = await Promise.all([beginRecallStudy(v, i), beginRecallStudy(v, i)]);
		expect(a.sessionId).toBe(b.sessionId);
		expect(await prisma.recallStudyVisit.count({ where: { sessionId: a.sessionId } })).toBe(1);
		const second = await prisma.activeRecallDeck.create({
			data: {
				courseId: f.course.id,
				slug: randomUUID(),
				title: 'Deck B',
				status: 'PUBLISHED',
				cards: { create: { question: 'Q', answer: 'A', position: 0 } },
			},
		});
		await beat(v, a, i, 0, { interactions: 1, answerReveals: 1 });
		advance(60);
		await beat(v, a, i, 1, { seconds: 60 });
		await beat(v, a, i, 1, { seconds: 60 });
		await beat(v, a, i, 2, { releaseLease: true });
		const j = input(second.id),
			c = await beginRecallStudy(v, j);
		expect(c.sessionId).toBe(a.sessionId);
		await beat(v, c, j, 0, { interactions: 1 });
		const r = await report(f.course.id);
		expect(r.totals).toMatchObject({
			visitors: 1,
			learners: 1,
			sessions: 1,
			opens: 2,
			seconds: 60,
			reveals: 1,
		});
		expect(r.decks).toHaveLength(2);
		expect(r.visitors[0].days).toBe(1);
	});
	it('serializes different first visits into one session and prevents two timer owners', async () => {
		const f = await fixture(),
			v = actor(),
			i = input(f.deck.id),
			j = input(f.deck.id);
		const [a, b] = await Promise.all([beginRecallStudy(v, i), beginRecallStudy(v, j)]);
		expect(a.sessionId).toBe(b.sessionId);
		expect(Number(a.leaseGranted) + Number(b.leaseGranted)).toBe(1);
		await beat(v, a, i, 0, { interactions: 1 });
		await beat(v, b, j, 0, { interactions: 1 });
		advance(60);
		await Promise.all([beat(v, a, i, 1, { seconds: 60 }), beat(v, b, j, 1, { seconds: 60 })]);
		expect((await report(f.course.id)).totals.seconds).toBe(60);
	});
	it('counts opens without engagement and excludes them from study metrics', async () => {
		const f = await fixture(),
			v = actor();
		await beginRecallStudy(v, input(f.deck.id));
		expect((await report(f.course.id)).totals).toMatchObject({
			opens: 1,
			visitors: 1,
			learners: 0,
			sessions: 0,
			seconds: 0,
		});
	});
	it('rejects foreign ownership, sequence gaps, expired sessions and private content', async () => {
		const f = await fixture(),
			v = actor(),
			i = input(f.deck.id),
			a = await beginRecallStudy(v, i);
		await expect(beat(actor(), a, i, 0)).rejects.toMatchObject({ status: 403 });
		await expect(beat(v, a, i, 2)).rejects.toMatchObject({ status: 409 });
		advance(1800);
		await expect(beat(v, a, i, 0)).rejects.toMatchObject({ status: 409 });
		const b = await beginRecallStudy(v, input(f.deck.id));
		expect(b.sessionId).not.toBe(a.sessionId);
		await prisma.activeRecallDeck.update({ where: { id: f.deck.id }, data: { status: 'DRAFT' } });
		await expect(beginRecallStudy(v, input(f.deck.id))).rejects.toMatchObject({ status: 404 });
	});
	it('idle heartbeats do not postpone session expiry or manufacture time', async () => {
		const f = await fixture(),
			v = actor(),
			i = input(f.deck.id),
			a = await beginRecallStudy(v, i);
		await beat(v, a, i, 0, { interactions: 1 });
		advance(60);
		await beat(v, a, i, 1, { seconds: 75, activityAgeSeconds: 60 });
		advance(60);
		await beat(v, a, i, 2, {
			seconds: 75,
			active: false,
			activityAgeSeconds: 120,
			releaseLease: true,
		});
		advance(1680);
		await expect(
			beat(v, a, i, 3, { active: false, activityAgeSeconds: 1800 }),
		).rejects.toMatchObject({ status: 409 });
		expect((await report(f.course.id)).totals.seconds).toBe(120);
	});
	it('splits midnight time and counts returning browsers without splitting the session', async () => {
		vi.setSystemTime(new Date('2026-10-02T16:59:40Z'));
		now = new Date('2026-10-02T16:59:40Z');
		const f = await fixture(),
			v = actor(),
			i = input(f.deck.id),
			a = await beginRecallStudy(v, i);
		await beat(v, a, i, 0, { interactions: 1 });
		advance(60);
		await beat(v, a, i, 1, { seconds: 60, interactions: 1 });
		const r = await report(f.course.id, { start: '2026-10-02' });
		expect(r.totals.sessions).toBe(1);
		expect(r.daily.map((x) => x.sessions)).toEqual([1, 1]);
		expect(r.daily.map((x) => x.seconds)).toEqual([20, 40]);
		expect((await report(f.course.id)).totals.returning).toBe(1);
	});
	it('attributes class links separately and retains history after deleting content', async () => {
		const f = await fixture(),
			v = actor();
		const cls = await prisma.teachingClass.create({
			data: {
				courseId: f.course.id,
				courseCode: f.course.courseCode,
				courseName: f.course.courseName,
				groupNo: '1',
				classCode: '1',
				term: 'Test',
				publicSlug: randomUUID(),
				publicTitle: 'Test class',
				attendanceVisible: true,
				recallDecks: { create: { deckId: f.deck.id } },
			},
		});
		const i = { ...input(f.deck.id), classSlug: cls.publicSlug! },
			a = await beginRecallStudy(v, i);
		await beat(v, a, i, 0, { interactions: 1 });
		expect((await report(f.course.id, { class: 'direct' })).totals.opens).toBe(0);
		expect((await report(f.course.id, { class: cls.id })).totals.opens).toBe(1);
		await prisma.teachingClassRecallDeck.update({
			where: { classId_deckId: { classId: cls.id, deckId: f.deck.id } },
			data: { enabled: false },
		});
		await expect(beat(v, a, i, 1)).rejects.toMatchObject({ status: 404 });
		await prisma.activeRecallDeck.delete({ where: { id: f.deck.id } });
		const r = await report(f.course.id);
		expect(r.decks[0].title).toBe('Deck A');
		const history = await report(f.course.id, { visitor: r.visitors[0].publicId });
		expect(history.history[0].classes).toEqual(['Test class']);
	});
	it('paginates browsers and history while retaining totals and enforces admin service access', async () => {
		const f = await fixture();
		for (let n = 0; n < 26; n++) await beginRecallStudy(actor(), input(f.deck.id));
		const first = await report(f.course.id),
			second = await report(f.course.id, { page: '2' });
		expect(first.visitors).toHaveLength(25);
		expect(second.visitors).toHaveLength(1);
		expect(first.visitorCount).toBe(26);
		expect(second.totals.visitors).toBe(26);
		expect((await report(f.course.id, { start: '2026-10-01' })).daily).toHaveLength(3);
		authState.admin = false;
		await expect(report(f.course.id)).rejects.toMatchObject({ status: 403 });
	});
});

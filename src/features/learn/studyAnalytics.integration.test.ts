import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import User from '@/models/User';
import { getLearnStudyLearnerReport } from './studyLearnerReport';
import { beginLearnStudy, getLearnStudyReport, heartbeatLearnStudy } from './studyAnalytics';

describe('course study analytics with PostgreSQL', () => {
	const courseIds: string[] = [];
	const userIds: string[] = [];
	let clock: Date;
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		clock = new Date('2026-09-26T10:00:00Z');
		vi.setSystemTime(clock);
	});
	afterEach(async () => {
		vi.useRealTimers();
		await prisma.learnStudyLease.deleteMany({ where: { userId: { in: userIds.splice(0) } } });
		await prisma.learnCourse.deleteMany({ where: { id: { in: courseIds.splice(0) } } });
	});
	async function fixture(label: string) {
		const course = await prisma.learnCourse.create({
			data: {
				slug: 'analytics-test-' + label + '-' + randomUUID(),
				title: label,
				status: 'PUBLISHED',
				lessons: { create: { title: 'Lesson', sections: { create: { title: 'Reading' } } } },
			},
			include: { lessons: { include: { sections: true } } },
		});
		courseIds.push(course.id);
		return { course, sectionId: course.lessons[0].sections[0].id };
	}
	async function visit(courseSlug: string, userId = 'analytics-user-' + randomUUID()) {
		userIds.push(userId);
		const input = {
			userId,
			courseSlug,
			sessionId: randomUUID(),
			clientId: randomUUID(),
			claimLease: true,
		};
		const result = await beginLearnStudy(input);
		return { ...input, ...result };
	}
	function advance(seconds: number) {
		clock = new Date(clock.getTime() + seconds * 1000);
		vi.setSystemTime(clock);
	}
	function beat(
		session: Awaited<ReturnType<typeof visit>>,
		sectionId: string | null,
		sequence = 0,
		seconds = 60,
	) {
		return heartbeatLearnStudy({
			...session,
			sectionId,
			sequence,
			seconds,
			active: true,
			releaseLease: false,
		});
	}

	it('isolates HRM and ITM totals and counts visits with no study time', async () => {
		const hrm = await fixture('HRM');
		const itm = await fixture('ITM');
		const a = await visit(hrm.course.slug);
		const b = await visit(itm.course.slug);
		await visit(hrm.course.slug);
		advance(60);
		await beat(a, hrm.sectionId);
		await beat(b, itm.sectionId, 0, 30);
		const h = await getLearnStudyReport(hrm.course.slug, 7);
		const i = await getLearnStudyReport(itm.course.slug, 7);
		expect(h.totals).toMatchObject({ visitors: 2, visits: 2, activeLearners: 1, totalSeconds: 60 });
		expect(i.totals).toMatchObject({ visitors: 1, activeLearners: 1, totalSeconds: 30 });
		expect(h.sections.map((s) => s.sectionId)).toEqual([hrm.sectionId]);
		expect(i.sections.map((s) => s.sectionId)).toEqual([itm.sectionId]);
	});
	it('resolves learner identity and current completion from the correct course', async () => {
		const f = await fixture('ITM');
		const user = await User.create({
			name: 'Analytics learner',
			email: 'analytics@example.test',
			role: 'student',
		});
		const s = await visit(f.course.slug, String(user._id));
		advance(60);
		await beat(s, f.sectionId);
		await prisma.learnSectionProgress.create({
			data: {
				userId: String(user._id),
				courseId: f.course.id,
				sectionId: f.sectionId,
				completedAt: clock,
			},
		});
		const r = await getLearnStudyReport(f.course.slug, 7);
		expect(await getLearnStudyLearnerReport(f.course.slug, 7, String(user._id))).toMatchObject({
			name: 'Analytics learner',
			email: 'analytics@example.test',
			totalSeconds: 60,
		});
		expect(r.learners[0]).toMatchObject({
			name: 'Analytics learner',
			email: 'analytics@example.test',
			seconds: 60,
			completedSections: 1,
			sectionCount: 1,
		});
	});
	it('paginates every learner while preserving whole-course totals', async () => {
		const f = await fixture('ITM');
		await prisma.learnStudySession.createMany({
			data: Array.from({ length: 51 }, (_, i) => ({
				id: randomUUID(),
				userId: 'page-learner-' + i,
				courseId: f.course.id,
				startedAt: clock,
				lastActivityAt: clock,
			})),
		});
		const first = await getLearnStudyReport(f.course.slug, 7, 1);
		const second = await getLearnStudyReport(f.course.slug, 7, 2);
		expect(first.learners).toHaveLength(50);
		expect(second.learners).toHaveLength(1);
		expect(first.totalPages).toBe(2);
		expect(second.totals.visitors).toBe(51);
		expect(new Set([...first.learners, ...second.learners].map((s) => s.userId)).size).toBe(51);
	});
	it('starts a fresh session after thirty minutes without activity', async () => {
		const f = await fixture('HRM');
		const s = await visit(f.course.slug);
		advance(31 * 60);
		const next = await beginLearnStudy(s);
		expect(next.sessionId).not.toBe(s.sessionId);
		expect(next.leaseGranted).toBe(true);
		expect(
			(await prisma.learnStudySession.findUniqueOrThrow({ where: { id: s.sessionId } })).endedAt,
		).not.toBeNull();
	});
	it('counts simultaneous retries only once and caps time to elapsed server time', async () => {
		const f = await fixture('HRM');
		const s = await visit(f.course.slug);
		advance(30);
		await Promise.all([beat(s, f.sectionId), beat(s, f.sectionId)]);
		expect((await getLearnStudyReport(f.course.slug, 7)).totals.totalSeconds).toBe(30);
		advance(10);
		await beat(s, f.sectionId, 1, 75);
		expect((await getLearnStudyReport(f.course.slug, 7)).totals.totalSeconds).toBe(40);
	});
	it('blocks another tab even if sessionStorage copied the session id', async () => {
		const f = await fixture('HRM');
		const s = await visit(f.course.slug);
		const other = { ...s, clientId: randomUUID() };
		expect((await beginLearnStudy(other)).leaseGranted).toBe(false);
		advance(60);
		expect((await beat(other, f.sectionId)).accepted).toBe(false);
		await beat(s, f.sectionId);
		expect((await getLearnStudyReport(f.course.slug, 7)).totals.totalSeconds).toBe(60);
	});
	it('does not claim a timer for a background visit and allows handover after release', async () => {
		const f = await fixture('HRM');
		const s = await visit(f.course.slug);
		const other = { ...s, sessionId: randomUUID(), clientId: randomUUID(), claimLease: false };
		expect((await beginLearnStudy(other)).leaseGranted).toBe(false);
		advance(30);
		await heartbeatLearnStudy({
			...s,
			sequence: 0,
			seconds: 30,
			sectionId: f.sectionId,
			active: false,
			releaseLease: true,
		});
		expect((await beginLearnStudy({ ...other, claimLease: true })).leaseGranted).toBe(true);
		advance(30);
		await beat(other, f.sectionId, 0, 30);
		expect((await getLearnStudyReport(f.course.slug, 7)).totals).toMatchObject({
			visitors: 1,
			visits: 2,
			totalSeconds: 60,
		});
	});
	it('rejects another account and a section from a different course', async () => {
		const f = await fixture('HRM');
		const other = await fixture('ITM');
		const s = await visit(f.course.slug);
		await expect(beginLearnStudy({ ...s, userId: 'someone-else' })).rejects.toThrow(
			'Phiên học không hợp lệ',
		);
		advance(60);
		await expect(beat(s, other.sectionId)).rejects.toThrow('Mục học không thuộc khóa học này');
		expect((await getLearnStudyReport(f.course.slug, 7)).totals.totalSeconds).toBe(0);
	});
	it('splits midnight in Vietnam and includes a continuing session in the new day visitor count', async () => {
		clock = new Date('2026-09-26T16:59:30Z');
		vi.setSystemTime(clock);
		const f = await fixture('HRM');
		const s = await visit(f.course.slug);
		advance(60);
		await beat(s, f.sectionId);
		const today = await getLearnStudyReport(f.course.slug, 1);
		expect(today.totals).toMatchObject({
			visitors: 1,
			visits: 1,
			activeLearners: 1,
			totalSeconds: 30,
		});
		expect(today.daily).toEqual([
			{ day: '2026-09-27', seconds: 30, learners: 1, sessions: 1, averageSeconds: 30 },
		]);
		expect((await getLearnStudyReport(f.course.slug, 7)).totals.totalSeconds).toBe(60);
	});

	it('keeps daily learner/session counts distinct when a session studies multiple sections', async () => {
		const f = await fixture('ITM');
		const secondSection = await prisma.learnSection.create({
			data: { title: 'Second section', lessonId: f.course.lessons[0].id },
		});
		const s = await visit(f.course.slug);
		advance(60);
		await beat(s, f.sectionId);
		advance(60);
		await beat(s, secondSection.id, 1);
		const r = await getLearnStudyReport(f.course.slug, 7);
		expect(r.daily).toHaveLength(7);
		expect(r.daily.slice(0, 6).every((day) => day.seconds === 0 && day.sessions === 0)).toBe(true);
		expect(r.daily[6]).toMatchObject({
			seconds: 120,
			learners: 1,
			sessions: 1,
			averageSeconds: 120,
		});
	});
	it('filters learner history by course, account and Vietnam day while keeping full session timestamps', async () => {
		clock = new Date('2026-09-26T16:59:30Z');
		vi.setSystemTime(clock);
		const f = await fixture('ITM');
		const other = await fixture('HRM');
		const s = await visit(f.course.slug);
		const anotherUser = await visit(f.course.slug);
		const otherCourse = await visit(other.course.slug, s.userId);
		advance(60);
		await beat(s, f.sectionId);
		await beat(anotherUser, f.sectionId);
		const r = await getLearnStudyLearnerReport(f.course.slug, 1, s.userId);
		expect(r).toMatchObject({
			totalSeconds: 30,
			activeDays: 1,
			sessionCount: 1,
			averageSecondsPerActiveDay: 30,
		});
		expect(r?.daily).toHaveLength(1);
		expect(r?.daily[0]).toMatchObject({
			day: '2026-09-27',
			seconds: 30,
			sessions: 1,
			sectionCount: 1,
		});
		expect(r?.daily[0].sections).toEqual([
			{ sectionId: f.sectionId, title: 'Reading', seconds: 30 },
		]);
		expect(r?.sessions[0]).toMatchObject({
			startedAt: '2026-09-26T16:59:30.000Z',
			lastActivityAt: clock.toISOString(),
			seconds: 30,
		});
		expect(await getLearnStudyLearnerReport(other.course.slug, 1, otherCourse.userId)).toBeNull();
		await visit(other.course.slug, s.userId);
		expect((await getLearnStudyLearnerReport(other.course.slug, 1, s.userId))?.totalSeconds).toBe(
			0,
		);
		expect(await getLearnStudyLearnerReport(other.course.slug, 1, anotherUser.userId)).toBeNull();
		expect(await getLearnStudyLearnerReport(f.course.slug, 1, 'missing')).toBeNull();
	});
	it('paginates session history without changing learner totals and includes overview-only visits', async () => {
		const f = await fixture('ITM');
		const s = await visit(f.course.slug);
		advance(60);
		await beat(s, f.sectionId);
		await prisma.learnStudySession.createMany({
			data: Array.from({ length: 20 }, () => ({
				id: randomUUID(),
				userId: s.userId,
				courseId: f.course.id,
				startedAt: clock,
				lastActivityAt: clock,
			})),
		});
		const first = await getLearnStudyLearnerReport(f.course.slug, 7, s.userId);
		const last = await getLearnStudyLearnerReport(f.course.slug, 7, s.userId, 999);
		expect(first?.sessions).toHaveLength(20);
		expect(last?.sessions).toHaveLength(1);
		expect(last).toMatchObject({
			page: 2,
			totalPages: 2,
			sessionCount: 21,
			totalSeconds: 60,
			activeDays: 1,
		});
		expect(first?.sessions.every((session) => session.seconds === 0)).toBe(true);
		const overview = await visit(f.course.slug);
		expect(await getLearnStudyLearnerReport(f.course.slug, 7, overview.userId)).toMatchObject({
			totalSeconds: 0,
			activeDays: 0,
			sessionCount: 1,
		});
	});
	it('keeps renamed section totals together and retains history after a section is removed', async () => {
		const f = await fixture('HRM');
		const a = await visit(f.course.slug);
		advance(60);
		await beat(a, f.sectionId);
		await prisma.learnSection.update({ where: { id: f.sectionId }, data: { title: 'Renamed' } });
		const b = await visit(f.course.slug);
		advance(60);
		await beat(b, f.sectionId);
		const r = await getLearnStudyReport(f.course.slug, 7);
		expect(r.sections).toHaveLength(1);
		expect(r.sections[0]).toMatchObject({ title: 'Renamed', seconds: 120, learners: 2 });
		expect(
			(await getLearnStudyLearnerReport(f.course.slug, 7, a.userId))?.daily.at(-1)?.sections[0],
		).toMatchObject({ title: 'Renamed', seconds: 60 });
		await prisma.learnSection.delete({ where: { id: f.sectionId } });
		expect(
			(await getLearnStudyLearnerReport(f.course.slug, 7, a.userId))?.daily.at(-1)?.sections[0],
		).toMatchObject({ title: 'Reading', seconds: 60 });
		expect((await getLearnStudyReport(f.course.slug, 7)).sections).toHaveLength(1);
	});
});

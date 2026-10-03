import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { addAdminSession } from './helpers/adminSession';
import pg from 'pg';

test('anonymous Recall study, return visit, admin report and mobile history', async ({
	browser,
	baseURL,
}) => {
	test.setTimeout(90_000);
	const responseTimeout = { timeout: 15_000 };
	if (!baseURL || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname))
		throw new Error('Recall analytics E2E requires a local test app.');
	const admin = await browser.newContext({ baseURL });
	const guest = await browser.newContext({ baseURL });
	await addAdminSession(admin);
	const adminPage = await admin.newPage();
	const page = await guest.newPage();
	const suffix = randomUUID().slice(0, 8);
	let courseId = '',
		deckId = '',
		classId = '';
	try {
		const courseResponse = await admin.request.post('/api/admin/teaching/courses', {
			data: { courseCode: `RECALL${suffix}`, courseName: `Recall analytics ${suffix}` },
		});
		expect(courseResponse.ok()).toBeTruthy();
		courseId = (await courseResponse.json()).data.id;
		const deckResponse = await admin.request.post('/api/admin/active-recall', {
			data: {
				courseId,
				title: `Recall ${suffix}`,
				slug: `recall-${suffix}`,
				status: 'DRAFT',
				cards: [
					{ question: 'First question', answer: 'First answer' },
					{ question: 'Second question', answer: 'Second answer' },
				],
			},
		});
		expect(deckResponse.ok(), await deckResponse.text()).toBeTruthy();
		const deck = (await deckResponse.json()).data;
		deckId = deck.id;
		const publishDeck = await admin.request.patch(`/api/admin/active-recall/${deckId}`, {
			data: { status: 'PUBLISHED', expectedUpdatedAt: deck.updatedAt },
		});
		expect(publishDeck.ok(), await publishDeck.text()).toBeTruthy();
		const clsResponse = await admin.request.post('/api/admin/teaching/classes', {
			data: { courseId, groupNo: '1', term: 'Recall analytics E2E' },
		});
		expect(clsResponse.ok()).toBeTruthy();
		const cls = (await clsResponse.json()).data;
		classId = cls.id;
		const published = await admin.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
			data: {
				publicSlug: `recall-class-${suffix}`,
				publicTitle: 'Recall test class',
				publicSummary: '',
				publicDescription: '',
				publicAnnouncement: '',
				links: [],
			},
		});
		expect(published.ok(), await published.text()).toBeTruthy();
		const shared = await admin.request.patch(`/api/admin/teaching/classes/${classId}/share`, {
			data: { shared: true },
		});
		expect(shared.ok(), await shared.text()).toBeTruthy();
		const assigned = await admin.request.put(`/api/admin/teaching/classes/${classId}/recall`, {
			data: { assignments: [{ deckId, enabled: true }] },
		});
		expect(assigned.ok()).toBeTruthy();
		const began = page.waitForResponse(
			(r) => r.url().endsWith('/api/active-recall/study/begin') && r.request().method() === 'POST',
			responseTimeout,
		);
		await page.goto(`/my-space/active-recall/${deck.slug}`);
		expect((await began).ok()).toBeTruthy();
		await page.bringToFront();
		const engaged = page.waitForResponse(
			(r) =>
				r.url().endsWith('/api/active-recall/study/heartbeat') && r.request().method() === 'POST',
			responseTimeout,
		);
		await page.getByRole('button', { name: 'Hiện đáp án', exact: true }).click();
		expect((await engaged).ok()).toBeTruthy();
		await expect(page.getByText('First answer', { exact: true })).toBeVisible();
		const cookie = (await guest.cookies()).find((c) => c.name === 'recall_visitor');
		expect(cookie?.httpOnly).toBe(true);
		await page.waitForTimeout(2100);
		await page.reload();
		await expect(
			page.getByRole('heading', { name: `Recall ${suffix}`, exact: true }),
		).toBeVisible();
		expect((await guest.cookies()).find((c) => c.name === 'recall_visitor')?.value).toBe(
			cookie?.value,
		);
		await page.goto(`/lop/recall-class-${suffix}/active-recall/${deck.slug}`);
		await page.bringToFront();
		const classBeat = page.waitForResponse(
			(r) =>
				r.url().endsWith('/api/active-recall/study/heartbeat') && r.request().method() === 'POST',
			responseTimeout,
		);
		await page.getByRole('button', { name: 'Tiếp →' }).click();
		expect((await classBeat).ok()).toBeTruthy();
		const reportUrl = `/api/admin/active-recall/analytics?course=${courseId}`;
		await expect
			.poll(async () => (await (await admin.request.get(reportUrl)).json()).data.totals.learners)
			.toBe(1);
		const report = (await (await admin.request.get(reportUrl)).json()).data;
		expect(report.totals.sessions).toBe(1);
		expect(report.totals.visitors).toBe(1);
		const classReport = (await (await admin.request.get(`${reportUrl}&class=${classId}`)).json())
			.data;
		expect(classReport.totals.learners).toBe(1);
		expect(report.totals.seconds).toBeGreaterThanOrEqual(1);
		expect(report.totals.opens).toBeGreaterThanOrEqual(3);
		expect((await guest.request.get(reportUrl)).status()).toBe(401);
		await page.goto('/my-space/teaching/recall-analytics');
		await expect(page).toHaveURL(/dang-nhap/);
		await adminPage.goto(`/my-space/teaching/recall-analytics?course=${courseId}`);
		await expect(
			adminPage.getByRole('heading', { name: 'Thống kê Active Recall', exact: true }),
		).toBeVisible();
		await adminPage.getByRole('link', { name: /^Khách / }).click();
		await expect(adminPage.getByRole('heading', { name: /^Lịch sử Khách / })).toBeVisible();
		await adminPage.screenshot({
			path: '/tmp/recall-analytics-desktop.png',
			fullPage: true,
		});
		await adminPage.setViewportSize({ width: 390, height: 844 });
		await expect(adminPage.getByLabel('Môn học')).toBeVisible();
		expect(
			await adminPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
		).toBe(true);
		await adminPage.screenshot({
			path: '/tmp/recall-analytics-mobile.png',
			fullPage: true,
		});
		const excluded = adminPage.waitForResponse((r) =>
			r.url().endsWith('/api/active-recall/study/begin'),
		);
		await adminPage.goto(`/my-space/active-recall/${deck.slug}`);
		expect((await (await excluded).json()).data.excluded).toBe(true);
	} finally {
		await guest.close().catch(() => {});
		// Published content is intentionally protected from destructive admin deletion.
		// Remove only this fixture, and only in an explicitly local test database.
		if (courseId) {
			const connectionString = process.env.TEST_DATABASE_URL;
			const url = new URL(connectionString || '');
			if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.includes('test'))
				throw new Error('Fixture cleanup requires a local test database.');
			const db = new pg.Client({ connectionString });
			await db.connect();
			try {
				await db.query('BEGIN');
				await db.query(
					'DELETE FROM "RecallVisitor" WHERE id IN (SELECT s."visitorId" FROM "RecallStudySession" s JOIN "RecallStudyVisit" v ON v."sessionId"=s.id WHERE v."courseId"=$1)',
					[courseId],
				);
				await db.query('DELETE FROM "TeachingClass" WHERE "courseId"=$1', [courseId]);
				await db.query('DELETE FROM "ActiveRecallDeck" WHERE "courseId"=$1', [courseId]);
				await db.query('DELETE FROM "TeachingCourse" WHERE id=$1', [courseId]);
				await db.query('COMMIT');
			} finally {
				await db.end();
			}
		}
		await admin.close().catch(() => {});
	}
});

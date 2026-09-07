import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

test.describe('Learning Experience multi-device access', () => {
	test('keeps independent sessions when the same network logs in concurrently', async ({
		browser,
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
		const slug = `e2e-learning-devices-${suffix}`;
		const protectedName = `Protected ${suffix}`;
		const openName = `Open ${suffix}`;

		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `DEV${suffix}`.slice(0, 10),
				courseName: 'Learning Experience Multi-device E2E',
				groupNo: '97',
				term: `E2E DEVICES ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;

		try {
			const publicPage = await page.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
				data: {
					publicSlug: slug,
					publicTitle: 'Learning Experience Multi-device E2E',
					publicSummary: '',
					publicDescription: '',
					publicAnnouncement: '',
					links: [],
				},
			});
			expect(publicPage.ok()).toBe(true);
			const shared = await page.request.patch(`/api/admin/teaching/classes/${classId}/share`, {
				data: { shared: true },
			});
			expect(shared.ok()).toBe(true);

			const protectedEnrollment = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `26${suffix}`.slice(-10),
						familyName: 'E2E',
						givenName: protectedName,
						dateOfBirth: '2006-05-09',
					},
				},
			);
			expect(protectedEnrollment.ok()).toBe(true);
			const protectedEnrollmentId = (
				(await protectedEnrollment.json()) as { data: { enrollmentId: string } }
			).data.enrollmentId;

			const openEnrollment = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `27${suffix}`.slice(-10),
						familyName: 'E2E',
						givenName: openName,
						dateOfBirth: null,
					},
				},
			);
			expect(openEnrollment.ok()).toBe(true);
			const openEnrollmentId = ((await openEnrollment.json()) as { data: { enrollmentId: string } })
				.data.enrollmentId;

			const learnerContexts = await Promise.all([
				browser.newContext(),
				browser.newContext(),
				browser.newContext(),
			]);
			const learnerPages = await Promise.all(
				learnerContexts.map((learnerContext) => learnerContext.newPage()),
			);
			const endpoint = `/api/teaching/classes/${slug}/learning-experience`;
			const loginFromDevice = (
				learnerPage: (typeof learnerPages)[number],
				body: { enrollmentId: string; password?: string },
			) =>
				learnerPage.evaluate(
					async ({ endpoint, body }) => {
						const response = await fetch(endpoint, {
							method: 'POST',
							headers: { 'content-type': 'application/json' },
							body: JSON.stringify(body),
						});
						return { status: response.status, body: await response.json() };
					},
					{ endpoint, body },
				);

			try {
				await Promise.all(
					learnerPages.map((learnerPage) => learnerPage.goto(`/lop/${slug}?tab=learning`)),
				);

				const rejected = await loginFromDevice(learnerPages[0]!, {
					enrollmentId: protectedEnrollmentId,
					password: '08052006',
				});
				expect(rejected.status).toBe(401);

				const results = await Promise.all([
					loginFromDevice(learnerPages[0]!, {
						enrollmentId: protectedEnrollmentId,
						password: '09052006',
					}),
					loginFromDevice(learnerPages[1]!, {
						enrollmentId: protectedEnrollmentId,
						password: '09052006',
					}),
					loginFromDevice(learnerPages[2]!, { enrollmentId: openEnrollmentId }),
				]);
				expect(results.map((result) => result.status)).toEqual([200, 200, 200]);

				await Promise.all(learnerPages.map((learnerPage) => learnerPage.reload()));
				for (const learnerPage of learnerPages) {
					await expect(
						learnerPage.getByRole('heading', { name: 'Choose your learning style' }),
					).toBeVisible();
				}
			} finally {
				await Promise.all(learnerContexts.map((learnerContext) => learnerContext.close()));
			}
		} finally {
			await context.clearCookies();
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});
});

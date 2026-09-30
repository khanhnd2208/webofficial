import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

test.describe('Teaching admin workspace', () => {
	test('creates a course, empty class, then a recall deck with cards', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const courseCode = `E2E${suffix}`.slice(0, 10).toUpperCase();
		const courseName = `E2E Course ${suffix}`;
		const term = `E2E ${suffix}`;

		await page.goto('/my-space/teaching');
		await page.getByRole('button', { name: 'Thêm môn' }).click();
		await page.getByLabel('Mã môn').fill(courseCode);
		await page.getByLabel('Tên môn').fill(courseName);
		await page.getByRole('button', { name: 'Lưu' }).click();
		await expect(page.getByText(courseCode)).toBeVisible();

		const courses = await page.request.get('/api/admin/teaching/courses');
		expect(courses.ok()).toBe(true);
		const course = (
			(await courses.json()) as { data: Array<{ id: string; courseCode: string }> }
		).data.find((item) => item.courseCode === courseCode);
		expect(course).toBeTruthy();
		const courseId = course!.id;

		try {
			await page.getByRole('button', { name: `Thao tác môn ${courseCode}` }).click();
			await page.getByRole('menuitem', { name: 'Sửa' }).click();
			await expect(page.getByRole('heading', { name: 'Sửa môn học' })).toBeVisible();
			await page.getByRole('button', { name: 'Huỷ' }).click();

			await page.goto(`/my-space/teaching/courses/${courseId}`);
			await page.getByRole('link', { name: 'Tạo lớp', exact: true }).click();
			await expect(page.getByLabel('Môn học')).toBeDisabled();
			await page.getByPlaceholder('39-01').fill('e2e-01');
			await page.getByPlaceholder('HỌC KỲ 1 - NĂM HỌC 2026 - 2027').fill(term);
			await page.getByRole('button', { name: 'Tạo lớp trống' }).click();
			await expect(page).toHaveURL(new RegExp(`/my-space/teaching/.+\\?tab=students`));
			await expect(page.getByRole('heading', { name: 'Danh sách sinh viên' })).toBeVisible({
				timeout: 15_000,
			});

			const classes = await page.request.get('/api/admin/teaching/classes');
			const teachingClass = (
				(await classes.json()) as {
					data: Array<{
						id: string;
						courseId: string;
						groupNo: string;
						totalWeeks: number;
						term: string;
					}>;
				}
			).data.find((item) => item.courseId === courseId && item.groupNo === 'E2E-01');
			expect(teachingClass).toMatchObject({ groupNo: 'E2E-01', totalWeeks: 10, term });

			await page.request.patch(`/api/admin/teaching/classes/${teachingClass!.id}`, {
				data: { groupNo: 'E2E-02', term, status: 'ACTIVE' },
			});
			await page.goto(`/my-space/teaching/courses/${courseId}`);
			await expect(page.getByText('Lớp E2E-02')).toBeVisible();

			const archivedClass = await page.request.patch(
				`/api/admin/teaching/classes/${teachingClass!.id}`,
				{
					data: { status: 'ARCHIVED' },
				},
			);
			expect(archivedClass.ok()).toBe(true);
			const restoredClass = await page.request.patch(
				`/api/admin/teaching/classes/${teachingClass!.id}`,
				{
					data: { status: 'ACTIVE' },
				},
			);
			expect(restoredClass.ok()).toBe(true);

			const createdDeck = await page.request.post(
				`/api/admin/teaching/courses/${courseId}/recall`,
				{
					data: {
						title: `E2E Deck ${suffix}`,
						status: 'DRAFT',
						cards: [{ question: 'What is HRM?', answer: 'Human resource management' }],
					},
				},
			);
			expect(createdDeck.ok()).toBe(true);
			const deck = (
				(await createdDeck.json()) as {
					data: { id: string; cardCount: number; status: string; updatedAt: string };
				}
			).data;
			expect(deck.cardCount).toBe(1);
			expect(deck.status).toBe('DRAFT');

			await page.goto(`/my-space/teaching/courses/${courseId}?tab=recall`);
			await expect(page.getByText(`E2E Deck ${suffix}`)).toBeVisible();
			await expect(page.getByText('1 thẻ · Bản nháp')).toBeVisible();

			const archivedDeck = await page.request.patch(
				`/api/admin/teaching/courses/${courseId}/recall/${deck.id}`,
				{
					data: { status: 'ARCHIVED', expectedUpdatedAt: deck.updatedAt },
				},
			);
			expect(archivedDeck.ok()).toBe(true);
			const restoredDeckBody = (await archivedDeck.json()) as { data: { updatedAt: string } };
			const restoredDeck = await page.request.patch(
				`/api/admin/teaching/courses/${courseId}/recall/${deck.id}`,
				{
					data: { status: 'DRAFT', expectedUpdatedAt: restoredDeckBody.data.updatedAt },
				},
			);
			expect(restoredDeck.ok()).toBe(true);

			await page.request.patch(`/api/admin/teaching/classes/${teachingClass!.id}`, {
				data: { status: 'ARCHIVED' },
			});
			const latestDeck = ((await restoredDeck.json()) as { data: { updatedAt: string } }).data;
			await page.request.patch(`/api/admin/teaching/courses/${courseId}/recall/${deck.id}`, {
				data: { status: 'ARCHIVED', expectedUpdatedAt: latestDeck.updatedAt },
			});
			await cleanupTeachingClass(page.request, teachingClass!.id);
		} finally {
			await page.request.patch(`/api/admin/teaching/courses/${courseId}`, {
				data: { status: 'ARCHIVED' },
			});
		}
	});
});

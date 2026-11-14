import { expect, test, type APIResponse } from '@playwright/test';
import { readSheet } from 'read-excel-file/node';

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
		await page.getByLabel('Mã môn').filter({ visible: true }).fill(courseCode);
		await page.getByLabel('Tên môn').filter({ visible: true }).fill(courseName);
		await page.getByRole('button', { name: 'Lưu', exact: true }).click();
		await expect(page.getByText(courseCode).filter({ visible: true })).toBeVisible();

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
			const selectedCourse = page.getByRole('combobox', { name: /Môn học/ });
			await expect(selectedCourse).toBeDisabled();
			await expect(selectedCourse).toHaveValue(courseId);
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
			await expect(page.getByText('Lớp E2E-02').filter({ visible: true })).toBeVisible();

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
			await expect(page.getByText(`E2E Deck ${suffix}`).filter({ visible: true })).toHaveCount(1);
			await expect(page.getByText(`E2E Deck ${suffix}`).filter({ visible: true })).toBeVisible();
			await expect(page.getByText('1 thẻ · Bản nháp').filter({ visible: true })).toBeVisible();

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

test('exports the same final scores shown in the class summary', async ({
	page,
	context,
	request,
}, testInfo) => {
	await addAdminSession(context);
	const suffix = Date.now().toString(36);
	const api = page.request;
	async function data<T>(response: APIResponse): Promise<T> {
		expect(response.ok(), await response.text()).toBe(true);
		return (await response.json()).data as T;
	}

	const { id } = await data<{ id: string }>(
		await api.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `GRADE${suffix}`,
				courseName: 'Quản trị nguồn nhân lực',
				groupNo: '39-01',
				term: `HK1 2026-2027 ${suffix}`,
				totalWeeks: 2,
			},
		}),
	);
	const classApi = `/api/admin/teaching/classes/${id}`;
	const exportUrl = `${classApi}/export?mode=summary`;
	try {
		const { tutorials, sessions } = await data<{
			tutorials: { id: string; name: string }[];
			sessions: { id: string; weekNumber: number }[];
		}>(await api.get(`${classApi}/gradebook`));
		const tutorial = tutorials[0]!;
		const first = `/api/admin/teaching/sessions/${sessions[0]!.id}`;
		const cancelled = `/api/admin/teaching/sessions/${sessions[1]!.id}`;
		const code = `0${Date.now()}`;
		const { enrollmentId } = await data<{ enrollmentId: string }>(
			await api.post(`${classApi}/enrollments`, {
				data: {
					studentCode: code,
					familyName: 'Bùi Thị Thúy',
					givenName: 'An',
					homeClassCode: '1K-23',
					tutorialClassId: tutorial.id,
				},
			}),
		);
		const absentCode = `1${code}`;
		await data(
			await api.post(`${classApi}/enrollments`, {
				data: {
					studentCode: absentCode,
					familyName: 'Đặng Vũ Minh',
					givenName: 'Anh',
					homeClassCode: '1M-23',
					tutorialClassId: tutorial.id,
				},
			}),
		);

		await data(await api.patch(cancelled, { data: { isCancelled: true } }));
		await data(await api.patch(`${first}/attendance/lock`, { data: { action: 'open' } }));
		await data(
			await api.put(`${first}/attendance`, {
				data: { marks: [{ enrollmentId, status: 'PRESENT' }] },
			}),
		);
		await data(await api.patch(`${first}/attendance/lock`, { data: { action: 'finalize' } }));
		await data(await api.patch(`${first}/participation/lock`, { data: { action: 'open' } }));
		await data(
			await api.put(`${first}/participation`, { data: { marks: [{ enrollmentId, points: 2 }] } }),
		);
		await data(await api.patch(`${first}/participation/lock`, { data: { action: 'park' } }));

		expect((await request.get(exportUrl)).status()).toBe(401);
		expect((await api.get(exportUrl)).status()).toBe(409);
		await page.goto(`/my-space/teaching/${id}`);
		await page.getByRole('link', { name: 'Tổng kết', exact: true }).click();
		await expect(page.getByRole('heading', { name: 'Chưa thể xuất bảng tổng kết' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Chốt điểm danh' })).toHaveCount(0);
		await expect(page.getByRole('link', { name: 'Chốt CP' })).toHaveCount(1);
		await expect(page.getByRole('button', { name: 'Tải Excel (.xlsx)' })).toHaveCount(0);

		await data(await api.patch(`${first}/participation/lock`, { data: { action: 'finalize' } }));
		await page.reload();
		const table = page.getByRole('table');
		const headers = [
			'TT',
			'MSSV',
			'Name',
			'Class',
			'Tut',
			'Eligible for exam',
			'Attendance (5%)',
			'Contribution (5%)',
			'Total',
		];
		await expect(table.getByRole('columnheader')).toHaveText(headers);
		await expect(
			table.getByRole('row').filter({ hasText: 'Bùi Thị Thúy An' }).getByRole('cell'),
		).toHaveText([
			'1',
			code,
			'Bùi Thị Thúy An',
			'1K-23',
			tutorial.name,
			'Yes',
			'5,00',
			'2,00',
			'7,00',
		]);

		if (process.env.TEACHING_GRADE_SUMMARY_SCREENSHOTS) {
			const directory = process.env.TEACHING_GRADE_SUMMARY_SCREENSHOTS;
			await page.screenshot({ path: `${directory}/grade-summary.png`, fullPage: true });
			await page.setViewportSize({ width: 390, height: 844 });
			await page.screenshot({ path: `${directory}/grade-summary-mobile.png`, fullPage: true });
			await page.setViewportSize({ width: 1280, height: 720 });
		}

		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Tải Excel (.xlsx)' }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toMatch(/_tong-ket\.xlsx$/);
		const filename = testInfo.outputPath('grade-summary.xlsx');
		await download.saveAs(filename);
		expect(await readSheet(filename)).toEqual([
			headers,
			[1, code, 'Bùi Thị Thúy An', '1K-23', tutorial.name, 'Yes', 5, 2, 7],
			[2, absentCode, 'Đặng Vũ Minh Anh', '1M-23', tutorial.name, 'No', 4.5, 0, 4.5],
		]);

		await data(await api.patch(`${first}/attendance/lock`, { data: { action: 'unfinalize' } }));
		expect((await api.get(exportUrl)).status()).toBe(409);
		await page.getByRole('button', { name: 'Tải Excel (.xlsx)' }).click();
		await expect(page.getByRole('heading', { name: 'Chưa thể xuất bảng tổng kết' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Chốt điểm danh' })).toHaveCount(1);
	} finally {
		await cleanupTeachingClass(api, id);
	}
});

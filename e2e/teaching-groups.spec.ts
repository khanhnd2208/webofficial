import { expect, test, type APIResponse } from '@playwright/test';
import { addAdminSession, addStudentSession } from './helpers/adminSession';

async function data<T>(response: APIResponse): Promise<T> {
	expect(response.ok(), await response.text()).toBeTruthy();
	return (await response.json()).data as T;
}

test.describe('Teaching group list UX', () => {
	test.skip(
		process.env.TEACHING_GROUP_BOARD_ENABLED !== 'true',
		'Group feature must be enabled on the test server',
	);
	test('admin assigns by code; tutorials, mobile and student permissions stay consistent', async ({
		page,
		context,
		browser,
	}) => {
		test.setTimeout(180_000);
		page.setDefaultTimeout(20_000);
		page.on('pageerror', (error) => console.log('Group page error:', error.message));
		await addAdminSession(context);
		const suffix = `${Date.now()}${test.info().workerIndex}`;
		const slug = `groups-check-${suffix}`;
		const klass = await data<{ id: string }>(
			await page.request.post('/api/admin/teaching/classes', {
				data: {
					courseCode: `G${suffix.slice(-8)}`,
					courseName: 'Group workflow fixture',
					groupNo: '01',
					term: suffix,
					totalWeeks: 4,
				},
			}),
		);
		const base = `/api/admin/teaching/classes/${klass.id}`;
		try {
			const tutorials = await data<Array<{ id: string; code: string }>>(
				await page.request.get(`${base}/tutorials`),
			);
			const t1 = tutorials[0];
			const t2 = await data<{ id: string; code: string }>(
				await page.request.post(`${base}/tutorials`, { data: { code: '02', name: 'Tutorial 2' } }),
			);
			const codes = [0, 1, 2].map((i) => `${suffix.slice(-8)}${i}7`);
			for (const [i, code] of codes.entries()) {
				await data(
					await page.request.post(`${base}/enrollments`, {
						data: {
							studentCode: code,
							familyName: 'Kiểm thử',
							givenName: ['An', 'Bình', 'Chi'][i],
							tutorialClassId: i === 2 ? t2.id : t1.id,
						},
					}),
				);
			}
			await data(
				await page.request.patch(`${base}/public`, {
					data: {
						publicSlug: slug,
						publicTitle: 'Group fixture',
						publicSummary: '',
						publicDescription: '',
						publicAnnouncement: '',
						links: [],
					},
				}),
			);
			await data(await page.request.patch(`${base}/share`, { data: { shared: true } }));
			await page.goto(`/my-space/teaching/${klass.id}?tab=groups`);
			await page.getByRole('button', { name: /Tutorial Class/ }).click();
			await page.getByRole('option', { name: new RegExp(`^${t1.code} ·`) }).click();
			await expect(page.getByRole('button', { name: 'Thiết lập nhóm' })).toBeEnabled();
			await page.getByRole('button', { name: 'Thiết lập nhóm' }).click();
			await page.getByLabel('Số nhóm', { exact: true }).fill('2');
			await page.getByLabel('Sức chứa mặc định mỗi nhóm').fill('2');
			await page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }).click();
			const g1 = page
				.locator('.group-list-section')
				.filter({ has: page.getByRole('heading', { name: /^Nhóm 1 ·/ }) });
			const g2 = page
				.locator('.group-list-section')
				.filter({ has: page.getByRole('heading', { name: /^Nhóm 2 ·/ }) });
			await g1.getByRole('button', { name: 'Thêm sinh viên' }).click();
			await page.getByRole('button', { name: /dán nhiều mã cùng lúc/ }).click();
			await page.getByRole('textbox', { name: /Mã sinh viên/ }).fill(`${codes[0]}\n${codes[2]}`);
			await page.getByRole('button', { name: 'Kiểm tra mã' }).click();
			await expect(page.getByText(/không thuộc tutorial đang chọn/)).toBeVisible();
			await expect(
				page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }),
			).toBeDisabled();
			await page.getByRole('textbox', { name: /Mã sinh viên/ }).fill(`${codes[0]}\n${codes[1]}`);
			await page.getByRole('button', { name: 'Kiểm tra mã' }).click();
			await expect(page.getByText('2 mã hợp lệ · còn 2 chỗ')).toBeVisible();
			await page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }).click();
			await expect(g1.getByRole('heading')).toHaveText('Nhóm 1 · 2/2 sinh viên');
			await page.getByRole('searchbox').fill('Bình');
			await expect(g1.getByRole('heading')).toHaveText('Nhóm 1 · 2/2 sinh viên');
			await page.getByRole('searchbox').clear();
			await g1.getByRole('button', { name: 'Chuyển nhóm' }).first().click();
			await page
				.getByRole('dialog')
				.getByRole('button', { name: /^Nhóm 2 ·/ })
				.click();
			await expect(g2.getByText('Kiểm thử An', { exact: true })).toBeVisible();
			await g2.getByRole('button', { name: 'Bỏ khỏi nhóm' }).click();
			await expect(g2.getByRole('heading')).toHaveText('Nhóm 2 · 0/2 sinh viên');
			await g1.getByRole('button', { name: 'Sức chứa', exact: true }).click();
			await page.getByRole('dialog').getByRole('spinbutton').fill('3');
			await page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }).click();
			await expect(g1.getByRole('heading')).toHaveText('Nhóm 1 · 1/3 sinh viên');
			await page.setViewportSize({ width: 390, height: 844 });
			await expect(g1.getByText('Kiểm thử Bình', { exact: true })).toBeVisible();
			await expect(g1.getByRole('button', { name: 'Chuyển nhóm' })).toBeVisible();
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
			).toBeTruthy();
			await page.screenshot({ path: `test-results/groups-admin-mobile-${test.info().project.name}.png`, fullPage: true });
			await page.getByRole('button', { name: /Tutorial Class/ }).click();
			await page.getByRole('option', { name: /^02 ·/ }).click();
			await expect(page.getByText(/Chưa thiết lập nhóm cho tutorial này/)).toBeVisible();
			await expect(page.getByText('Kiểm thử Bình', { exact: true })).toHaveCount(0);

			const studentContext = await browser.newContext({
				baseURL: test.info().project.use.baseURL,
				viewport: { width: 390, height: 844 },
			});
			try {
				await addStudentSession(studentContext);
				const studentPage = await studentContext.newPage();
				const publicPayload = await data<{
					groups: Array<{ assignments: Array<{ studentCode: string }> }>;
					unassigned: Array<{ studentCode: string }>;
				}>(
					await studentContext.request.get(
						`/api/teaching/classes/${slug}/groups?tutorialClassId=${t1.id}`,
					),
				);
				expect(
					publicPayload.groups
						.flatMap((g) => g.assignments)
						.every((m) => m.studentCode.startsWith('*')),
				).toBeTruthy();
				expect(publicPayload.unassigned.every((m) => m.studentCode.startsWith('*'))).toBeTruthy();
				for (const action of ['move', 'claim', 'undo']) {
					expect(
						(
							await studentContext.request.post(`/api/teaching/classes/${slug}/groups/${action}`, {
								data: {},
							})
						).status(),
					).toBe(403);
				}
				for (const [route, method, body] of [
					['groups', 'PATCH', {}],
					['groups/members', 'POST', {}],
					['groups/assignments', 'PUT', {}],
					['groups/assignments', 'DELETE', {}],
					['groups/fake/capacity', 'PATCH', {}],
				] as const) {
					expect(
						(
							await studentContext.request.fetch(`${base}/${route}`, { method, data: body })
						).status(),
					).toBe(403);
				}
				await studentPage.goto(`/lop/${slug}?tab=groups`);
				await studentPage.getByRole('button', { name: /Tutorial Class/ }).click();
				await studentPage.getByRole('option', { name: new RegExp(`^${t1.code} ·`) }).click();
				await expect(studentPage.getByText('Kiểm thử Bình', { exact: true })).toBeVisible();
				await expect(studentPage.getByRole('button', { name: 'Thêm sinh viên' })).toHaveCount(0);
				await expect(studentPage.getByText(codes[1], { exact: true })).toHaveCount(0);
				await studentPage.screenshot({
					path: `test-results/groups-student-mobile-${test.info().project.name}.png`,
					fullPage: true,
				});
			} finally {
				await studentContext.close();
			}
		} finally {
			await page.request.delete(base);
		}
	});
});

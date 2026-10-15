import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

test.describe('UNRELEASED quiz', () => {
	test('an anonymous run is saved and shows up for the admin', async ({ page, browser }) => {
		await page.goto('/unreleased');
		await page.getByRole('button', { name: 'Bắt đầu' }).click();

		const choose = async (option: RegExp) => {
			await page.getByRole('radio', { name: option }).click();
			await page.getByRole('button', { name: /^(Tiếp|Xem kết quả)$/ }).click();
		};
		await choose(/Mình chưa nghĩ tới chuyện này/);
		await choose(/Mình chưa biết nên bắt đầu từ đâu/);

		const saved = page.waitForResponse(
			(response) =>
				response.url().endsWith('/api/unreleased-quiz/responses') &&
				response.request().method() === 'POST',
		);
		await choose(/Mình chưa biết việc nào đáng để kể/);
		expect((await saved).status()).toBe(201);
		await expect(page.getByRole('heading', { name: 'Chưa chọn bài', level: 2 })).toBeVisible();

		const adminContext = await browser.newContext();
		await addAdminSession(adminContext);
		const admin = await adminContext.newPage();
		await admin.goto('/admin/unreleased-quiz');
		await expect(admin.getByRole('heading', { name: 'Quiz UNRELEASED', level: 1 })).toBeVisible();
		await expect(admin.getByText('Chưa có hướng ứng tuyển:', { exact: false })).toBeVisible();
		await adminContext.close();
	});

	test('the API rejects answers that skip the branches', async ({ request }) => {
		const response = await request.post('/api/unreleased-quiz/responses', {
			data: { respondentId: 'e2e-invalid-run', answers: { q1: 'D', q2: 'A', q3: 'A', q4: 'A' } },
		});
		expect(response.status()).toBe(400);
	});
});

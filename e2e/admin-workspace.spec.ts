import { expect, test } from '@playwright/test';

import { addAdminSession, addStudentSession } from './helpers/adminSession';

test.describe('Admin workspace release gates', () => {
	test('guests cannot open the archived vocabulary store', async ({ page }) => {
		const response = await page.goto('/vocabulary/store');
		expect(response?.status()).toBe(404);
		await expect(page).not.toHaveURL(/\/admin\/tools\/vocabulary/);
	});

	test('unauthenticated admin deep-links keep path and query on login', async ({ page }) => {
		await page.goto('/admin/teaching?tab=cp');
		await expect(page).toHaveURL(/\/dang-nhap/);
		expect(page.url()).toContain('from=');
		expect(decodeURIComponent(new URL(page.url()).searchParams.get('from') ?? '')).toBe(
			'/my-space/teaching?tab=cp',
		);
	});

	test('old admin teaching links preserve path and query on the canonical workspace', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/admin/teaching?tab=cp');
		await expect(page).toHaveURL(/\/my-space\/teaching\?tab=cp/);
	});

	test('a signed-in admin opening /dang-nhap is sent to the destination', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto(`/dang-nhap?from=${encodeURIComponent('/admin/teaching?tab=cp')}`);
		await expect(page).toHaveURL(/\/my-space\/teaching\?tab=cp/);
	});

	test('admin and teaching workspaces expose exactly one main landmark', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/admin/my-class');
		await expect(page.getByRole('main')).toHaveCount(1);
		await page.goto('/admin/posts');
		await expect(page.getByRole('main')).toHaveCount(1);
		await page.goto('/my-space/teaching');
		await expect(page.getByRole('main')).toHaveCount(1);
		await expect(page.getByTestId('admin-shell')).toHaveCount(0);
	});

	test('mobile drawer traps focus and restores it to the menu button', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/admin');
		const menu = page.getByTestId('admin-menu-button');
		await expect(menu).toBeVisible();
		await menu.click();
		const drawer = page.getByTestId('admin-mobile-drawer');
		await expect(drawer).toBeVisible();
		expect(
			await drawer.evaluate(
				(el) => el.contains(document.activeElement) || el === document.activeElement,
			),
		).toBe(true);
		await page.keyboard.press('Escape');
		await expect(drawer).toHaveCount(0);
		await expect(menu).toBeFocused();
	});

	test('learner edit flag on archived My Class is not a public entry', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const response = await page.goto('/my-space/my-class/hrm-toi-gian?edit=1');
		expect(response?.status()).toBe(404);
	});

	test('guests hitting the archived vocabulary store receive a 404', async ({ page }) => {
		const response = await page.goto('/vocabulary/store');
		expect(response?.status()).toBe(404);
	});

	test('signed-in students cannot browse the archived vocabulary store', async ({
		page,
		context,
	}) => {
		await addStudentSession(context);
		const response = await page.goto('/vocabulary/store');
		expect(response?.status()).toBe(404);
	});

	test('signed-in admins cannot browse the archived vocabulary store', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const response = await page.goto('/vocabulary/store');
		expect(response?.status()).toBe(404);
	});

	test('standard myspace-tests CRUD pages use the shared admin header', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/admin/myspace-tests/questions');
		await expect(page.getByRole('heading', { name: 'Ngân hàng câu hỏi' })).toBeVisible();
		await page.goto('/admin/myspace-tests/subjects');
		await expect(page.getByRole('heading', { name: 'Môn học' })).toBeVisible();
		await page.goto('/admin/myspace-tests/analytics');
		await expect(page.getByRole('heading', { name: 'Thống kê làm bài' })).toBeVisible();
	});

	test('standard admin confirm dialog can be dismissed without mutating', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const slug = `confirm-e2e-${Date.now().toString(36)}`;
		const created = await page.request.post('/api/admin/my-class/courses', {
			data: { title: 'Confirm E2E', slug, summary: 'Smoke confirm dialog' },
		});
		expect(created.ok()).toBe(true);
		const createdBody = (await created.json()) as { data: { id: string } };
		const courseId = createdBody.data.id;
		try {
			await page.goto('/admin/my-class/courses');
			const row = page.getByRole('row').filter({ hasText: `/${slug}` });
			await row.getByRole('button', { name: 'Lưu trữ' }).click();
			const confirm = page.getByRole('dialog', { name: 'Lưu trữ khóa học?' });
			await expect(confirm).toBeVisible();
			await confirm.getByRole('button', { name: 'Huỷ' }).click();
			await expect(confirm).toHaveCount(0);
			await expect(page).toHaveURL(/\/admin\/my-class\/courses/);
			await expect(row.getByRole('button', { name: 'Lưu trữ' })).toBeVisible();
		} finally {
			await page.request.delete(`/api/admin/my-class/courses/${courseId}`);
		}
	});
});

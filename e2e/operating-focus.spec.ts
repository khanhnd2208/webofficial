import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

test.describe('Focused operating mode', () => {
	test('mục lục links to Về tôi and Học tập only', async ({ page }) => {
		await page.goto('/muc-luc');
		const gate = page.getByRole('navigation', { name: 'Mục lục' });
		await expect(gate.getByTestId('gate-item-about')).toHaveAttribute('href', '/lien-he');
		await expect(gate.locator('a[href="/du-an"],a[href="/dich-vu"]')).toHaveCount(0);
		await expect(gate.getByRole('link', { name: /Trải nghiệm/i })).toHaveCount(0);
		await expect(gate.getByRole('link', { name: /Học tập/i })).toHaveAttribute('href', '/khoa-hoc');
		await expect(gate.getByRole('link', { name: /Active Recall/i })).toHaveCount(0);
	});

	test('sitemap keeps brand pages and leaves Teaching class boards out', async ({ request }) => {
		const response = await request.get('/sitemap.xml');
		expect(response.ok()).toBeTruthy();
		const xml = await response.text();
		expect(xml).not.toContain('/gioi-thieu');
		expect(xml).not.toContain('/trai-nghiem');
		expect(xml).not.toContain('/du-an');
		expect(xml).not.toContain('/dich-vu');
		expect(xml).toContain('/lien-he');
		expect(xml).not.toMatch(/<loc>[^<]*\/my-space<\/loc>/);
		expect(xml).not.toContain('/my-space/active-recall');
		expect(xml).not.toContain('/ghi-chep');
		expect(xml).not.toContain('/my-space/tests');
		expect(xml).not.toContain('/my-space/my-class');
		expect(xml).not.toContain('/vocabulary');
	});

	test('admin reaches Teaching from the account menu; Mục lục stays the same', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/my-space');
		await expect(page).toHaveURL(/\/muc-luc$/);
		await expect(page.getByTestId('gate-home')).toBeVisible();
		// The old My Space hub now lands on Mục lục; admins see the same two doors.
		await expect(page.locator('[data-testid^="gate-item-"]')).toHaveCount(2);
		await page.getByTestId('site-auth-chip').first().click();
		await expect(page.getByRole('link', { name: 'Lớp & môn học' })).toHaveAttribute(
			'href',
			'/my-space/teaching',
		);
		await expect(page.getByRole('link', { name: 'Quản trị' })).toHaveAttribute('href', '/admin');
	});

	test('admin main menu groups active work and leads out to Teaching', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/admin');
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		const nav = page.getByRole('navigation', { name: 'Quản trị' });
		await expect(nav.getByRole('link', { name: /^Hộp thư liên hệ/ })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Trang công khai' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Quiz UNRELEASED' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: /Khóa học tự học/ })).toHaveAttribute(
			'href',
			'/khoa-hoc?xem=quan-ly',
		);
		await expect(nav.getByRole('link', { name: /Thống kê Recall/ })).toHaveAttribute(
			'href',
			'/my-space/teaching/recall-analytics',
		);
		await expect(nav.getByRole('link', { name: 'Active Recall', exact: true })).toHaveCount(0);
		// Teaching keeps its own workspace; the menu entry says it leaves Admin.
		await expect(nav.getByRole('link', { name: /Lớp & môn học/ })).toHaveAttribute(
			'href',
			'/my-space/teaching',
		);
		await expect(nav.getByRole('link', { name: 'My Class' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Bài viết' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Người dùng' })).toHaveCount(0);
		await expect(page.getByTestId('admin-archive-link')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Liên hệ mới' })).toBeVisible();
		await expect(
			page.getByRole('region', { name: 'Lớp đang dạy' }).getByRole('link', { name: 'Tất cả lớp' }),
		).toHaveAttribute('href', '/my-space/teaching');
	});

	test('the retired Website hub lands on Tổng quan and the inbox stays on the main shell', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/admin/website');
		await expect(page).toHaveURL(/\/admin$/);
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
		await page
			.getByRole('navigation', { name: 'Quản trị' })
			.getByRole('link', { name: /Hộp thư liên hệ/ })
			.click();
		await expect(page).toHaveURL(/\/admin\/inquiries/);
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		await expect(page.getByTestId('archive-banner')).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Hộp thư liên hệ' })).toBeVisible();
	});

	test('opening a paused module from the archive keeps the archive warning', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/admin/archive');
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'archive');
		await expect(page.getByTestId('archive-banner')).toBeVisible();
		await page.getByRole('link', { name: 'My Class' }).first().click();
		await expect(page).toHaveURL(/\/admin\/my-class/);
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'archive');
		await expect(page.getByTestId('archive-banner')).toBeVisible();
		await expect(page.getByTestId('archive-back-to-admin')).toBeVisible();
		await page.getByTestId('archive-back-to-admin').click();
		await expect(page).toHaveURL(/\/admin$/);
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
	});

	test('direct URLs to old admin modules still work inside the archive shell', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		await page.goto('/admin/posts');
		await expect(page.getByTestId('archive-banner')).toBeVisible();
		await expect(page.getByRole('heading', { name: /Bài viết|Quản lý bài viết/i })).toBeVisible();
		await expect(
			page
				.getByRole('navigation', { name: 'Kho lưu trữ' })
				.getByRole('link', { name: 'Trang công khai' }),
		).toHaveCount(0);
	});
});

import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

test.describe('Focused operating mode', () => {
	test('mục lục lists introduction without experiences', async ({ page }) => {
		await page.goto('/muc-luc');
		const gate = page.getByRole('navigation', { name: 'Mục lục' });
		await expect(gate.getByTestId('gate-item-about')).toHaveAttribute('href', '/gioi-thieu');
		await expect(gate.locator('a[href="/du-an"],a[href="/dich-vu"]')).toHaveCount(0);
		await expect(gate.getByRole('link', { name: /Trải nghiệm/i })).toHaveCount(0);
		await expect(gate.getByRole('link', { name: /Active Recall/i })).toHaveCount(0);
	});

	test('sitemap keeps brand pages and leaves Teaching class boards out', async ({ request }) => {
		const response = await request.get('/sitemap.xml');
		expect(response.ok()).toBeTruthy();
		const xml = await response.text();
		expect(xml).toContain('/gioi-thieu');
		expect(xml).toMatch(/<loc>[^<]*\/du-an\/ai50-ai-cho-moi-nguoi<\/loc>/);
		expect(xml).not.toMatch(/<loc>[^<]*\/du-an<\/loc>/);
		expect(xml).not.toContain('/dich-vu');
		expect(xml).toContain('/lien-he');
		expect(xml).toMatch(/<loc>[^<]*\/my-space<\/loc>/);
		expect(xml).not.toContain('/my-space/active-recall');
		expect(xml).not.toContain('/ghi-chep');
		expect(xml).not.toContain('/my-space/tests');
		expect(xml).not.toContain('/my-space/my-class');
		expect(xml).not.toContain('/vocabulary');
	});

	test('admin My Space leads to Teaching and hides retired spaces', async ({ page, context }) => {
		await addAdminSession(context);
		await page.goto('/my-space');
		await expect(page).toHaveURL(/\/my-space$/);
		await expect(page.getByTestId('my-space')).toBeVisible();
		// Courses and Board Game joined Teaching in My Space; retired spaces stay out.
		await expect(page.getByTestId('myspace-tile-teaching')).toHaveAttribute(
			'href',
			'/my-space/teaching',
		);
		await expect(page.getByTestId('myspace-tile-active-recall')).toHaveCount(0);
	});

	test('admin main menu only shows Website', async ({ page, context }) => {
		await addAdminSession(context);
		await page.goto('/admin');
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		const nav = page.getByRole('navigation', { name: 'Quản trị' });
		await expect(nav.getByRole('link', { name: 'Website' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Active Recall' })).toHaveCount(0);
		// "Mở Teaching" is a shortcut out of Admin, not a Teaching module in the menu.
		await expect(nav.getByRole('link', { name: 'Teaching', exact: true })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'My Class' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Bài viết' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Người dùng' })).toHaveCount(0);
		await expect(page.getByTestId('admin-archive-link')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
		await expect(page.getByRole('main').getByRole('link', { name: 'Mở Teaching' })).toBeVisible();
	});

	test('Website hub and contact inbox stay on the main shell', async ({ page, context }) => {
		await addAdminSession(context);
		await page.goto('/admin/website');
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		await expect(page.getByRole('heading', { name: 'Website' })).toBeVisible();
		await page
			.getByRole('navigation', { name: 'Quản trị' })
			.getByRole('link', { name: 'Hộp thư liên hệ' })
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
			page.getByRole('navigation', { name: 'Kho lưu trữ' }).getByRole('link', { name: 'Website' }),
		).toHaveCount(0);
	});
});

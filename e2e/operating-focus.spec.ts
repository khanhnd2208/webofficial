import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

test.describe('Focused operating mode', () => {
	test('mục lục lists brand pages and My Space', async ({ page }) => {
		await page.goto('/muc-luc');
		const gate = page.getByRole('navigation', { name: 'Cổng trang' });
		await expect(gate.getByRole('link', { name: /Giới thiệu/i })).toHaveAttribute(
			'href',
			'/gioi-thieu',
		);
		await expect(gate.getByRole('link', { name: /Dự án/i })).toHaveAttribute('href', '/du-an');
		await expect(gate.getByRole('link', { name: /Dịch vụ/i })).toHaveAttribute('href', '/dich-vu');
		await expect(gate.getByRole('link', { name: /My Space/i })).toHaveAttribute(
			'href',
			'/my-space',
		);
		await expect(gate.getByRole('link', { name: /Active Recall/i })).toHaveCount(0);
	});

	test('sitemap keeps brand, Teaching class boards out, and Active Recall in', async ({
		request,
	}) => {
		const response = await request.get('/sitemap.xml');
		expect(response.ok()).toBeTruthy();
		const xml = await response.text();
		expect(xml).toContain('/gioi-thieu');
		expect(xml).toContain('/du-an');
		expect(xml).toContain('/dich-vu');
		expect(xml).toContain('/lien-he');
		expect(xml).toMatch(/<loc>[^<]*\/my-space<\/loc>/);
		expect(xml).toContain('/my-space/active-recall');
		expect(xml).not.toContain('/ghi-chep');
		expect(xml).not.toContain('/my-space/tests');
		expect(xml).not.toContain('/my-space/my-class');
		expect(xml).not.toContain('/vocabulary');
	});

	test('My Space contains only Teaching and Active Recall', async ({ page }) => {
		await page.goto('/my-space');
		await expect(page).toHaveURL(/\/my-space$/);
		await expect(page.getByTestId('my-space')).toBeVisible();
		await expect(page.locator('[data-testid^="myspace-tile-"]')).toHaveCount(2);
		await expect(page.getByTestId('myspace-tile-teaching')).toHaveAttribute(
			'href',
			'/my-space/teaching',
		);
		await expect(page.getByTestId('myspace-tile-active-recall')).toHaveAttribute(
			'href',
			'/my-space/active-recall',
		);
	});

	test('admin main menu only shows Website and Active Recall', async ({ page, context }) => {
		await addAdminSession(context);
		await page.goto('/admin');
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		const nav = page.getByRole('navigation', { name: 'Quản trị' });
		await expect(nav.getByRole('link', { name: 'Website' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Active Recall' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Teaching' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'My Class' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Bài viết' })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: 'Người dùng' })).toHaveCount(0);
		await expect(page.getByTestId('admin-archive-link')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Mở Teaching' })).toHaveCount(0);
	});

	test('Website hub and contact inbox stay on the main shell', async ({ page, context }) => {
		await addAdminSession(context);
		await page.goto('/admin/website');
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		await expect(page.getByRole('heading', { name: 'Website' })).toBeVisible();
		await page.getByRole('link', { name: /Yêu cầu liên hệ/ }).click();
		await expect(page).toHaveURL(/\/admin\/inquiries/);
		await expect(page.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		await expect(page.getByTestId('archive-banner')).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Yêu cầu liên hệ' })).toBeVisible();
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

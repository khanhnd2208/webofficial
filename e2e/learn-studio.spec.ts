import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { addAdminSession } from './helpers/adminSession';

test.beforeAll(() => {
	const host = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname;
	if (!['localhost', '127.0.0.1', '[::1]'].includes(host))
		throw new Error('Learn Studio E2E requires a local test server');
});

async function courseWithDiscussion(context: BrowserContext) {
	await addAdminSession(context);
	const request = context.request;
	const created = await request.post('/api/admin/learn/courses', {
		data: { title: `Studio E2E ${randomUUID()}` },
	});
	expect(created.status()).toBe(201);
	const course = (await created.json()).data as { id: string; slug: string };
	async function cleanup() {
		await addAdminSession(context);
		expect((await request.delete(`/api/admin/learn/courses/${course.id}`)).ok()).toBe(true);
	}
	try {
		const added = await request.post(`/api/admin/learn/courses/${course.id}/lessons`, {
			data: { title: 'Bài thử' },
		});
		expect(added.status()).toBe(201);
		const lesson = (await added.json()).data as { id: string };
		const section = await request.post(`/api/admin/learn/lessons/${lesson.id}/sections`, {
			data: { title: 'Câu hỏi phản biện', type: 'DISCUSSION' },
		});
		expect(section.status()).toBe(201);
		const sectionId = (await section.json()).data.id as string;
		const original = 'Câu gốc để khôi phục';
		expect(
			(
				await request.patch(`/api/admin/learn/sections/${sectionId}`, {
					data: {
						discussion: {
							questions: [{ id: 'q_goc', question: original, answer: 'Lời giải gốc.' }],
						},
					},
				})
			).ok(),
		).toBe(true);
		expect(
			(
				await request.post(`/api/admin/learn/sections/${sectionId}/revisions`, {
					data: { reason: 'manual' },
				})
			).ok(),
		).toBe(true);
		return { slug: course.slug, sectionId, original, cleanup };
	} catch (error) {
		await cleanup();
		throw error;
	}
}

async function promptBox(page: Page) {
	await page.getByRole('tab', { name: 'Markdown' }).click();
	return page.getByRole('textbox', { name: 'Đề bài' });
}

test('edits a discussion, imports, previews, saves and restores', async ({ page, context }) => {
	test.setTimeout(60_000);
	await page.setViewportSize({ width: 1440, height: 900 });
	const course = await courseWithDiscussion(context);
	try {
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await expect(page.getByRole('tab', { name: 'Đề bài' })).toBeVisible();
		await expect(page.getByText('Câu hỏi nhanh')).toHaveCount(0);

		await page.getByRole('tab', { name: 'Danh sách câu' }).click();
		await page.getByRole('button', { name: 'Thêm câu' }).click();
		const edited = 'Câu hai tiếng Việt: cửa hàng hết hàng.';
		const box = await promptBox(page);
		await box.fill(edited);
		await page.locator('.ln-qnav__main').nth(0).click();
		await page.getByRole('tab', { name: 'Markdown' }).click();
		await expect(page.getByRole('textbox', { name: 'Đề bài' })).toHaveValue(
			new RegExp(course.original),
		);
		await page.locator('.ln-qnav__main').nth(1).click();
		await page.getByRole('tab', { name: 'Markdown' }).click();
		await expect(page.getByRole('textbox', { name: 'Đề bài' })).toHaveValue(edited);

		await page.getByRole('button', { name: 'Nhập nội dung' }).first().click();
		await expect(page.getByRole('heading', { name: 'Nhập nội dung' })).toBeVisible();
		await page.getByRole('button', { name: 'Đóng' }).click();
		await expect(page.getByRole('heading', { name: 'Nhập nội dung' })).toHaveCount(0);

		await page.getByRole('tab', { name: 'Xem trước' }).click();
		await expect(page.getByText('Xem như học viên').first()).toBeVisible();
		await expect(page.getByText(edited)).toBeVisible();

		await page.getByRole('tab', { name: 'Đề bài' }).click();
		const save = page.getByRole('button', { name: /^Lưu$|Đã lưu/ });
		if ((await save.textContent())?.trim() === 'Lưu') await save.click();
		await expect(page.getByRole('button', { name: /Đã lưu/ })).toBeVisible();

		await page.getByRole('button', { name: 'Thuộc tính' }).click();
		await page.getByRole('button', { name: 'Xem các phiên bản' }).click();
		await page.getByRole('button', { name: /Lưu thủ công/ }).click();
		await page.getByRole('button', { name: 'Khôi phục bản này' }).click();
		await page.getByRole('button', { name: 'Khôi phục', exact: true }).click();
		await expect(page.getByRole('heading', { name: 'Lịch sử' })).toHaveCount(0);
		await page.getByRole('button', { name: 'Đóng thuộc tính' }).first().click();
		await page.getByRole('tab', { name: 'Đề bài' }).click();
		await page.locator('.ln-qnav__main').nth(0).click();
		await page.getByRole('tab', { name: 'Markdown' }).click();
		await expect(page.getByRole('textbox', { name: 'Đề bài' })).toHaveValue(
			new RegExp(course.original),
		);
	} finally {
		await course.cleanup();
	}
});

test('studio editor stays on screen at a phone width', async ({ page, context }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	const course = await courseWithDiscussion(context);
	try {
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await expect(page.getByRole('button', { name: 'Mục lục', exact: true })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Đề bài' })).toBeVisible();
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(1);
	} finally {
		await course.cleanup();
	}
});

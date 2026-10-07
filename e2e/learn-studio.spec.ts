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
		await expect(page.locator('.ln-qwork__preview').getByText(edited)).toBeVisible();

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

test('keeps visual text through duplication, deletion and immediate reload', async ({
	page,
	context,
}) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		const prompt = page.getByRole('textbox', { name: 'Đề bài', exact: true });
		await prompt.fill('Bản trực quan mới nhất');
		await page.getByRole('button', { name: 'Thao tác câu 1' }).click();
		await page.getByRole('menuitem', { name: 'Nhân bản', exact: true }).click();
		await expect(page.locator('.ln-qnav__main')).toHaveCount(2);
		await expect(page.getByRole('textbox', { name: 'Đề bài', exact: true })).toContainText(
			'Bản trực quan mới nhất',
		);
		await page.getByRole('button', { name: 'Thao tác câu 2' }).click();
		await page.getByRole('menuitem', { name: 'Xóa', exact: true }).click();
		await expect(page.locator('.ln-qnav__main')).toHaveCount(1);
		await page.getByRole('button', { name: 'Thuộc tính', exact: true }).click();
		await page.getByRole('button', { name: 'Xem như học viên', exact: true }).click();
		await expect(page.getByRole('button', { name: /Đã lưu/ })).toBeVisible();
		await page.reload();
		await expect(page.locator('.ln-qnav__main')).toHaveCount(1);
		await expect(page.getByRole('textbox', { name: 'Đề bài', exact: true })).toContainText(
			'Bản trực quan mới nhất',
		);
	} finally {
		await course.cleanup();
	}
});

test('drawers contain keyboard focus and return focus to their trigger', async ({
	page,
	context,
}) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 390, height: 800 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		const navigation = page.getByRole('button', { name: 'Mục lục', exact: true });
		await navigation.click();
		const drawer = page.getByRole('dialog', { name: 'Mục lục', exact: true });
		await expect(drawer).toBeVisible();
		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');
			expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true);
		}
		await page.keyboard.press('Escape');
		await expect(drawer).toHaveCount(0);
		await expect(navigation).toBeFocused();
		const properties = page.getByRole('button', { name: 'Thuộc tính', exact: true });
		await properties.click();
		await expect(page.getByRole('dialog', { name: 'Thuộc tính mục' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog', { name: 'Thuộc tính mục' })).toHaveCount(0);
		await expect(properties).toBeFocused();
	} finally {
		await course.cleanup();
	}
});

test('workspace fits supported widths with Admin theme and a separate learner preview', async ({
	page,
	context,
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const course = await courseWithDiscussion(context);
	try {
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		for (const width of [390, 768, 1024, 1280, 1440, 1920]) {
			await page.setViewportSize({ width, height: 900 });
			await expect(page.getByRole('tab', { name: 'Đề bài', exact: true })).toBeVisible();
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow).toBeLessThanOrEqual(1);
		}
		await page.setViewportSize({ width: 1440, height: 900 });
		await expect(page.locator('.ln-studio')).toHaveCSS('background-color', 'rgb(244, 246, 250)');
		await page.screenshot({ path: '/tmp/learn-review-desktop.png' });
		await page.getByRole('button', { name: 'Soạn và xem cạnh nhau' }).click();
		await expect(page.locator('.ln-qwork')).toHaveAttribute('data-split', 'true');
		await page.screenshot({ path: '/tmp/learn-review-preview.png' });
		await page.setViewportSize({ width: 390, height: 800 });
		await expect(page.locator('.ln-qwork')).not.toHaveAttribute('data-split', 'true');
		await page.screenshot({ path: '/tmp/learn-review-mobile.png' });
		expect(errors).toEqual([]);
	} finally {
		await course.cleanup();
	}
});

test('imports discussion content through review and apply, then persists it', async ({
	page,
	context,
}) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await page.getByRole('button', { name: 'Nhập nội dung' }).first().click();
		await page
			.getByRole('textbox', { name: 'Kết quả AI' })
			.fill(
				'Câu 1:\n### Hiểu — Tình huống nhập thử\n> [!REFLECT] Câu hỏi:\n> Vì sao cần kiểm tra?\n\nĐáp án mẫu:\nĐể xác nhận nội dung trước khi áp dụng.',
			);
		await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
		await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
		await page.getByRole('button', { name: 'Lưu 1 câu', exact: true }).click();
		await expect(page.getByRole('dialog', { name: 'Nhập nội dung' })).toHaveCount(0);
		await expect(page.locator('.ln-qnav__main')).toHaveCount(2);
		await page.reload();
		await expect(page.locator('.ln-qnav__main')).toHaveCount(2);
		await page.locator('.ln-qnav__main').nth(1).click();
		await page.getByRole('tab', { name: 'Xem trước', exact: true }).click();
		await expect(
			page.getByRole('heading', { name: 'Hiểu — Tình huống nhập thử', exact: true }),
		).toBeVisible();
	} finally {
		await course.cleanup();
	}
});

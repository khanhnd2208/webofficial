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

		await page.getByRole('button', { name: 'Xem các phiên bản' }).click();
		await page.getByRole('button', { name: /Lưu thủ công/ }).click();
		await page.getByRole('button', { name: 'Khôi phục bản này' }).click();
		await page.getByRole('button', { name: 'Khôi phục', exact: true }).click();
		await expect(page.getByRole('heading', { name: 'Lịch sử' })).toHaveCount(0);
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
		await expect(page.getByRole('tab', { name: 'Mục lục', exact: true })).toBeVisible();
		await expect(page.getByText(/Đang sửa:/)).toBeVisible();
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

test('area tabs keep the current section visible and move with the keyboard', async ({
	page,
	context,
}) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 390, height: 800 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		const areas = page.getByRole('tablist', { name: 'Vùng soạn' });
		await expect(page.getByText('Đang sửa: Bài thử · Câu hỏi phản biện')).toBeVisible();
		await areas.getByRole('tab', { name: 'Nội dung' }).focus();
		await page.keyboard.press('ArrowRight');
		await expect(areas.getByRole('tab', { name: 'Thông tin' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		await expect(page.getByLabel('Thời lượng')).toBeVisible();
		await expect(page.getByText('Đang sửa: Bài thử · Câu hỏi phản biện')).toBeVisible();
		await page.keyboard.press('ArrowLeft');
		await expect(page.getByRole('tab', { name: 'Đề bài' })).toBeVisible();
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
		await page.setViewportSize({ width: 1920, height: 900 });
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

test('imports discussion content from one screen with a learner preview, then persists it', async ({
	page,
	context,
}) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await page.getByRole('button', { name: 'Nhập nội dung' }).first().click();
		await expect(page.getByText(/Đích: /)).toBeVisible();
		await page
			.getByRole('textbox', { name: 'Nội dung dán' })
			.fill(
				'Câu 1:\n### Hiểu — Tình huống nhập thử\n> [!REFLECT] Câu hỏi:\n> Vì sao cần kiểm tra?\n\nĐáp án mẫu:\nĐể xác nhận nội dung trước khi áp dụng.',
			);
		await expect(
			page.getByRole('dialog', { name: 'Nhập nội dung' }).getByRole('region', { name: 'Câu 1' }),
		).toContainText('Vì sao cần kiểm tra?');
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

test('saves a reading edit and shows where the course description appears', async ({
	page,
	context,
}) => {
	test.setTimeout(60_000);
	await addAdminSession(context);
	const request = context.request;
	const created = await request.post('/api/admin/learn/courses', {
		data: { title: `Studio đọc ${randomUUID()}` },
	});
	expect(created.status()).toBe(201);
	const course = (await created.json()).data as { id: string; slug: string; title: string };
	try {
		const added = await request.post(`/api/admin/learn/courses/${course.id}/lessons`, {
			data: { title: 'Bài đọc' },
		});
		expect(added.status()).toBe(201);
		const lessonId = (await added.json()).data.id as string;
		const section = await request.post(`/api/admin/learn/lessons/${lessonId}/sections`, {
			data: { title: 'Mục đọc', type: 'READING' },
		});
		expect(section.status()).toBe(201);
		const sectionId = (await section.json()).data.id as string;

		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${sectionId}`);
		await page.getByRole('textbox', { name: 'Tên mục' }).fill('Mục đã sửa');
		await page.getByRole('tab', { name: 'Markdown' }).click();
		await page.getByRole('textbox', { name: 'Nội dung Markdown' }).fill('Nội dung đã lưu lại.');
		await page.getByRole('button', { name: 'Lưu', exact: true }).click();
		await expect(page.getByRole('button', { name: /Đã lưu/ })).toBeVisible();
		await page.reload();
		await expect(page.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục đã sửa');
		await page.getByRole('tab', { name: 'Markdown' }).click();
		await expect(page.getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue(
			'Nội dung đã lưu lại.',
		);

		await page.getByRole('button', { name: course.title }).click();
		await expect(page.getByText('Hiện ở phần Giới thiệu, phía trên mục lục bài.')).toBeVisible();
		await expect(page.getByText(/đầu mục đầu tiên/)).toHaveCount(0);
		await page.getByRole('button', { name: 'Hủy' }).click();

		await page.setViewportSize({ width: 390, height: 800 });
		await expect(page.getByText('Đang sửa: Bài đọc · Mục đã sửa')).toBeVisible();
		await page.getByRole('tab', { name: 'Mục lục', exact: true }).click();
		await expect(page.getByText('Đang sửa: Bài đọc · Mục đã sửa')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Mục đã sửa', exact: true })).toBeVisible();
	} finally {
		await addAdminSession(context);
		expect((await request.delete(`/api/admin/learn/courses/${course.id}`)).ok()).toBe(true);
	}
});

test('adds a lesson from the studio after the outline is empty', async ({ page, context }) => {
	await addAdminSession(context);
	const request = context.request;
	const created = await request.post('/api/admin/learn/courses', {
		data: { title: `Studio trống ${randomUUID()}` },
	});
	expect(created.status()).toBe(201);
	const course = (await created.json()).data as { id: string; slug: string };
	try {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/khoa-hoc/${course.slug}/studio`);
		await page.getByRole('button', { name: 'Thao tác bài 1' }).click();
		await page.getByRole('menuitem', { name: 'Xóa bài…' }).click();
		await page.getByRole('button', { name: 'Xóa bài', exact: true }).click();
		await expect(page.getByRole('button', { name: /Bài 1:/ })).toHaveCount(0);
		await page.getByRole('button', { name: 'Thêm bài' }).click();
		await expect(page.getByRole('button', { name: /Bài 1: Bài 1, 1 mục/ })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục mới');
	} finally {
		await addAdminSession(context);
		expect((await request.delete(`/api/admin/learn/courses/${course.id}`)).ok()).toBe(true);
	}
});

async function keepTextAcrossAreas(
	page: Page,
	fill: () => Promise<void>,
	read: () => Promise<void>,
) {
	await fill();
	await page.getByRole('tab', { name: 'Thông tin', exact: true }).click();
	await expect(page.getByLabel('Thời lượng')).toBeVisible();
	await page.getByRole('tab', { name: 'Nội dung', exact: true }).click();
	await read();
	await page.setViewportSize({ width: 1440, height: 900 });
	await read();
	await page.setViewportSize({ width: 390, height: 800 });
	await read();
	const save = page.locator('.ln-save');
	if ((await save.getAttribute('data-status')) !== 'saved') await save.click();
	await expect(save).toHaveAttribute('data-status', 'saved');
	await page.reload();
	await read();
}

test('keeps a reading edit across mobile tabs, a resize, save and reload', async ({
	page,
	context,
}) => {
	test.setTimeout(60_000);
	await addAdminSession(context);
	const request = context.request;
	const created = await request.post('/api/admin/learn/courses', {
		data: { title: `Studio đọc mobile ${randomUUID()}` },
	});
	expect(created.status()).toBe(201);
	const course = (await created.json()).data as { id: string; slug: string };
	try {
		const added = await request.post(`/api/admin/learn/courses/${course.id}/lessons`, {
			data: { title: 'Bài đọc' },
		});
		expect(added.status()).toBe(201);
		const lessonId = (await added.json()).data.id as string;
		const section = await request.post(`/api/admin/learn/lessons/${lessonId}/sections`, {
			data: { title: 'Mục đọc', type: 'READING' },
		});
		expect(section.status()).toBe(201);
		const sectionId = (await section.json()).data.id as string;
		await page.setViewportSize({ width: 390, height: 800 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${sectionId}`);
		const typed = 'Nội dung gõ rồi đổi vùng.';
		await keepTextAcrossAreas(
			page,
			async () => {
				await page.getByRole('tab', { name: 'Markdown' }).click();
				await page.getByRole('textbox', { name: 'Nội dung Markdown' }).fill(typed);
			},
			async () => {
				await page.getByRole('tab', { name: 'Markdown' }).click();
				await expect(page.getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue(typed);
			},
		);
	} finally {
		await addAdminSession(context);
		expect((await request.delete(`/api/admin/learn/courses/${course.id}`)).ok()).toBe(true);
	}
});

test('keeps a discussion prompt across mobile tabs, a resize, save and reload', async ({
	page,
	context,
}) => {
	test.setTimeout(60_000);
	await page.setViewportSize({ width: 390, height: 800 });
	const course = await courseWithDiscussion(context);
	try {
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		const typed = 'Câu gõ rồi đổi vùng.';
		await keepTextAcrossAreas(
			page,
			async () => {
				const box = await promptBox(page);
				await box.fill(typed);
			},
			async () => {
				await page.getByRole('tab', { name: 'Markdown' }).click();
				await expect(page.getByRole('textbox', { name: 'Đề bài' })).toHaveValue(typed);
			},
		);
	} finally {
		await course.cleanup();
	}
});

test('the editor stays usable at 1024px and at 200% zoom', async ({ page, context }) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 1024, height: 800 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		const prompt = page.getByRole('textbox', { name: 'Đề bài', exact: true });
		await expect(prompt).toBeVisible();
		const at1024 = await prompt.boundingBox();
		expect(at1024).not.toBeNull();
		expect(at1024!.width).toBeGreaterThan(240);
		expect(at1024!.x).toBeGreaterThanOrEqual(0);
		expect(at1024!.x + at1024!.width).toBeLessThanOrEqual(1025);
		await prompt.fill('Soạn ở 1024');
		await expect(prompt).toContainText('Soạn ở 1024');
		await page.screenshot({ path: '/tmp/learn-studio-1024.png', fullPage: false });

		// Chrome's 200% zoom on a 1024px window lays out at about 512 CSS pixels.
		await page.setViewportSize({ width: 512, height: 400 });
		await expect(page.getByRole('tab', { name: 'Nội dung', exact: true })).toBeVisible();
		await expect(prompt).toBeVisible();
		await prompt.fill('Soạn khi phóng 200%');
		await expect(prompt).toContainText('Soạn khi phóng 200%');
		const zoomed = await prompt.boundingBox();
		expect(zoomed).not.toBeNull();
		expect(zoomed!.width).toBeGreaterThan(160);
		expect(zoomed!.height).toBeGreaterThan(16);
		expect(zoomed!.x).toBeGreaterThanOrEqual(0);
		expect(zoomed!.x + zoomed!.width).toBeLessThanOrEqual(513);
		await page.screenshot({ path: '/tmp/learn-studio-1024-zoom.png', fullPage: false });
	} finally {
		await course.cleanup();
	}
});

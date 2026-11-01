import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { addAdminSession, createAdminRequest } from './helpers/adminSession';

test.beforeAll(() => {
	const host = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname;
	if (!['localhost', '127.0.0.1', '[::1]'].includes(host))
		throw new Error('Learn Studio E2E requires a local test server');
});

/** Next.js can keep a hidden copy of the route outside the live document. */
function main(page: Page) {
	return page.locator('#main-content');
}

async function deleteCourse(courseId: string) {
	const api = await createAdminRequest();
	try {
		expect((await api.delete(`/api/admin/learn/courses/${courseId}`)).ok()).toBe(true);
	} finally {
		await api.dispose();
	}
}

async function courseWithDiscussion(context: BrowserContext) {
	await addAdminSession(context);
	const request = context.request;
	const created = await request.post('/api/admin/learn/courses', {
		data: { title: `Studio E2E ${randomUUID()}` },
	});
	expect(created.status()).toBe(201);
	const course = (await created.json()).data as { id: string; slug: string };
	async function cleanup() {
		await deleteCourse(course.id);
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

const DOC = 'Câu hỏi phản biện (Markdown)';

function questionDoc(page: Page) {
	return main(page).getByRole('textbox', { name: DOC });
}

function bank(...questions: string[]) {
	return questions
		.map(
			(question, index) => `Câu ${index + 1}: ${question}\n\nĐáp án mẫu:\nLời giải ${index + 1}.`,
		)
		.join('\n\n');
}

async function saveNow(page: Page) {
	const save = main(page).locator('.ln-save');
	if ((await save.getAttribute('data-status')) !== 'saved') await save.click();
	await expect(save).toHaveAttribute('data-status', 'saved');
}

test('edits a discussion as one Markdown document, previews, saves and restores', async ({
	page,
	context,
}) => {
	test.setTimeout(60_000);
	await page.setViewportSize({ width: 1440, height: 900 });
	const course = await courseWithDiscussion(context);
	try {
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await expect(questionDoc(page)).toHaveValue(new RegExp(`Câu 1: ${course.original}`));
		await expect(main(page).getByRole('tab', { name: 'Danh sách câu' })).toHaveCount(0);
		await expect(main(page).getByText('Thông tin mục')).toHaveCount(0);

		const edited = 'Câu hai tiếng Việt: cửa hàng hết hàng.';
		await questionDoc(page).fill(bank(course.original, edited));
		await expect(main(page).getByText('2 câu', { exact: true })).toBeVisible();
		await expect(
			main(page).getByRole('region', { name: 'Xem trước như học viên' }).getByText(edited),
		).toBeVisible();
		await saveNow(page);

		await main(page).getByRole('button', { name: 'Thao tác mục: Câu hỏi phản biện' }).click();
		await main(page).getByRole('menuitem', { name: 'Các phiên bản đã lưu' }).click();
		await main(page)
			.getByRole('button', { name: /Lưu thủ công/ })
			.click();
		await main(page).getByRole('button', { name: 'Khôi phục bản này' }).click();
		await main(page).getByRole('button', { name: 'Khôi phục', exact: true }).click();
		await expect(main(page).getByRole('heading', { name: 'Lịch sử' })).toHaveCount(0);
		await expect(questionDoc(page)).toHaveValue(new RegExp(course.original));
		await expect(questionDoc(page)).not.toHaveValue(new RegExp(edited));
	} finally {
		await course.cleanup();
	}
});

test('studio editor stays on screen at a phone width', async ({ page, context }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	const course = await courseWithDiscussion(context);
	try {
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await expect(main(page).getByRole('tab', { name: 'Mục lục', exact: true })).toBeVisible();
		await expect(main(page).getByText(/Đang sửa:/)).toBeVisible();
		await expect(questionDoc(page)).toBeVisible();
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(1);
	} finally {
		await course.cleanup();
	}
});

test('keeps added and removed questions through an immediate reload', async ({ page, context }) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await questionDoc(page).fill(bank('Câu mới nhất', 'Câu sẽ xóa'));
		await expect(main(page).getByText('2 câu', { exact: true })).toBeVisible();
		await questionDoc(page).fill(bank('Câu mới nhất'));
		await expect(main(page).getByText('1 câu', { exact: true })).toBeVisible();
		await main(page).getByRole('button', { name: 'Xem như học viên', exact: true }).click();
		await expect(main(page).getByRole('button', { name: /Đã lưu/ })).toBeVisible();
		await page.reload();
		await expect(questionDoc(page)).toHaveValue(bank('Câu mới nhất'));
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
		const areas = main(page).getByRole('tablist', { name: 'Vùng soạn' });
		await expect(main(page).getByText('Đang sửa: Bài thử · Câu hỏi phản biện')).toBeVisible();
		await expect(areas.getByRole('tab')).toHaveCount(2);
		await areas.getByRole('tab', { name: 'Nội dung' }).focus();
		await page.keyboard.press('ArrowLeft');
		await expect(areas.getByRole('tab', { name: 'Mục lục' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		await expect(main(page).getByText('Đang sửa: Bài thử · Câu hỏi phản biện')).toBeVisible();
		await page.keyboard.press('ArrowRight');
		await expect(questionDoc(page)).toBeVisible();
	} finally {
		await course.cleanup();
	}
});

test('workspace fits supported widths with Admin theme and a learner preview', async ({
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
			await expect(questionDoc(page)).toBeVisible();
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow).toBeLessThanOrEqual(1);
		}
		await page.setViewportSize({ width: 1440, height: 900 });
		await expect(main(page).locator('.ln-studio')).toHaveCSS(
			'background-color',
			'rgb(244, 246, 250)',
		);
		await expect(main(page).getByRole('region', { name: 'Xem trước như học viên' })).toBeVisible();
		await page.screenshot({ path: '/tmp/learn-review-desktop.png' });
		await page.setViewportSize({ width: 390, height: 800 });
		await page.screenshot({ path: '/tmp/learn-review-mobile.png' });
		expect(errors).toEqual([]);
	} finally {
		await course.cleanup();
	}
});

test('adds a lesson from pasted Markdown with a learner preview, then persists it', async ({
	page,
	context,
}) => {
	const course = await courseWithDiscussion(context);
	try {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		await main(page).getByRole('button', { name: 'Thêm bài' }).click();
		await main(page)
			.getByRole('menuitem', { name: /Dán Markdown/ })
			.click();
		const dialog = main(page).getByRole('dialog', { name: 'Thêm bài từ Markdown' });
		await expect(dialog).toBeVisible();
		await page
			.getByRole('textbox', { name: 'Nội dung dán' })
			.fill('# Bài dán thử\n\n## Mục dán thử\n\nNội dung dán từ Markdown.');
		await dialog.getByRole('button', { name: 'Lưu 1 mục', exact: true }).click();
		await expect(dialog).toHaveCount(0);
		await expect(main(page).getByRole('button', { name: /^Bài 2: Bài dán thử/ })).toBeVisible();
		await page.reload();
		await expect(main(page).getByRole('button', { name: /^Bài 2: Bài dán thử/ })).toBeVisible();
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
		await expect(main(page).getByRole('tab', { name: 'Markdown' })).toHaveCount(0);
		await main(page).getByRole('textbox', { name: 'Tên mục' }).fill('Mục đã sửa');
		await main(page)
			.getByRole('textbox', { name: 'Nội dung Markdown' })
			.fill('Nội dung đã lưu lại.');
		await main(page).getByRole('button', { name: 'Lưu', exact: true }).click();
		await expect(main(page).getByRole('button', { name: /Đã lưu/ })).toBeVisible();
		await page.reload();
		await expect(main(page).getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục đã sửa');
		await expect(main(page).getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue(
			'Nội dung đã lưu lại.',
		);

		await main(page).getByRole('button', { name: course.title }).click();
		await expect(
			main(page).getByText('Hiện ở phần Giới thiệu, phía trên mục lục bài.'),
		).toBeVisible();
		await expect(main(page).getByText(/đầu mục đầu tiên/)).toHaveCount(0);
		await main(page).getByRole('button', { name: 'Hủy' }).click();

		await page.setViewportSize({ width: 390, height: 800 });
		await expect(main(page).getByText('Đang sửa: Bài đọc · Mục đã sửa')).toBeVisible();
		await main(page).getByRole('tab', { name: 'Mục lục', exact: true }).click();
		await expect(main(page).getByText('Đang sửa: Bài đọc · Mục đã sửa')).toBeVisible();
		await expect(main(page).getByRole('button', { name: 'Mục đã sửa', exact: true })).toBeVisible();
	} finally {
		await deleteCourse(course.id);
	}
});

test('adds an empty lesson from the studio after the outline is empty', async ({
	page,
	context,
}) => {
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
		await main(page).getByRole('button', { name: 'Thao tác bài 1' }).click();
		await main(page).getByRole('menuitem', { name: 'Xóa bài…' }).click();
		await main(page).getByRole('button', { name: 'Xóa bài', exact: true }).click();
		await expect(main(page).getByRole('button', { name: /Bài 1:/ })).toHaveCount(0);
		await expect(main(page).getByText('Chọn một mục để soạn')).toBeVisible();
		await main(page).getByRole('button', { name: 'Thêm bài' }).click();
		await main(page)
			.getByRole('menuitem', { name: /Bài trống/ })
			.click();
		await expect(main(page).getByRole('button', { name: /Bài 1: Bài 1, 1 mục/ })).toBeVisible();
		await expect(main(page).getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục mới');
	} finally {
		await deleteCourse(course.id);
	}
});

async function keepTextAcrossAreas(
	page: Page,
	fill: () => Promise<void>,
	read: () => Promise<void>,
) {
	await fill();
	await main(page).getByRole('tab', { name: 'Mục lục', exact: true }).click();
	await expect(main(page).getByRole('button', { name: 'Thêm bài' })).toBeVisible();
	await main(page).getByRole('tab', { name: 'Nội dung', exact: true }).click();
	await read();
	await page.setViewportSize({ width: 1440, height: 900 });
	await read();
	await page.setViewportSize({ width: 390, height: 800 });
	await read();
	await saveNow(page);
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
		const box = () => main(page).getByRole('textbox', { name: 'Nội dung Markdown' });
		await keepTextAcrossAreas(
			page,
			() => box().fill(typed),
			() => expect(box()).toHaveValue(typed),
		);
	} finally {
		await deleteCourse(course.id);
	}
});

test('keeps a discussion edit across mobile tabs, a resize, save and reload', async ({
	page,
	context,
}) => {
	test.setTimeout(60_000);
	await page.setViewportSize({ width: 390, height: 800 });
	const course = await courseWithDiscussion(context);
	try {
		await page.goto(`/khoa-hoc/${course.slug}/studio?s=${course.sectionId}`);
		const typed = bank('Câu gõ rồi đổi vùng.');
		await keepTextAcrossAreas(
			page,
			() => questionDoc(page).fill(typed),
			() => expect(questionDoc(page)).toHaveValue(typed),
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
		const prompt = questionDoc(page);
		await expect(prompt).toBeVisible();
		const at1024 = await prompt.boundingBox();
		expect(at1024).not.toBeNull();
		expect(at1024!.width).toBeGreaterThan(240);
		expect(at1024!.x).toBeGreaterThanOrEqual(0);
		expect(at1024!.x + at1024!.width).toBeLessThanOrEqual(1025);
		await prompt.fill(bank('Soạn ở 1024'));
		await expect(prompt).toHaveValue(bank('Soạn ở 1024'));
		await page.screenshot({ path: '/tmp/learn-studio-1024.png', fullPage: false });

		// Chrome's 200% zoom on a 1024px window lays out at about 512 CSS pixels.
		await page.setViewportSize({ width: 512, height: 400 });
		await expect(main(page).getByRole('tab', { name: 'Nội dung', exact: true })).toBeVisible();
		await expect(prompt).toBeVisible();
		await prompt.fill(bank('Soạn khi phóng 200%'));
		await expect(prompt).toHaveValue(bank('Soạn khi phóng 200%'));
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

test('imports Markdown, fills individual missing images, edits and persists across reload', async ({
	page,
	context,
}) => {
	test.setTimeout(60_000);
	await addAdminSession(context);
	const created = await context.request.post('/api/admin/learn/courses', {
		data: { title: `Markdown UX ${randomUUID()}` },
	});
	expect(created.status()).toBe(201);
	const course = (await created.json()).data as { id: string; slug: string };
	const screenshotDir = process.env.COURSE_UX_SCREENSHOTS;
	const image = {
		name: 'screenshot-arbitrary-name.png',
		mimeType: 'image/png',
		buffer: await sharp({ create: { width: 64, height: 48, channels: 3, background: '#d8e8e4' } })
			.png()
			.toBuffer(),
	};
	// Production Nginx serves runtime uploads from disk; next start only indexes build-time public files.
	// Keep the upload API real and serve its actual bytes just as the deployment does.
	await page.route('**/uploads/*', async (route) => {
		const filename = path.basename(new URL(route.request().url()).pathname);
		try {
			const body = await readFile(path.join(process.cwd(), 'public', 'uploads', filename));
			await route.fulfill({ body, contentType: 'image/webp' });
		} catch {
			await route.fulfill({ status: 404 });
		}
	});
	try {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto(`/khoa-hoc/${course.slug}/studio`);
		await main(page).getByRole('button', { name: 'Nhập nội dung', exact: true }).click();
		await main(page)
			.getByRole('textbox', { name: 'Nội dung dán' })
			.fill(
				'# Soạn bài bằng Markdown\n\n## Minh họa trong bài\n\nNội dung **quan trọng**.\n\n![Sơ đồ quy trình]()\n\n![Ví dụ thực tế]()\n\n![Ảnh cũ](/uploads/does-not-exist-course-ux.png)',
			);
		await expect(main(page).getByText('3 vị trí ảnh cần bổ sung')).toBeVisible();
		if (screenshotDir)
			await page.screenshot({ path: `${screenshotDir}/import-desktop.png`, fullPage: true });
		await main(page).getByLabel('Bổ sung ảnh 1: Sơ đồ quy trình').setInputFiles(image);
		await expect(main(page).getByRole('textbox', { name: 'Nội dung dán' })).toHaveValue(
			/!\[Sơ đồ quy trình\]\(\/uploads\//,
		);
		await main(page).getByRole('button', { name: 'Lưu 1 mục', exact: true }).click();
		await expect(main(page).getByRole('heading', { name: 'Nhập nội dung' })).toHaveCount(0);
		const source = main(page).getByRole('textbox', { name: 'Nội dung Markdown' });
		await expect(source).toBeVisible();
		await expect(main(page).getByText('2 vị trí ảnh cần bổ sung')).toBeVisible();
		if (screenshotDir)
			await page.screenshot({ path: `${screenshotDir}/editor-desktop.png`, fullPage: true });
		await main(page).getByLabel('Bổ sung ảnh 2: Ví dụ thực tế').setInputFiles(image);
		await expect(source).toHaveValue(/!\[Ví dụ thực tế\]\(\/uploads\//);
		await main(page).getByLabel('Bổ sung ảnh 3: Ảnh cũ').setInputFiles(image);
		await expect(main(page).locator('.ln-image-picker__slots')).toHaveCount(0);
		const updated = (await source.inputValue()) + '\n\nNội dung bổ sung sau khi tải ảnh.';
		await source.fill(updated);
		await main(page).getByRole('button', { name: 'Lưu', exact: true }).click();
		await expect(main(page).getByRole('button', { name: /Đã lưu/ })).toBeVisible();
		await page.reload();
		await expect(source).toHaveValue(updated);
		await main(page).getByRole('button', { name: 'Tìm bài hoặc mục…' }).click();
		await main(page).getByRole('textbox', { name: 'Lọc mục' }).fill('minh hoa');
		await main(page)
			.getByRole('option', { name: /Minh họa trong bài/ })
			.click();
		await expect(source).toHaveValue(updated);
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(source).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			),
		).toBeLessThanOrEqual(1);
		if (screenshotDir)
			await page.screenshot({ path: `${screenshotDir}/editor-mobile.png`, fullPage: true });
	} finally {
		await deleteCourse(course.id);
	}
});

async function pasteText(target: ReturnType<Page['locator']>, text: string) {
	await target.evaluate((element, value) => {
		const data = new DataTransfer();
		data.setData('text/plain', value);
		element.dispatchEvent(
			new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
		);
	}, text);
}

test('asks for pictures where pasted text has captions, and parses Markdown pasted into the visual editor', async ({
	page,
	context,
}) => {
	test.setTimeout(60_000);
	await addAdminSession(context);
	const created = await context.request.post('/api/admin/learn/courses', {
		data: { title: `Image hints ${randomUUID()}` },
	});
	expect(created.status()).toBe(201);
	const course = (await created.json()).data as { id: string; slug: string };
	const screenshotDir = process.env.COURSE_UX_SCREENSHOTS;
	try {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto(`/khoa-hoc/${course.slug}/studio`);
		await main(page).getByRole('button', { name: 'Nhập nội dung', exact: true }).click();
		const box = main(page).getByRole('textbox', { name: 'Nội dung dán' });
		await box.focus();
		await pasteText(
			box,
			'Kết quả:\n\n````markdown\n# Bài có hình\n\n## Lập kế hoạch\n\nNội dung mở đầu.\n\nHình 2.1: Quy trình lập kế hoạch\n\nĐoạn giữa.\n\n[Hình ảnh: sơ đồ tổ chức]\n\nĐoạn cuối.\n\nHình 2.2: Ma trận\n\n[Hình 2.2]\n````',
		);
		await expect(box).not.toHaveValue(/````/);
		// "[Hình 2.2]" beside its own caption is one picture, so three places, not four.
		await expect(main(page).getByText('3 chỗ có vẻ cần ảnh', { exact: false })).toBeVisible();
		if (screenshotDir)
			await page.screenshot({ path: `${screenshotDir}/import-hints.png`, fullPage: true });
		await main(page).getByRole('button', { name: 'Tạo ô ảnh' }).click();
		await expect(main(page).getByText('3 vị trí ảnh cần bổ sung')).toBeVisible();
		await expect(box).toHaveValue(/!\[Hình 2\.1: Quy trình lập kế hoạch\]\(\)\n\nHình 2\.1:/);
		await expect(box).toHaveValue(/Hình 2\.2: Ma trận\n\n!\[Hình 2\.2: Ma trận\]\(\)/);
		await main(page).getByRole('button', { name: 'Lưu 1 mục', exact: true }).click();
		await expect(main(page).getByRole('heading', { name: 'Nhập nội dung' })).toHaveCount(0);

		await main(page).getByRole('tab', { name: 'Soạn trực quan' }).click();
		const editor = main(page).locator('.ln-editor__content');
		await editor.click();
		await page.keyboard.press('ControlOrMeta+End');
		await pasteText(
			editor,
			'## Mục dán\n\n| Cột A | Cột B |\n| --- | --- |\n| 1 | 2 |\n\n> [!NOTE] Ghi chú\n> nội dung\n\nSơ đồ 3: Cơ cấu tổ chức',
		);
		await expect(editor.locator('table')).toBeVisible();
		await expect(editor.getByRole('heading', { name: 'Mục dán' })).toBeVisible();
		await expect(editor).not.toContainText('[!NOTE]');
		await expect(main(page).getByText('1 chỗ có vẻ cần ảnh', { exact: false })).toBeVisible();
		if (screenshotDir)
			await page.screenshot({ path: `${screenshotDir}/editor-hints.png`, fullPage: true });
		await main(page).getByRole('button', { name: 'Tạo ô ảnh' }).click();
		await main(page)
			.getByRole('tab', { name: /Markdown/ })
			.click();
		await expect(main(page).getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue(
			/!\[Sơ đồ 3: Cơ cấu tổ chức\]\(\)\n\nSơ đồ 3: Cơ cấu tổ chức/,
		);
	} finally {
		await deleteCourse(course.id);
	}
});

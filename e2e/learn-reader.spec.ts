import { expect, test, type BrowserContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { addAdminSession, addStudentSession } from './helpers/adminSession';

async function screenshot(page: import('@playwright/test').Page, name: string) {
	const directory = process.env.UI_UX_SCREENSHOT_DIR;
	if (!directory) return;
	await mkdir(directory, { recursive: true });
	await page.screenshot({ path: join(directory, `${name}.png`) });
}

// Fixtures are created and removed through the app, on a local test server only.
test.beforeAll(() => {
	const host = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname;
	if (!['localhost', '127.0.0.1', '[::1]'].includes(host))
		throw new Error('Learn reader E2E requires a local test server');
});

async function fixture(context: BrowserContext, markdown = 'Nội dung đọc thử.') {
	await addAdminSession(context);
	const request = context.request;
	const created = await request.post('/api/admin/learn/courses', {
		data: { title: `Reader E2E ${randomUUID()}` },
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
		const lesson = (await added.json()).data as { id: string; sections: { id: string }[] };
		// The course also contains its initial default reading.
		const sections: string[] = [];
		for (const [index, title] of ['Bài đọc đầu', 'Bài đọc tiếp'].entries()) {
			let id = lesson.sections[0].id;
			if (index > 0) {
				const section = await request.post(`/api/admin/learn/lessons/${lesson.id}/sections`, {
					data: { title, type: 'READING' },
				});
				expect(section.status()).toBe(201);
				id = (await section.json()).data.id as string;
			}
			sections.push(id);
			expect(
				(
					await request.patch(`/api/admin/learn/sections/${id}`, {
						data: { title, markdown: index === 0 ? markdown : 'Bài thứ hai.' },
					})
				).ok(),
			).toBe(true);
		}
		expect(
			(
				await request.patch(`/api/admin/learn/courses/${course.id}`, {
					data: { status: 'PUBLISHED' },
				})
			).ok(),
		).toBe(true);
		await addStudentSession(context);
		return { slug: course.slug, sections, cleanup };
	} catch (error) {
		await cleanup();
		throw error;
	}
}

for (const width of [1440, 390]) {
	test(`completion waits for a slow save and opens an unfinished next section at ${width}px`, async ({
		page,
		context,
	}) => {
		await page.setViewportSize({ width, height: 900 });
		const course = await fixture(context);
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		let requests = 0;
		try {
			const first = `/my-space/courses/${course.slug}?s=${course.sections[0]}`;
			await page.goto(first);
			await expect(page.getByRole('heading', { name: 'Bài đọc đầu', exact: true })).toBeVisible();
			await expect(page.locator('.ln-topbar__count:visible')).toHaveText('0/3');
			await page.route(`**/api/learn/sections/${course.sections[0]}/progress`, async (route) => {
				if (route.request().method() === 'PATCH') {
					requests += 1;
					await gate;
				}
				await route.continue();
			});
			await page.getByRole('button', { name: 'Hoàn thành & tiếp →', exact: true }).click();
			const saving = page.getByRole('button', { name: 'Đang lưu…', exact: true });
			await expect(saving).toBeDisabled();
			await expect(page.locator('.ln-complete:visible').getByRole('link')).toHaveCount(0);
			await expect.poll(() => requests).toBe(1);
			await page.keyboard.press('Enter');
			expect(requests).toBe(1);
			expect(new URL(page.url()).searchParams.get('s')).toBe(course.sections[0]);
			await screenshot(page, `learn-saving-${width}`);
			release();
			await expect(page).toHaveURL(new RegExp(`s=${course.sections[1]}$`));
			await expect(page.getByRole('heading', { name: 'Bài đọc tiếp', exact: true })).toBeVisible();
			await expect(page.locator('.ln-topbar__count:visible')).toHaveText('1/3');
			await expect(
				page.getByRole('button', { name: 'Hoàn thành & tiếp →', exact: true }),
			).toBeVisible();
			await screenshot(page, `learn-next-${width}`);
			await page.goto(first);
			await expect(page.locator('.ln-reader:visible .ln-reader__done')).toHaveText(
				'✓ Đã hoàn thành',
			);
			await expect(page.locator('.ln-topbar__count:visible')).toHaveText('1/3');
			await page.getByRole('button', { name: 'Bỏ đánh dấu', exact: true }).click();
			await expect(page.locator('.ln-topbar__count:visible')).toHaveText('0/3');
			await page.setViewportSize({ width: width === 1440 ? 390 : 1440, height: 900 });
			await expect(
				page.getByRole('button', { name: 'Hoàn thành & tiếp →', exact: true }),
			).toBeVisible();
		} finally {
			release();
			await course.cleanup();
		}
	});
}

test('a real Mermaid diagram renders only after approaching the viewport', async ({
	page,
	context,
}) => {
	const paragraphs = Array.from(
		{ length: 50 },
		(_, i) =>
			`Đoạn ${i + 1}. Nội dung dài để đọc trước khi tới sơ đồ. ${'Đọc và suy nghĩ. '.repeat(12)}`,
	).join('\n\n');
	const course = await fixture(
		context,
		`${paragraphs}\n\n\`\`\`mermaid\ngraph TD\nA[Đọc] --> B[Hiểu]\n\`\`\``,
	);
	try {
		await page.goto(`/my-space/courses/${course.slug}?s=${course.sections[0]}`);
		await expect(page.getByRole('heading', { name: 'Bài đọc đầu', exact: true })).toBeVisible();
		const diagram = page.locator('.ln-reader:visible .ln-diagram');
		await expect(diagram).toHaveCount(1);
		await expect(diagram).toHaveAttribute('aria-busy', 'true');
		await expect(diagram.locator('svg')).toHaveCount(0);
		await diagram.scrollIntoViewIfNeeded();
		await expect(diagram.locator('svg')).toBeVisible({ timeout: 15_000 });
		await expect(diagram).not.toHaveAttribute('aria-busy', 'true');
		await screenshot(page, 'learn-mermaid');
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true,
		);
	} finally {
		await course.cleanup();
	}
});

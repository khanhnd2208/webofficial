import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

// This test creates disposable fixtures only through the local application APIs.
test('Teaching surfaces keep their theme, overlays and responsive navigation', async ({
	page,
	context,
}) => {
	test.setTimeout(180_000);
	expect(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname).toMatch(
		/^(localhost|127\.0\.0\.1)$/,
	);
	await addAdminSession(context);
	const suffix = Date.now().toString(36);
	const created = await page.request.post('/api/admin/teaching/classes', {
		data: {
			courseCode: `UI${suffix}`.slice(0, 10),
			courseName: 'Quản trị nguồn nhân lực và phát triển tổ chức',
			groupNo: '39-01',
			term: `E2E UI ${suffix}`,
			totalWeeks: 10,
		},
	});
	expect(created.ok()).toBe(true);
	const { data: fixture } = await created.json();
	const tutorials = await page.request.get(`/api/admin/teaching/classes/${fixture.id}/tutorials`);
	const tutorialId = (await tutorials.json()).data[0].id;
	const slug = `ui-teaching-${suffix}`;
	const phase = process.env.TEACHING_VISUAL_BASELINE ? 'before' : 'after';
	const directory = `/tmp/teaching-ui-review/${phase}`;
	await mkdir(directory, { recursive: true });
	try {
		expect(
			(
				await page.request.patch(`/api/admin/teaching/classes/${fixture.id}/public`, {
					data: {
						publicSlug: slug,
						publicTitle: 'Quản trị nguồn nhân lực',
						publicSummary: 'Thông tin lớp, tài liệu và tiến độ học tập của bạn.',
						publicDescription: 'Cùng tìm hiểu con người, tổ chức và các quyết định quản trị.',
						publicAnnouncement: 'Tuần 1 · Chuẩn bị tài liệu trước buổi học.',
						links: [],
					},
				})
			).ok(),
		).toBe(true);
		expect(
			(
				await page.request.patch(`/api/admin/teaching/classes/${fixture.id}/share`, {
					data: { shared: true },
				})
			).ok(),
		).toBe(true);
		for (let i = 0; i < 12; i++) {
			expect(
				(
					await page.request.post(`/api/admin/teaching/classes/${fixture.id}/enrollments`, {
						data: {
							studentCode: `UI${suffix}${i}`,
							familyName: i === 0 ? 'Nguyễn Thị Hoàng Phương' : 'Nguyễn Văn',
							givenName: i === 0 ? 'Minh Anh' : `An ${i + 1}`,
							orderNo: i + 1,
							tutorialClassId: tutorialId,
						},
					})
				).ok(),
			).toBe(true);
		}
		const deckResponse = await page.request.post(
			`/api/admin/teaching/courses/${fixture.courseId}/recall`,
			{
				data: {
					title: `Ôn tập quản trị ${suffix}`,
					status: 'DRAFT',
					cards: [
						{
							question: 'Quản trị nguồn nhân lực là gì?',
							answer: 'Các quyết định và hoạt động liên quan đến con người trong tổ chức.',
						},
						{
							question: 'Ai tham gia quản trị nguồn nhân lực?',
							answer: 'Nhà quản lý và bộ phận nhân sự.',
						},
					],
				},
			},
		);
		expect(deckResponse.ok()).toBe(true);
		const draft = (await deckResponse.json()).data;
		const published = await page.request.patch(
			`/api/admin/teaching/courses/${fixture.courseId}/recall/${draft.id}`,
			{ data: { status: 'PUBLISHED', expectedUpdatedAt: draft.updatedAt } },
		);
		expect(published.ok()).toBe(true);
		const deck = (await published.json()).data;
		for (const width of [360, 390, 768, 1280, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			for (const [name, url] of [
				['home', '/my-space/teaching'],
				['course', `/my-space/teaching/courses/${fixture.courseId}`],
				['attendance', `/my-space/teaching/${fixture.id}`],
				['cp', `/my-space/teaching/${fixture.id}?tab=cp`],
				['public', `/lop/${slug}`],
				['students', `/my-space/teaching/${fixture.id}?tab=students`],
				['setup', `/my-space/teaching/${fixture.id}?tab=setup`],
				['notes', `/my-space/teaching/${fixture.id}?tab=notes`],
				['recall', `/my-space/teaching/${fixture.id}?tab=recall`],
				['share', `/my-space/teaching/${fixture.id}?tab=share`],
				['learning', `/lop/${slug}?tab=learning`],
				['player', `/lop/${slug}/active-recall/${deck.slug}`],
			]) {
				await page.goto(url);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				if (name === 'learning')
					await expect(
						page.getByRole('heading', { name: 'Mở trải nghiệm học tập của bạn' }),
					).toBeVisible();
				if (!process.env.TEACHING_VISUAL_BASELINE) {
					await expect(page.locator('[data-surface="teaching"]').first()).toHaveCSS(
						'background-color',
						'rgb(247, 248, 244)',
					);
					await page.screenshot({
						path: `${directory}/${name}-${width}.png`,
						fullPage: true,
						style: 'nextjs-portal { display: none; }',
					});
					const overflow = await page.evaluate(() =>
						[...document.querySelectorAll('body *')]
							.filter((el) => {
								const r = el.getBoundingClientRect();
								return (
									r.width &&
									r.right > innerWidth + 1 &&
									getComputedStyle(el).position !== 'fixed' &&
									!el.closest('.mc-grid-wrap')
								);
							})
							.slice(0, 10)
							.map((el) => ({
								tag: el.tagName,
								cls: el.className,
								right: el.getBoundingClientRect().right,
							})),
					);
					expect(
						await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
						`${name} ${width}: ${JSON.stringify(overflow)}`,
					).toBe(true);
				}
				await page.screenshot({
					path: `${directory}/${name}-${width}.png`,
					fullPage: true,
					style: 'nextjs-portal { display: none; }',
				});
			}
		}
		if (!process.env.TEACHING_VISUAL_BASELINE) {
			await page.setViewportSize({ width: 1280, height: 900 });
			await page.goto('/my-space/teaching');
			await expect(page.getByRole('button', { name: /Đang dạy/ })).toBeVisible();
			await page.goto(`/lop/${slug}`);
			await page.getByLabel('Đây là tôi').selectOption({ index: 1 });
			await expect(page.getByText(/Bạn: vắng/)).toBeVisible();
			await page.getByRole('button', { name: 'Bỏ chọn' }).click();
			await expect(page.getByText(/Bạn: vắng/)).toHaveCount(0);
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(`/lop/${slug}/active-recall/${deck.slug}`);
			await expect(page.locator('.recall-lang-chip')).toHaveCSS('animation-name', 'none');
			await page.getByRole('button', { name: 'Hiện đáp án', exact: true }).click();
			await expect(page.locator('.recall-card')).toHaveAttribute('data-side', 'answer');
			await page.getByRole('button', { name: 'Tiếp →' }).click();
			await expect(page.locator('.recall-card')).toHaveAttribute('data-side', 'question');
			await expect(page.locator('.recall-card .recall-text')).toContainText('Ai tham gia');
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await page.setViewportSize({ width: 1280, height: 900 });
			await page.goto(`/my-space/teaching/${fixture.id}`);
			await page.getByLabel('Chọn tuần trên bảng').selectOption('3');
			await expect(page).toHaveURL(/week=3/);
			await page.getByRole('link', { name: 'Điểm CP', exact: true }).click();
			await expect(page).toHaveURL(/tab=cp.*week=3/);
			await page.getByLabel('Chọn tuần trên bảng').selectOption('');
			await page.getByRole('link', { name: 'Điểm danh', exact: true }).click();
			await expect(page).not.toHaveURL(/week=/);
			const trigger = page.getByRole('button', { name: 'Mở menu quản lý' });
			await trigger.click();
			const menu = page.getByRole('menu', { name: 'Quản lý lớp' });
			await expect(menu).toBeVisible();
			await expect(menu).toHaveCSS('--accent', '#176b63');
			await page.keyboard.press('Escape');
			await expect(trigger).toBeFocused();
			await page.setViewportSize({ width: 390, height: 900 });
			await page.getByRole('button', { name: 'Mở menu quản lý' }).click();
			const sheet = page.getByRole('dialog', { name: 'Quản lý lớp' });
			await expect(sheet).toHaveAttribute('data-surface', 'teaching');
			await page.keyboard.press('Escape');
			await page.goto(`/lop/${slug}`);
			await page.getByRole('tab', { name: 'Điểm CP', exact: true }).click();
			await expect(page).toHaveURL(/tab=cp/);
			await page.goBack();
			await expect(page.getByRole('tab', { name: 'Điểm danh', exact: true })).toHaveAttribute(
				'aria-selected',
				'true',
			);
			for (const path of ['/my-space/my-class', '/my-space/board-game', '/muc-luc']) {
				const response = await page.goto(path);
				await expect(page.locator('[data-surface="teaching"]')).toHaveCount(0);
				if (path === '/my-space/my-class' && response?.status() !== 404)
					await expect(page.locator('.mc').first()).toHaveCSS('--accent', '#3525cd');
			}
		}
	} finally {
		await cleanupTeachingClass(page.request, fixture.id);
		await page.request.patch(`/api/admin/teaching/courses/${fixture.courseId}`, {
			data: { status: 'ARCHIVED' },
		});
	}
});

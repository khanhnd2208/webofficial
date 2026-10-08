import { expect, test } from '@playwright/test';

import { addAdminSession, addStudentSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

/**
 * Links already handed to students must keep working after any URL change: the class board
 * (`/lop/<slug>`) and both spellings of a course (`/my-space/courses/<slug>` and `/khoa-hoc/<slug>`).
 */
test.describe('Links shared with students keep working', () => {
	test('both course spellings send a signed-out student to sign in and back to the same URL', async ({
		page,
	}) => {
		for (const path of ['/my-space/courses/itm?s=bai-1', '/khoa-hoc/hrm']) {
			await page.goto(path);
			await expect(page).toHaveURL(/\/dang-nhap\?/);
			expect(new URL(page.url()).searchParams.get('from')).toBe(path);
		}
	});

	test('old board-game links go to fun.toiladuykhanh.com', async ({ request }) => {
		const cases = [
			['/my-space/board-game', 'https://fun.toiladuykhanh.com/'],
			['/my-space/board-game/spy-fall', 'https://fun.toiladuykhanh.com/spy-fall'],
			[
				'/my-space/board-game/ma-soi/room/AB12CD',
				'https://fun.toiladuykhanh.com/ma-soi/room/AB12CD',
			],
			[
				'/my-space/board-game/cheese-thief/room/ZZ99',
				'https://fun.toiladuykhanh.com/cheese-thief/room/ZZ99',
			],
		] as const;
		for (const [path, location] of cases) {
			const response = await request.get(path, { maxRedirects: 0 });
			expect(response.status(), path).toBe(307);
			expect(response.headers().location, path).toBe(location);
		}
	});

	test('the retired Chương–Bài course links land on the course catalog', async ({ request }) => {
		for (const path of ['/hoc/khoa-hoc/quan-tri/bai/bai-1', '/tai-khoan/hoc', '/dashboard']) {
			const response = await request.get(path, { maxRedirects: 0 });
			expect(response.status(), path).toBe(308);
			expect(new URL(response.headers().location, 'http://x').pathname, path).toBe('/khoa-hoc');
		}
	});

	test('public course catalog and learner catalog remain accessible once signed in', async ({
		page,
		context,
	}) => {
		await addStudentSession(context);
		// The learner catalog keeps its app bar; /khoa-hoc is now the public catalog.
		for (const path of ['/my-space/courses', '/khoa-hoc', '/kham-pha-khoa-hoc']) {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
			await expect(page).toHaveURL(new RegExp(`${path}$`));
			// The public header works for both empty and populated catalogs.
			const tocLink =
				path === '/my-space/courses'
					? page.getByRole('link', { name: 'Mục lục', exact: true })
					: page.getByTestId('site-header-home');
			await expect(tocLink).toBeVisible();
			await expect(tocLink).toHaveAttribute('href', '/muc-luc');
		}
	});

	test('a missing course says so and points to the catalog, under either spelling', async ({
		page,
		context,
	}) => {
		await addStudentSession(context);
		for (const path of ['/my-space/courses/no-such-course', '/khoa-hoc/no-such-course']) {
			// The course pages stream (loading.tsx), so the 404 arrives as a page, not a status code.
			await page.goto(path);
			await expect(page.getByRole('heading', { name: 'Chưa mở được khóa học này' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Xem các khóa học' })).toHaveAttribute(
				'href',
				'/khoa-hoc',
			);
		}
	});

	test('a class link opens its board, and Admin lists that class with its student page', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const slug = `e2e-legacy-${suffix}`;
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `LGC${suffix}`.slice(0, 10),
				courseName: 'Legacy link E2E',
				groupNo: '97',
				term: `E2E ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;

		try {
			const publicPage = await page.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
				data: {
					publicSlug: slug,
					publicTitle: 'Legacy link E2E',
					publicSummary: '',
					publicDescription: '',
					publicAnnouncement: '',
					links: [],
				},
			});
			expect(publicPage.ok()).toBe(true);
			const shared = await page.request.patch(`/api/admin/teaching/classes/${classId}/share`, {
				data: { shared: true },
			});
			expect(shared.ok()).toBe(true);

			await context.clearCookies();
			const board = await page.goto(`/lop/${slug}`);
			expect(board?.status()).toBe(200);
			await expect(page.getByRole('link', { name: /Mục lục/ })).toBeVisible();

			// An old #my-space bookmark just opens the flat Mục lục. The class shortcut lives on Admin.
			await page.goto('/muc-luc#my-space');
			await expect(page.getByTestId('myspace-tile-courses')).toBeVisible();
			await expect(page.getByTestId('recent-classes')).toHaveCount(0);
			await addAdminSession(context);
			await page.goto('/admin');
			const classes = page.getByRole('region', { name: 'Lớp đang dạy' });
			await expect(
				classes.getByRole('link', { name: /Trang lớp của Legacy link E2E/ }),
			).toHaveAttribute('href', `/lop/${slug}`);
			await expect(classes.getByRole('link', { name: /^Legacy link E2E/ })).toHaveAttribute(
				'href',
				`/my-space/teaching/${classId}`,
			);
		} finally {
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('a missing class explains itself instead of a bare 404', async ({ page }) => {
		const response = await page.goto('/lop/no-such-class-ever');
		expect(response?.status()).toBe(404);
		await expect(page.getByRole('heading', { name: 'Chưa mở được trang lớp này' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Mở mục lục' })).toBeVisible();
	});
});

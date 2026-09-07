import { expect, test } from '@playwright/test';

const viewports = [
	{ width: 320, height: 720 },
	{ width: 390, height: 844 },
	{ width: 768, height: 900 },
	{ width: 1024, height: 900 },
	{ width: 1440, height: 900 },
];

test.describe('Editorial premium public experience', () => {
	for (const viewport of viewports) {
		test(`has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
			await page.setViewportSize(viewport);
			await page.goto('/');
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
			);
			expect(overflow).toBe(false);
		});
	}

	test('keeps the intro cover centered without contact chrome on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const intro = page.getByTestId('intro-home');
		await expect(intro).toBeVisible();
		await expect(page.getByRole('heading', { level: 1, name: /Trở thành/i })).toBeVisible();
		await expect(page.getByTestId('contact-fab')).toHaveCount(0);
		const introBox = await intro.boundingBox();
		expect(introBox).not.toBeNull();
		expect(introBox!.x + introBox!.width / 2).toBeGreaterThan(140);
		expect(introBox!.x + introBox!.width / 2).toBeLessThan(250);
	});

	test('routes visitors from intro through My Space to Teaching', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		await page.locator('a[href="/muc-luc"]').last().click();
		await expect(page).toHaveURL(/\/muc-luc/);
		const gate = page.getByRole('navigation', { name: 'Cổng trang' });
		await expect(gate.getByRole('link')).toHaveCount(4);
		await expect(gate.getByTestId('gate-item-locked')).toHaveCount(0);

		await page.getByRole('link', { name: /My Space/i }).click();
		await expect(page).toHaveURL(/\/my-space$/);
		await page.getByTestId('myspace-tile-teaching').click();
		await expect(page).toHaveURL(/\/dang-nhap|\/my-space\/teaching/);
	});

	test('services stay condensed with journey graphics and no project proof', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/dich-vu');
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: /Chúng ta có thể bắt đầu từ một việc bạn muốn làm tốt hơn/i,
			}),
		).toBeVisible();
		await expect(page.getByText(/không bị quảng cáo/i)).toHaveCount(0);
		await expect(page.getByText('Khi nào hướng này hữu ích?')).toHaveCount(0);
		await expect(page.locator('#management-learning')).toBeVisible();
		await expect(page.locator('#applied-ai')).toBeVisible();
		await expect(page.locator('#learning-programs')).toBeVisible();
		await expect(page.getByText('Giảng viên đại học')).toBeVisible();
		await expect(
			page.getByRole('heading', {
				name: /Một chương trình phù hợp không bắt đầu từ slide/i,
			}),
		).toBeVisible();
		await expect(page.getByRole('heading', { name: /Có thể chưa phù hợp nếu/i })).toHaveCount(0);
		await expect(page.getByText('Nhìn lại công việc')).toHaveCount(0);
		await expect(
			page.getByRole('heading', { name: /Một vài câu hỏi thường gặp/i }),
		).toBeVisible();
		await expect(page.getByRole('link', { name: /Gửi lời nhắn/i }).first()).toBeVisible();
		await expect(page.getByRole('heading', { name: /^Dự án$/i })).toHaveCount(0);
	});

	test('keeps a small portfolio honest without empty filters or temporary visuals', async ({
		page,
	}) => {
		await page.goto('/du-an');
		await expect(page.getByRole('heading', { level: 1, name: /^Dự án$/i })).toBeVisible();
		await expect(page.getByLabel('Lọc dự án')).toHaveCount(0);
		await expect(page.getByText('Đầu ra nổi bật')).toHaveCount(0);
		await expect(page.getByText(/giới hạn của bằng chứng/i)).toHaveCount(0);
		await page.goto('/du-an/ai50-ai-cho-moi-nguoi');
		await expect(page.getByText('Visual tạm thời')).toHaveCount(0);
		await expect(page.getByText(/Hình minh họa tạm thời/i )).toHaveCount(0);
		await expect(page.getByText(/Minh họa đang chờ được thay/i )).toHaveCount(0);
		await expect(page.getByText('Điều tôi học được')).toBeVisible();
		await expect(page.getByText('Giả định làm việc hiện tại')).toHaveCount(0);
		await expect(page.getByText(/Trao đổi với tôi về dự án này/i )).toBeVisible();
		await page.goto('/du-an/ai-in-recruitment-research');
		await expect(page.getByRole('heading', { name: 'Giả định làm việc' })).toBeVisible();
		await expect(page.getByText('Điều dự án chứng minh')).toHaveCount(0);
	});

	test('contact form starts empty for guests and exposes clear fields', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(
			page.getByRole('heading', { level: 1, name: /Gửi tôi một lời nhắn/i }),
		).toBeVisible();
		await expect(page.getByLabel('Tên')).toHaveValue('');
		await expect(page.getByLabel('Email')).toHaveValue('');
		await expect(page.getByLabel(/Thời gian dự kiến/)).toBeVisible();
		await expect(page.getByText(/Đang kiểm tra thông tin tài khoản/i )).toHaveCount(0);
	});
});

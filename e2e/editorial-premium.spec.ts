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

	test('puts the mobile value proposition before the artwork', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const heading = page.getByRole('heading', { level: 1 });
		const artwork = page.getByTestId('home-hero-artwork');
		const [headingBox, artworkBox] = await Promise.all([
			heading.boundingBox(),
			artwork.boundingBox(),
		]);
		expect(headingBox).not.toBeNull();
		expect(artworkBox).not.toBeNull();
		expect(headingBox!.y).toBeLessThan(artworkBox!.y);
	});

	test('routes visitors from classroom work to project proof and services', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'AI50 — AI cho mọi người' })).toBeVisible();
		await expect(
			page.getByRole('link', { name: /AI50 — AI cho mọi người/i }).first(),
		).toHaveAttribute('href', '/du-an/ai50-ai-cho-moi-nguoi');
		await expect(page.getByRole('link', { name: /Learning at Moonie Café/i }).first()).toHaveAttribute(
			'href',
			'/du-an/learning-at-moonie-cafe',
		);
		await expect(page.getByRole('link', { name: /Xem các hình thức cộng tác/i })).toHaveAttribute(
			'href',
			'/dich-vu',
		);
		await expect(page.getByRole('link', { name: /Gửi tôi một lời nhắn/i })).toHaveAttribute(
			'href',
			/\/lien-he/,
		);
	});

	test('mobile menu traps the public journey and closes with Escape', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await page.getByRole('button', { name: 'Mở menu' }).click();
		const dialog = page.getByRole('dialog', { name: 'Menu điều hướng' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('link', { name: /Gửi lời nhắn/i })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(dialog).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Mở menu' })).toBeFocused();
	});

	test('services stay scannable without catalogue jargon', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/dich-vu');
		await expect(
			page.getByRole('heading', { level: 1, name: /Ba cách chúng ta có thể cùng làm việc/i }),
		).toBeVisible();
		await expect(page.getByText(/không bị quảng cáo/i)).toHaveCount(0);
		await expect(page.getByText('Có thể không phù hợp nếu')).toHaveCount(0);
		await expect(page.getByText('Kết quả hướng tới')).toHaveCount(0);

		const appliedAi = page.locator('#applied-ai');
		await expect(
			appliedAi.getByRole('heading', { name: /Thiết kế và đào tạo AI/i }),
		).toBeVisible();
		await expect(appliedAi.getByText('Khi nào hướng này hữu ích?')).toBeVisible();
		await expect(
			appliedAi.getByRole('link', { name: /Trao đổi về một chương trình AI/i }),
		).toBeVisible();
		await expect(appliedAi.getByRole('link', { name: /AI50/i })).toBeVisible();
		await expect(page.getByText(/Cách làm này phù hợp nhất khi/i)).toBeVisible();
	});

	test('keeps a small portfolio honest without empty filters or temporary visuals', async ({
		page,
	}) => {
		await page.goto('/du-an');
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: /Những điều tôi đang làm và tiếp tục hoàn thiện/i,
			}),
		).toBeVisible();
		await expect(page.getByLabel('Lọc dự án')).toHaveCount(0);
		await expect(page.getByText('Đầu ra nổi bật')).toHaveCount(0);
		await expect(page.getByText(/giới hạn của bằng chứng/i)).toHaveCount(0);
		await page.goto('/du-an/ai50-ai-cho-moi-nguoi');
		await expect(page.getByText('Visual tạm thời')).toHaveCount(0);
		await expect(page.getByText(/Hình minh họa tạm thời/i)).toHaveCount(0);
		await expect(page.getByText(/Minh họa đang chờ được thay/i)).toHaveCount(0);
		await expect(page.getByText('Điều tôi học được')).toBeVisible();
		await expect(page.getByText('Giả định làm việc hiện tại')).toHaveCount(0);
		await page.goto('/du-an/ai-in-recruitment-research');
		await expect(page.getByText('Giả định làm việc hiện tại')).toBeVisible();
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
		await expect(page.getByText(/Đang kiểm tra thông tin tài khoản/i)).toHaveCount(0);
	});
});

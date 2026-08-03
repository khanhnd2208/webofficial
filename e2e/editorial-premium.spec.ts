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

	test('routes visitors from a need to the relevant offer and proof', async ({ page }) => {
		await page.goto('/');
		const need = page.getByRole('heading', { name: 'Tôi muốn đào tạo một đội ngũ' });
		await expect(need).toBeVisible();
		const block = page.locator('article').filter({ has: need });
		await expect(block.getByRole('link', { name: 'Xem giải pháp đào tạo' })).toHaveAttribute(
			'href',
			'/dich-vu#applied-ai',
		);
		await expect(block.getByRole('link', { name: 'Xem chương trình AI50' })).toHaveAttribute(
			'href',
			'/du-an/ai50-ai-cho-moi-nguoi',
		);
	});

	test('mobile menu traps the public journey and closes with Escape', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await page.getByRole('button', { name: 'Mở menu' }).click();
		const dialog = page.getByRole('dialog', { name: 'Menu điều hướng' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('link', { name: /Chọn nội dung trao đổi/i })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(dialog).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Mở menu' })).toBeFocused();
	});

	test('services are scannable and project evidence remains reachable', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/dich-vu');
		await expect(page.getByRole('navigation', { name: 'Chọn hướng hỗ trợ' })).toBeVisible();

		const appliedAi = page.locator('#applied-ai');
		await expect(
			appliedAi.getByRole('heading', { name: /Đào tạo và thiết kế chương trình AI/i }),
		).toBeVisible();
		await expect(appliedAi.getByText('Kết quả hướng tới')).toBeVisible();
		await expect(appliedAi.getByText('Có thể không phù hợp nếu')).toBeVisible();
		await expect(appliedAi.getByRole('link', { name: 'Nhận đề xuất chương trình AI' })).toBeVisible();

		const disclosure = appliedAi.locator('details');
		await expect(disclosure.locator('summary')).toContainText('Hình thức, đầu ra và cách làm');
		await disclosure.locator('summary').click();
		await expect(disclosure).toHaveAttribute('open', '');
		await expect(appliedAi.getByText('Đầu ra cụ thể')).toBeVisible();
		await expect(appliedAi.getByRole('link', { name: /AI50/i })).toBeVisible();
	});

	test('keeps a small portfolio honest without empty filters or fake impact', async ({ page }) => {
		await page.goto('/du-an');
		await expect(page.getByLabel('Lọc dự án')).toHaveCount(0);
		await expect(page.getByText('Vai trò').first()).toBeVisible();
		await page.goto('/du-an/ai50-ai-cho-moi-nguoi');
		await expect(page.getByText('Phạm vi & cấu phần')).toBeVisible();
		await expect(page.getByText('Tác động đã xác minh')).toHaveCount(0);
		await expect(page.getByText(/Hình minh họa tạm thời/).first()).toBeVisible();
	});

	test('contact form starts empty for guests and exposes clear fields', async ({ page }) => {
		await page.goto('/lien-he');
		await expect(
			page.getByRole('heading', { level: 1, name: /Chọn nội dung muốn trao đổi/i }),
		).toBeVisible();
		await expect(page.getByLabel('Họ và tên')).toHaveValue('');
		await expect(page.getByLabel('Email nhận phản hồi')).toHaveValue('');
		await expect(page.getByLabel(/Thời gian dự kiến/)).toBeVisible();
		await expect(page.getByText(/Đang kiểm tra thông tin tài khoản/i)).toHaveCount(0);
	});
});

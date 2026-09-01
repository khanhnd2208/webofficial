import { expect, test, type Locator, type Page } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

async function pointerDrag(page: Page, source: Locator, target: Locator) {
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();
	expect(sourceBox).not.toBeNull();
	expect(targetBox).not.toBeNull();
	await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
	await page.mouse.down();
	await page.mouse.move(
		sourceBox!.x + sourceBox!.width / 2 + 12,
		sourceBox!.y + sourceBox!.height / 2,
		{ steps: 3 },
	);
	await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, {
		steps: 14,
	});
	await page.mouse.up();
}

test.describe('Teaching group board UX', () => {
	test.skip(
		process.env.TEACHING_GROUP_BOARD_ENABLED !== 'true',
		'Group board is disabled unless TEACHING_GROUP_BOARD_ENABLED=true',
	);
	test('keeps the desktop board compact and supports mobile sheet placement', async (
		{ page, context },
		testInfo,
	) => {
		await addAdminSession(context);
		const suffix = `${testInfo.workerIndex.toString(36)}${testInfo.repeatEachIndex}${Date.now().toString(36)}`;
		const slug = `e2e-groups-${suffix}`;
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `GRP${suffix}`.slice(0, 10),
				courseName: 'Group UX E2E',
				groupNo: '01',
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
					publicTitle: 'Group UX E2E',
					publicSummary: 'Group board test page.',
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
			const enrollment = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `UX${suffix}`,
						familyName: 'Nguyễn',
						givenName: 'Group',
						dateOfBirth: '2006-05-29',
					},
				},
			);
			expect(enrollment.ok()).toBe(true);
			const configured = await page.request.patch(`/api/admin/teaching/classes/${classId}/groups`, {
				data: { groupCount: 2, groupSize: 2 },
			});
			expect(configured.ok()).toBe(true);
			const configuredBoard = (await configured.json()) as {
				data: { groups: Array<{ id: string }> };
			};
			const opened = await page.request.patch(`/api/admin/teaching/classes/${classId}/groups`, {
				data: { open: true },
			});
			expect(opened.ok()).toBe(true);

			for (const viewport of [
				{ width: 768, height: 1024 },
				{ width: 1440, height: 900 },
				{ width: 1920, height: 1080 },
			]) {
				await page.setViewportSize(viewport);
				await page.goto(`/admin/teaching/${classId}?tab=groups`);
				await expect(page.getByTestId('group-grid')).toBeVisible();
				await expect(page.getByTestId('group-admin-desktop-controls')).toBeVisible();
				await expect(page.locator('.group-mobile-picker')).toHaveCount(0);
				const desktop = await page.evaluate(() => ({
					pageHeight: document.documentElement.scrollHeight,
					pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
					groupHeight:
						document.querySelector('.group-card-shell')?.getBoundingClientRect().height ?? 0,
					slotHeight: document.querySelector('.group-slot')?.getBoundingClientRect().height ?? 0,
					groupScrollHeight: document.querySelector('.group-grid-scroll')?.scrollHeight ?? 0,
					nameStyles: [...document.querySelectorAll<HTMLElement>('.group-student-name')].map(
						(name) => ({
							text: name.textContent,
							whiteSpace: getComputedStyle(name).whiteSpace,
							overflow: getComputedStyle(name).textOverflow,
						}),
					),
				}));
				expect(desktop.pageOverflow).toBeLessThanOrEqual(1);
				expect(desktop.groupHeight).toBeLessThanOrEqual(360);
				expect(desktop.slotHeight).toBeLessThanOrEqual(72);
				expect(desktop.groupScrollHeight).toBeGreaterThan(0);
				expect(desktop.pageHeight).toBeLessThan(2000);
				expect(
					desktop.nameStyles.every(
						(name) => name.whiteSpace !== 'nowrap' && name.overflow !== 'ellipsis',
					),
				).toBe(true);
			}

			await context.clearCookies();
			await page.setViewportSize({ width: 1440, height: 900 });
			const publicMoveBodies: Array<{ groupId: string | null; slotIndex?: number }> = [];
			page.on('request', (request) => {
				if (new URL(request.url()).pathname === `/api/teaching/classes/${slug}/groups/move`) {
					publicMoveBodies.push(request.postDataJSON() as { groupId: string | null; slotIndex?: number });
				}
			});
			await page.goto(`/lop/${slug}`);
			await page.getByRole('tab', { name: 'Xếp nhóm' }).click();
			const directDragCard = page.locator('[data-student-name="Nguyễn Group"]').first();
			const directDragTarget = page.locator('.group-slot-empty-state').first();
			await expect(directDragCard).toHaveAttribute('data-draggable', 'true');
			await pointerDrag(page, directDragCard, page.locator('.group-board-hint'));
			await expect(page.locator('.group-slot-filled')).toHaveCount(0);
			await expect(page.getByRole('button', { name: /Hoàn tác/ })).toBeDisabled();

			await pointerDrag(page, directDragCard, directDragTarget);
			await expect(page.locator('.group-slot-filled')).toHaveCount(1);
			await expect(page.getByRole('button', { name: /Hoàn tác/ })).toBeEnabled();
			await expect(page.getByText(/Đang chọn Nguyễn Group/)).toBeVisible();
			await expect(page.locator('.group-student-card-pending')).toHaveCount(0);
			await expect(page.locator('.group-student-card-drag')).toHaveCount(0);
			expect(publicMoveBodies).toHaveLength(1);
			expect(publicMoveBodies[0]).toMatchObject({
				groupId: configuredBoard.data.groups[0]!.id,
				slotIndex: 0,
			});

			const secondGroup = page.getByRole('region', { name: 'Nhóm 2' });
			await pointerDrag(
				page,
				page.locator('[data-student-name="Nguyễn Group"]').first(),
				secondGroup.locator('.group-slot-empty-state').first(),
			);
			await expect.poll(() => publicMoveBodies.length).toBe(2);
			expect(publicMoveBodies[1]).toMatchObject({
				groupId: configuredBoard.data.groups[1]!.id,
				slotIndex: 0,
			});
			await expect(secondGroup.locator('.group-slot-filled')).toHaveCount(1);
			await expect(page.locator('.group-slot-filled')).toHaveCount(1);
			await expect(page.locator('.group-student-card-pending')).toHaveCount(0);
			await expect(page.locator('.group-student-card-drag')).toHaveCount(0);

			await pointerDrag(
				page,
				page.locator('[data-student-name="Nguyễn Group"]').first(),
				page.locator('.group-unassigned-scroll'),
			);
			await expect(page.locator('.group-slot-filled')).toHaveCount(0);
			await expect(
				page.getByTestId('unassigned-list').locator('[data-student-name="Nguyễn Group"]'),
			).toBeVisible();
			expect(publicMoveBodies).toHaveLength(3);
			expect(publicMoveBodies[2]).toMatchObject({ groupId: null });
			await expect(page.locator('.group-student-card-pending')).toHaveCount(0);

			for (const expectedFilled of [1, 1, 0]) {
				const undoButton = page.getByRole('button', { name: /Hoàn tác/ });
				await expect(undoButton).toBeEnabled();
				await undoButton.click();
				await expect(page.locator('.group-slot-filled')).toHaveCount(expectedFilled);
			}

			await context.clearCookies();
			for (const width of [320, 768]) {
				await page.setViewportSize({ width, height: width === 320 ? 568 : 1024 });
				await page.goto(`/lop/${slug}`);
				await page.getByRole('tab', { name: 'Xếp nhóm' }).click();
				await expect(page.getByTestId('group-grid')).toBeVisible();
				if (width < 768)
					await expect(page.locator('[data-draggable="true"]')).toHaveCount(0);
				const mobileFilter = await page.evaluate(() => ({
					overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
					filterBottom:
						document.querySelector('.group-filterbar-actions')?.getBoundingClientRect().bottom ?? 0,
					searchBottom:
						document.querySelector('.group-filterbar-search')?.getBoundingClientRect().bottom ?? 0,
				}));
				expect(mobileFilter.overflow).toBeLessThanOrEqual(1);
				if (width <= 480)
					expect(mobileFilter.filterBottom).toBeGreaterThan(mobileFilter.searchBottom);
				else
					expect(mobileFilter.filterBottom).toBeGreaterThanOrEqual(mobileFilter.searchBottom - 2);
			}

			await page.setViewportSize({ width: 390, height: 844 });
			await page.goto(`/lop/${slug}`);
			await page.getByRole('tab', { name: 'Xếp nhóm' }).click();
			await page.getByRole('button', { name: 'Đi tới nhóm' }).click();
			await expect(page.getByRole('option', { name: /Nhóm 1/ })).toContainText('0/2 người');
			await page.keyboard.press('Escape');
			const emptySlot = page.locator('.group-slot-empty-state').first();
			await expect(emptySlot).toBeVisible();
			await emptySlot.click();
			const picker = page.getByRole('dialog', { name: /Chọn sinh viên ·/ });
			const studentCard = picker.locator('[data-student-name="Nguyễn Group"]');
			await studentCard.click({ force: true });
			await expect(page.getByLabel('Mã sinh viên')).toHaveCount(0);
			await expect(page.locator('.group-slot-filled')).toHaveCount(1);
			await expect(page.getByRole('button', { name: /Hoàn tác/ })).toBeEnabled();
			await page.getByRole('button', { name: /Hoàn tác/ }).click();
			await expect(page.locator('.group-slot-filled')).toHaveCount(0);
			const mobileOverflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(mobileOverflow).toBeLessThanOrEqual(1);

			await addAdminSession(context);
			const reassigned = await page.request.put(
				`/api/admin/teaching/classes/${classId}/groups/assignments`,
				{
					data: {
						enrollmentId: ((await enrollment.json()) as { data: { enrollmentId: string } }).data
							.enrollmentId,
						groupId: configuredBoard.data.groups[0]!.id,
						slotIndex: 0,
					},
				},
			);
			expect(reassigned.ok()).toBe(true);
			await page.setViewportSize({ width: 390, height: 844 });
			await page.goto(`/admin/teaching/${classId}?tab=groups`);
			await expect(page.getByTestId('group-grid')).toBeVisible();
			await expect(page.locator('[data-draggable="true"]')).toHaveCount(0);
			await expect(page.getByTestId('group-admin-desktop-controls')).toHaveCount(0);
			await expect(page.getByRole('button', { name: /xóa .* khỏi nhóm/i }).first()).toBeVisible();
			await expect(page.locator('.group-mobile-picker')).toBeVisible();
		} finally {
			await addAdminSession(context);
			await page.request.delete(`/api/admin/teaching/classes/${classId}`);
		}
	});
});

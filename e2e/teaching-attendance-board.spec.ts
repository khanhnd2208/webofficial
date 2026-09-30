import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import writeXlsxFile from 'write-excel-file/node';

import { addAdminSession } from './helpers/adminSession';
import { cleanupTeachingClass } from './helpers/teachingCleanup';

async function rosterWorkbookBuffer({
	courseCode,
	groupNo,
	term,
	studentCode,
}: {
	courseCode: string;
	groupNo: string;
	term: string;
	studentCode: string;
}): Promise<Buffer> {
	const rows = [
		['Trường Đại học Hà Nội'],
		['BẢNG KẾT QUẢ ĐIỂM DANH HỌC PHẦN'],
		[term],
		['', 'Học phần', 'Quản trị lớp học', '', 'Mã học phần', courseCode],
		['', 'Tên giảng viên', 'Nguyễn Duy Khánh', '', 'Mã giảng viên', 'GV-TEST'],
		['', 'Số tín chỉ', '3', '', 'Nhóm tổ', groupNo],
		['STT', 'Mã SV', 'Họ lót', 'Tên', 'Mã lớp', 'Tên lớp', 'Ngày sinh'],
		['1', studentCode, 'Nguyễn Văn', 'An', 'K24-A', 'Quản trị kinh doanh', '29/05/2006'],
		['2', `${studentCode}B`, 'Trần Thị', 'Bình', 'K24-A', 'Quản trị kinh doanh', '23/08/2005'],
	];
	return writeXlsxFile(rows, { sheet: 'DanhSachSV' }).toBuffer();
}

test.describe('Teaching class dashboard (/lop/[slug])', () => {
	test('guest cannot open the private Teaching workspace', async ({ page }) => {
		await page.goto('/my-space/teaching');
		await expect(page).toHaveURL(/\/dang-nhap/);
	});

	test('legacy Teaching alias still sends guests to login', async ({ page }) => {
		await page.goto('/admin/teaching');
		await expect(page).toHaveURL(/\/dang-nhap/);
	});

	test('My Space links to protected Teaching and adds Admin only for administrators', async ({
		page,
		context,
	}) => {
		await page.goto('/my-space');
		await expect(page).toHaveURL(/\/my-space$/);
		await expect(page.getByTestId('myspace-tile-teaching')).toHaveAttribute(
			'href',
			'/my-space/teaching',
		);
		await addAdminSession(context);
		await page.goto('/my-space');
		await expect(page).toHaveURL(/\/my-space$/);
		await expect(page.getByTestId('myspace-tile-teaching')).toHaveAttribute(
			'href',
			'/my-space/teaching',
		);
	});

	test('missing classes return 404', async ({ page }) => {
		const missing = await page.goto('/lop/no-such-class-ever');
		expect(missing?.status()).toBe(404);
	});

	test('Class Notes publish a stable public snapshot and disappear when unpublished', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const slug = `e2e-notes-${suffix}`;
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `NOTE${suffix}`.slice(0, 10),
				courseName: 'Class Notes E2E',
				groupNo: '96',
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
					publicTitle: 'Class Notes E2E',
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

			const noteResponse = await page.request.post(`/api/admin/teaching/classes/${classId}/notes`, {
				data: { title: 'Tuần 1', html: '<p><span style="color: #2563eb">Bản công khai</span></p>' },
			});
			expect(noteResponse.ok()).toBe(true);
			const noteId = ((await noteResponse.json()) as { data: { id: string } }).data.id;

			const published = await page.request.post(
				`/api/admin/teaching/classes/${classId}/notes/${noteId}/publish`,
			);
			expect(published.ok()).toBe(true);
			const changedDraft = await page.request.patch(
				`/api/admin/teaching/classes/${classId}/notes/${noteId}`,
				{
					data: { title: 'Tuần 1 đã sửa', html: '<p>Bản nháp không công khai</p>' },
				},
			);
			expect(changedDraft.ok()).toBe(true);

			await context.clearCookies();
			await page.goto(`/lop/${slug}?tab=notes`);
			await expect(page.getByRole('tab', { name: 'Ghi chú lớp' })).toHaveAttribute(
				'aria-selected',
				'true',
			);
			await expect(page.getByRole('heading', { name: 'Tuần 1' })).toBeVisible();
			await expect(page.getByText('Bản công khai')).toBeVisible();
			await expect(page.getByText('Bản nháp không công khai')).toHaveCount(0);
			await expect(page.locator('.mc-prose span[style*="color"]')).toBeVisible();

			await addAdminSession(context);
			const unpublished = await page.request.post(
				`/api/admin/teaching/classes/${classId}/notes/${noteId}/unpublish`,
			);
			expect(unpublished.ok()).toBe(true);
			await context.clearCookies();
			await page.goto(`/lop/${slug}?tab=notes`);
			await expect(page.getByText('Chưa có Class Notes được xuất bản.')).toBeVisible();
		} finally {
			await context.clearCookies();
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('admin can apply text color and highlight in the Class Notes editor', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `CLR${suffix}`.slice(0, 10),
				courseName: 'Editor colors E2E',
				groupNo: '95',
				term: `E2E ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;

		try {
			await page.goto(`/my-space/teaching/${classId}?tab=notes`);
			await page.getByRole('button', { name: /thêm/i }).click();
			await page
				.locator('input[placeholder="Tiêu đề tuần / topic / phần"]')
				.fill('Màu và highlight');
			const editor = page.locator('.tiptap-content');
			await editor.pressSequentially('Nội dung có màu');
			await editor.press('ControlOrMeta+A');
			await page.getByRole('button', { name: 'Màu chữ' }).click();
			await page.getByRole('button', { name: 'Màu chữ: Đỏ' }).click();
			await page.getByRole('button', { name: 'Highlight', exact: true }).click();
			await page.getByRole('button', { name: 'Highlight: Vàng' }).click();

			await expect(editor.locator('mark[style*="background-color"]')).toBeVisible();
			await expect(editor.locator('span[style*="color"]')).toBeVisible();
			const html = await editor.innerHTML();
			expect(html).toMatch(/color:\s*(#dc2626|rgb\(220,\s*38,\s*38\))/i);
			expect(html).toMatch(/background-color:\s*(#fef08a|rgb\(254,\s*240,\s*138\))/i);
		} finally {
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('a rostered learner authenticates and saves a Learning Experience choice', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const slug = `e2e-learning-${suffix}`;
		const learnerName = `Learning ${suffix}`;
		const openLearnerName = `Open ${suffix}`;
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `LEX${suffix}`.slice(0, 10),
				courseName: 'Learning Experience E2E',
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
					publicTitle: 'Learning Experience E2E',
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
			const enrolled = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `26${Date.now()}`.slice(-10),
						familyName: 'E2E',
						givenName: learnerName,
						dateOfBirth: '2006-05-29',
					},
				},
			);
			expect(enrolled.ok()).toBe(true);
			const openEnrolled = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `27${Date.now()}`.slice(-10),
						familyName: 'E2E',
						givenName: openLearnerName,
						dateOfBirth: null,
					},
				},
			);
			expect(openEnrolled.ok()).toBe(true);

			await context.clearCookies();
			await page.goto(`/lop/${slug}?tab=learning`);
			await expect(
				page.getByRole('heading', { name: 'Mở trải nghiệm học tập của bạn' }),
			).toBeVisible();
			await page.getByRole('combobox', { name: 'Chọn sinh viên trong lớp' }).fill(learnerName);
			await page.getByRole('option', { name: new RegExp(learnerName, 'i') }).click();
			await page.getByLabel('Mật khẩu ngày sinh').fill('29052006');
			await page.getByRole('button', { name: 'Enter experience' }).click();

			await expect(page.getByRole('heading', { name: 'Choose your learning style' })).toBeVisible();
			await page.getByRole('button', { name: 'Chọn thử thách' }).click();
			await expect(page.getByRole('button', { name: 'Đã chọn' })).toBeVisible();
			await expect(page.getByText(/Challenge accepted/)).toBeVisible();

			await context.clearCookies();
			await page.goto(`/lop/${slug}?tab=learning`);
			await page.getByRole('combobox', { name: 'Chọn sinh viên trong lớp' }).fill(openLearnerName);
			await page.getByRole('option', { name: new RegExp(openLearnerName, 'i') }).click();
			await expect(page.getByText('Có thể vào ngay')).toBeVisible();
			await expect(page.getByLabel('Mật khẩu ngày sinh')).toHaveCount(0);
			await page.getByRole('button', { name: 'Vào trải nghiệm' }).click();
			await expect(page.getByRole('heading', { name: 'Choose your learning style' })).toBeVisible();
		} finally {
			await context.clearCookies();
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('admin imports a HANU-style Excel roster into the correct class and skips duplicate student codes', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const courseCode = `IMP${suffix}`.slice(0, 10);
		const groupNo = '88';
		const term = `HỌC KỲ ${suffix}`;
		const studentCode = `SV${suffix}`.slice(0, 9);
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode,
				courseName: 'Import roster E2E',
				groupNo,
				term,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const createdBody = (await created.json()) as { data: { id: string } };
		const classId = createdBody.data.id;
		const buffer = await rosterWorkbookBuffer({ courseCode, groupNo, term, studentCode });

		try {
			const firstImport = await page.request.post(
				`/api/admin/teaching/classes/${classId}/roster-import?mode=commit`,
				{
					multipart: {
						file: {
							name: 'DanhSachSinhVien.xlsx',
							mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
							buffer,
						},
					},
				},
			);
			expect(firstImport.ok()).toBe(true);
			expect(await firstImport.json()).toMatchObject({ data: { addedCount: 2, skippedCount: 0 } });

			const gradebook = await page.request.get(`/api/admin/teaching/classes/${classId}/gradebook`);
			expect(gradebook.ok()).toBe(true);
			expect(await gradebook.json()).toMatchObject({
				data: {
					students: expect.arrayContaining([
						expect.objectContaining({
							studentCode: studentCode.toUpperCase(),
							familyName: 'Nguyễn Văn',
							givenName: 'An',
						}),
						expect.objectContaining({
							studentCode: `${studentCode}B`.toUpperCase(),
							familyName: 'Trần Thị',
							givenName: 'Bình',
						}),
					]),
				},
			});

			const secondImport = await page.request.post(
				`/api/admin/teaching/classes/${classId}/roster-import?mode=commit`,
				{
					multipart: {
						file: {
							name: 'DanhSachSinhVien.xlsx',
							mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
							buffer,
						},
					},
				},
			);
			expect(secondImport.ok()).toBe(true);
			expect(await secondImport.json()).toMatchObject({ data: { addedCount: 0, skippedCount: 2 } });
		} finally {
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('visitor sees two minimal read-only tables, noindex, and diem-danh redirects', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `E2E${suffix}`.slice(0, 10),
				courseName: 'E2E Class Board',
				groupNo: '99',
				term: `E2E ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const createdBody = (await created.json()) as { data: { id: string } };
		const classId = createdBody.data.id;
		const slug = `e2e-board-${suffix}`;

		try {
			// Save student-page content
			const publicRes = await page.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
				data: {
					publicSlug: slug,
					publicTitle: 'E2E Class Board Title',
					publicSummary: 'E2E public summary for class board.',
					publicDescription: 'E2E full description for class board.',
					publicAnnouncement: 'Welcome students to E2E test.',
					links: [
						{
							label: 'Course site',
							url: 'https://toiladuykhanh.com',
							description: 'Main resource',
						},
					],
				},
			});
			expect(publicRes.ok()).toBe(true);

			// Share the class and its attendance board in one action
			const enabled = await page.request.patch(`/api/admin/teaching/classes/${classId}/share`, {
				data: { shared: true, classRules: 'Bring your student card.' },
			});
			expect(enabled.ok()).toBe(true);

			// Add a student to the class
			const studentRes = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `SV${suffix}`.slice(-10),
						familyName: 'Nguyễn Văn',
						givenName: 'An',
					},
				},
			);
			expect(studentRes.ok()).toBe(true);
			const gradebookRes = await page.request.get(
				`/api/admin/teaching/classes/${classId}/gradebook`,
			);
			expect(gradebookRes.ok()).toBe(true);
			const gradebookBody = (await gradebookRes.json()) as {
				data: { sessions: Array<{ id: string }>; students: Array<{ enrollmentId: string }> };
			};

			// Test redirect from /lop/[slug]/diem-danh
			const redirectRes = await page.goto(`/lop/${slug}/diem-danh?key=legacy-key`);
			expect(redirectRes?.url()).toContain(`/lop/${slug}`);

			// Clear cookies for unauthenticated visitor view
			await context.clearCookies();
			const writeAttempt = await page.request.put(
				`/api/admin/teaching/sessions/${gradebookBody.data.sessions[0]!.id}/attendance`,
				{
					data: {
						marks: [
							{
								enrollmentId: gradebookBody.data.students[0]!.enrollmentId,
								status: 'PRESENT',
								note: '',
							},
						],
					},
				},
			);
			expect(writeAttempt.ok()).toBe(false);
			const startAttempt = await page.request.post(
				`/api/admin/teaching/sessions/${gradebookBody.data.sessions[0]!.id}/attendance/start`,
			);
			expect(startAttempt.ok()).toBe(false);

			const response = await page.goto(`/lop/${slug}`);
			expect(response?.status()).toBe(200);

			// Verify robots meta is noindex
			const robots = page.locator('meta[name="robots"]');
			await expect(robots.first()).toHaveAttribute('content', /noindex/i);

			// Verify tabs
			await expect(page.getByRole('tab', { name: 'Điểm danh' })).toBeVisible();
			await expect(page.getByRole('tab', { name: 'Điểm CP' })).toBeVisible();
			await expect(page.getByRole('tab', { name: 'Link quan trọng' })).toHaveCount(0);

			// Verify read-only mode: no editable button cell
			await expect(page.locator('button.mc-grid-cell')).toHaveCount(0);
			await expect(page.locator('span.mc-grid-cell').first()).toBeVisible();

			// Switch to CP tab
			await page.getByRole('tab', { name: 'Điểm CP' }).click();
			await expect(page.getByTestId('participation-grid').first()).toBeVisible();
			await expect(page.getByRole('columnheader', { name: 'Gift', exact: true })).toBeVisible();
			await expect(page.getByRole('columnheader', { name: 'Tổng /10', exact: true })).toBeVisible();

			// Responsive viewport overflow check
			for (const width of [390, 1280]) {
				await page.setViewportSize({ width, height: 800 });
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
				);
				expect(overflow).toBeLessThanOrEqual(1);
			}
		} finally {
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('admin sees the public class page as read-only and can return to management', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `ADM${suffix}`.slice(0, 10),
				courseName: 'Admin Grading Test',
				groupNo: '01',
				term: `HK1 ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const createdBody = (await created.json()) as { data: { id: string } };
		const classId = createdBody.data.id;
		const slug = `adm-grade-${suffix}`;

		try {
			// Save student-page content
			const pub = await page.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
				data: {
					publicSlug: slug,
					publicTitle: 'Admin Grading Test',
					publicSummary: 'Summary for admin test',
					publicDescription: '',
					publicAnnouncement: '',
					links: [],
				},
			});
			expect(pub.ok()).toBe(true);

			// Share the class and its attendance board in one action
			const att = await page.request.patch(`/api/admin/teaching/classes/${classId}/share`, {
				data: { shared: true },
			});
			expect(att.ok()).toBe(true);

			// Get default tutorial id to assign student
			const gradebookRes = await page.request.get(
				`/api/admin/teaching/classes/${classId}/gradebook`,
			);
			expect(gradebookRes.ok()).toBe(true);
			const gbData = (await gradebookRes.json()) as { data: { tutorials: Array<{ id: string }> } };
			const tutorialClassId = gbData.data.tutorials[0]?.id;

			// Add a student with tutorialClassId
			const stu = await page.request.post(`/api/admin/teaching/classes/${classId}/enrollments`, {
				data: {
					studentCode: `SVADM${suffix}`.slice(-10),
					familyName: 'Trần Thị',
					givenName: 'Bình',
					tutorialClassId,
				},
			});
			expect(stu.ok()).toBe(true);

			// Ensure admin session is fresh on page
			await addAdminSession(context);

			// The public URL stays read-only even for an admin.
			await page.goto(`/lop/${slug}`);
			await expect(page.locator('.mc-grid-wrap[data-scroll-mode="page"]')).toHaveCount(1);
			const publicSummaryGeometry = await page.evaluate(() => {
				const headers = Array.from(
					document.querySelectorAll<HTMLElement>(
						'[data-testid="attendance-grid"] thead .mc-grid-freeze-right',
					),
				);
				return headers.map((header) => {
					const rect = header.getBoundingClientRect();
					return { left: rect.left, right: rect.right, width: rect.width };
				});
			});
			expect(publicSummaryGeometry.length).toBe(3);
			for (const column of publicSummaryGeometry) {
				expect(column.width).toBeGreaterThanOrEqual(96);
			}
			for (let index = 1; index < publicSummaryGeometry.length; index += 1) {
				expect(publicSummaryGeometry[index]!.left).toBeGreaterThanOrEqual(
					publicSummaryGeometry[index - 1]!.right - 1,
				);
			}
			await expect(page.getByText('Chế độ giảng viên')).toHaveCount(0);
			await expect(page.getByRole('link', { name: 'Quản lý lớp ↗' })).toHaveAttribute(
				'href',
				`/my-space/teaching/${classId}`,
			);
			await expect(page.locator('button.mc-grid-cell')).toHaveCount(0);
			await expect(page.locator('button.mc-grid-participation-cell')).toHaveCount(0);

			const search = page.getByPlaceholder('Tìm tên hoặc MSV');
			const publicCode = `SVADM${suffix}`.slice(0, 10);
			await expect(page.locator('[data-testid="attendance-grid"] tbody tr')).toHaveCount(1);
			await search.fill(publicCode.slice(-2));
			await expect(page.locator('[data-testid="attendance-grid"] tbody tr')).toHaveCount(1);
			await search.fill('Bình');
			await expect(page.locator('[data-testid="attendance-grid"] tbody tr')).toHaveCount(1);
			await search.fill('123');
			await expect(page.locator('[data-testid="attendance-grid"] tbody tr')).toHaveCount(1);
			await expect(page.getByText('Không tìm thấy mã sinh viên phù hợp.')).toBeVisible();

			await page.getByRole('tab', { name: 'Điểm CP' }).click();
			await expect(page.locator('button.mc-grid-participation-cell')).toHaveCount(0);
		} finally {
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('public attendance keeps students who are not yet assigned a tutorial', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `UNT${suffix}`.slice(0, 10),
				courseName: 'Unassigned Tutorial E2E',
				groupNo: '91',
				term: `E2E ${suffix}`,
				totalWeeks: 4,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;
		const slug = `unassigned-${suffix}`;

		try {
			const publicPage = await page.request.patch(`/api/admin/teaching/classes/${classId}/public`, {
				data: {
					publicSlug: slug,
					publicTitle: 'Unassigned Tutorial E2E',
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
			const enrolled = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `27${suffix}`.slice(-10),
						familyName: 'E2E',
						givenName: `Unassigned ${suffix}`,
						tutorialClassId: null,
					},
				},
			);
			expect(enrolled.ok()).toBe(true);

			await context.clearCookies();
			await page.goto(`/lop/${slug}`);
			await expect(page.getByText('1 SV')).toBeVisible();
			await expect(page.getByLabel('Tutorial')).toHaveValue('');
			await expect(page.locator('#public-tutorial option[value="__unassigned__"]')).toHaveCount(1);
			await expect(page.locator('[data-testid="attendance-grid"] tbody tr')).toHaveCount(1);
		} finally {
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});

	test('admin workspace starts a session, autosaves attendance and CP, and exposes all ten weeks', async ({
		page,
		context,
	}) => {
		test.setTimeout(120_000);
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `WS${suffix}`.slice(0, 10),
				courseName: 'Admin Workspace Save Test',
				groupNo: '10',
				term: `HK1 ${suffix}`,
				totalWeeks: 10,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;

		try {
			const initial = await page.request.get(`/api/admin/teaching/classes/${classId}/gradebook`);
			expect(initial.ok()).toBe(true);
			const initialData = (await initial.json()) as {
				data: {
					tutorials: Array<{ id: string }>;
					sessions: Array<{ id: string; weekNumber: number }>;
				};
			};
			const tutorialClassId = initialData.data.tutorials[0]!.id;
			const enrollmentResponse = await page.request.post(
				`/api/admin/teaching/classes/${classId}/enrollments`,
				{
					data: {
						studentCode: `SVWS${suffix}`.slice(-10),
						familyName: 'Nguyễn Văn',
						givenName: 'Workspace',
						tutorialClassId,
					},
				},
			);
			expect(enrollmentResponse.ok()).toBe(true);

			await page.goto(`/admin/teaching/${classId}/gradebook`);
			await expect(page).toHaveURL(new RegExp(`/my-space/teaching/${classId}\\?tab=attendance`));

			await page.goto(`/my-space/teaching/${classId}?tab=attendance`);
			await expect(page.getByTestId('attendance-grid').first()).toBeVisible();
			await expect(page.getByTestId('attendance-grid').locator('[data-icon="help"]')).toHaveCount(
				0,
			);
			await expect(page.getByRole('columnheader', { name: /W10/ })).toBeVisible();
			if (process.env.TEACHING_GROUP_BOARD_ENABLED === 'true') {
				await expect(page.getByRole('columnheader', { name: 'Nhóm', exact: true })).toBeVisible();
			} else {
				await expect(page.getByRole('columnheader', { name: 'Nhóm', exact: true })).toHaveCount(0);
			}
			await expect(page.getByRole('columnheader', { name: 'Trạng thái', exact: true })).toHaveCount(
				0,
			);
			await expect(page.getByTestId('myspace-back')).toHaveCount(0);
			await expect(page.getByTestId('contact-rail')).toHaveCount(0);
			expect(await page.locator('.teaching-icon-button svg').count()).toBeGreaterThan(0);
			await expect(page.getByTestId('week-navigator')).toHaveCount(0);
			await expect(page.locator('.teaching-management-desktop').first()).toBeVisible();
			await expect(page.locator('.teaching-management-mobile').first()).toBeHidden();
			expect(
				await page.locator('.teaching-management-desktop .teaching-icon-button:visible').count(),
			).toBe(1);
			expect(
				(await page.locator('[data-teaching-app-header]').first().boundingBox())?.height ??
					Infinity,
			).toBeLessThan(140);

			const desktopGeometry = await page.evaluate(() => {
				const wrap = document.querySelector('.mc-grid-wrap') as HTMLElement;
				const w1 = document
					.querySelector('[data-testid="attendance-grid"] thead th[data-week="1"]')!
					.getBoundingClientRect();
				const w10 = document
					.querySelector('[data-testid="attendance-grid"] thead th[data-week="10"]')!
					.getBoundingClientRect();
				return {
					range: wrap.scrollWidth - wrap.clientWidth,
					w1: { left: w1.left, right: w1.right },
					w10: { left: w10.left, right: w10.right },
				};
			});
			expect(desktopGeometry.w10.left).toBeGreaterThanOrEqual(desktopGeometry.w1.right);
			// At wide desktop sizes all ten weeks may fit without horizontal overflow.
			expect(desktopGeometry.range).toBeGreaterThanOrEqual(0);
			await page.getByRole('button', { name: 'Chọn tuần 10', exact: true }).click();
			await expect(
				page.locator('[data-testid="attendance-grid"] thead th[data-week="10"]'),
			).toHaveAttribute('data-selected', 'true');

			await expect(
				page.getByRole('button', { name: 'Mở điểm danh tuần 1', exact: true }),
			).toBeVisible();
			await page.locator('.teaching-management-desktop button').click();
			await expect(page.getByRole('menu', { name: 'Quản lý lớp' })).toBeVisible();
			await page.locator('body').click({ position: { x: 8, y: 8 } });
			await expect(page.getByRole('menu', { name: 'Quản lý lớp' })).toHaveCount(0);

			await page.getByRole('button', { name: 'Sửa ngày tuần 1', exact: true }).click();
			await expect(page.getByRole('group', { name: /Tháng/ })).toBeVisible();
			// New sessions open on today's month; navigate deterministically to the test date.
			const targetMonth = 2026 * 12 + 8;
			for (let i = 0; i < 120; i++) {
				const label = await page.locator('.mc-calendar-heading strong').innerText();
				const parts = label.match(/Tháng (\d+) \/ (\d+)/)!;
				const current = Number(parts[2]) * 12 + Number(parts[1]) - 1;
				if (current === targetMonth) break;
				await page
					.getByRole('button', {
						name: current > targetMonth ? 'Tháng trước' : 'Tháng sau',
						exact: true,
					})
					.click();
			}

			await page.route(
				'**/api/admin/teaching/sessions/*',
				async (route) => {
					await new Promise((resolve) => setTimeout(resolve, 150));
					await route.fulfill({
						status: 500,
						contentType: 'application/json',
						body: JSON.stringify({ error: 'Test date save failure' }),
					});
				},
				{ times: 1 },
			);
			await page.getByRole('button', { name: '1/9/2026', exact: true }).press('Enter');
			await expect(page.getByRole('alert').filter({ hasText: 'Không thể lưu ngày' })).toBeVisible();
			await expect(page.getByRole('button', { name: '1/9/2026', exact: true })).toHaveAttribute(
				'aria-pressed',
				'true',
			);
			await page.getByRole('button', { name: 'Thử lại lưu ngày', exact: true }).click();

			await expect(page.getByRole('dialog', { name: 'Sửa ngày tuần 1', exact: true })).toHaveCount(
				0,
			);
			await expect(page.getByText('Đã lưu ngày học')).toBeVisible();
			await expect(
				page.getByRole('button', { name: 'Sửa ngày tuần 1', exact: true }),
			).toContainText('01/09/26');
			await page.getByRole('button', { name: 'Mở điểm danh tuần 1', exact: true }).click();
			await expect(page.getByText(/Đã mở buổi tuần/)).toBeVisible();

			const attendanceCell = page.locator('button.mc-grid-cell:not(:disabled)').first();
			await attendanceCell.click();
			await expect(attendanceCell).toHaveAttribute('data-status', 'PRESENT');
			await attendanceCell.click();
			await expect(attendanceCell).toHaveAttribute('data-status', 'LATE');
			await attendanceCell.click();
			await expect(attendanceCell).toHaveAttribute('data-status', 'ABSENT_UNEXCUSED');

			await attendanceCell.click({ button: 'right' });
			await page.getByPlaceholder('Nhập ghi chú…').fill('Đã đối chiếu danh sách');
			await page.getByRole('button', { name: 'Lưu ghi chú' }).click();
			await expect(page.getByText('Đã lưu điểm danh')).toBeVisible();

			await page.getByRole('link', { name: 'Điểm CP' }).click();
			await expect(page).toHaveURL(new RegExp(`[?&]week=1`));
			await expect(page.getByTestId('participation-grid').first()).toBeVisible();
			await expect(page.getByRole('columnheader', { name: 'Nhóm', exact: true })).toHaveCount(0);
			await expect(
				page.getByRole('columnheader', { name: 'Số buổi vắng', exact: true }),
			).toHaveCount(0);
			await expect(page.locator('.mc-grid-week-sub').first()).toHaveText('01/09/26');
			await page.getByRole('button', { name: 'Mở CP tuần 1', exact: true }).click();
			await expect(page.getByText(/Đã mở chấm CP tuần/)).toBeVisible();
			const cpCell = page.locator('button.mc-grid-participation-cell').first();
			await cpCell.click();
			await expect(cpCell).toHaveAttribute('data-points', '0.5');
			await expect(page.getByText('Đã lưu CP')).toBeVisible();
			await cpCell.click({ button: 'right' });
			await page.getByPlaceholder('Nhập ghi chú CP…').fill('Có tiến bộ trong thảo luận');
			await page.getByRole('button', { name: 'Lưu ghi chú' }).click();
			await expect(page.getByText('Đã lưu CP')).toBeVisible();
			const giftAdd = page.getByRole('button', { name: /Thêm Gift cho/ }).first();
			await giftAdd.click();
			await expect(page.locator('td.mc-grid-gift[data-gifts="1"]').first()).toBeVisible();
			await page
				.getByRole('button', { name: /Hoàn tác Gift/ })
				.first()
				.click();
			await expect(page.locator('td.mc-grid-gift[data-gifts="0"]').first()).toBeVisible();

			const stored = await page.request.get(`/api/admin/teaching/classes/${classId}/gradebook`);
			const storedData = (await stored.json()) as {
				data: {
					students: Array<{
						marks: Record<string, { status: string; note: string }>;
						participation: Record<string, { points: number; note: string }>;
					}>;
				};
			};
			expect(Object.values(storedData.data.students[0]!.marks)).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ status: 'ABSENT_UNEXCUSED', note: 'Đã đối chiếu danh sách' }),
				]),
			);
			expect(Object.values(storedData.data.students[0]!.participation)).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ points: 0.5, note: 'Có tiến bộ trong thảo luận' }),
				]),
			);
			await page.getByRole('button', { name: 'Tạm khóa CP tuần 1', exact: true }).click();
			await expect(page.getByText(/Đã khóa chấm CP tuần/)).toBeVisible();
			await expect(cpCell).toBeDisabled();
			await page.getByRole('button', { name: 'Mở CP tuần 1', exact: true }).click();
			await expect(page.getByText(/Đã mở chấm CP tuần/)).toBeVisible();
			await page.getByRole('button', { name: 'Chốt CP tuần 1', exact: true }).click();
			await page
				.getByRole('dialog', { name: 'Chốt tuần' })
				.getByTestId('admin-confirm-accept')
				.click();
			await expect(
				page.getByRole('button', { name: 'Bỏ chốt CP tuần 1', exact: true }),
			).toBeVisible();
			await page.getByRole('button', { name: 'Mở lại CP tuần 1', exact: true }).click();
			await page
				.getByRole('dialog', { name: 'Mở lại tuần' })
				.getByTestId('admin-confirm-accept')
				.click();
			await expect(
				page.getByRole('button', { name: 'Tạm khóa CP tuần 1', exact: true }),
			).toBeVisible();

			await expect(cpCell).toHaveAttribute('data-points', '0.5');

			await page.goto(`/my-space/teaching/${classId}?tab=attendance`);
			const lockedAttendanceCell = page.locator('button.mc-grid-cell').first();
			await page.getByRole('button', { name: 'Tạm khóa điểm danh tuần 1', exact: true }).click();
			await expect(page.getByText(/Đã khóa buổi tuần/)).toBeVisible();
			await expect(lockedAttendanceCell).toHaveAttribute('data-status', 'ABSENT_UNEXCUSED');
			await expect(lockedAttendanceCell).toBeDisabled();
			const locked = await page.request.get(`/api/admin/teaching/classes/${classId}/gradebook`);
			const lockedData = (await locked.json()) as {
				data: {
					sessions: Array<{
						id: string;
						attendanceTakenAt: string | null;
						attendanceOpen: boolean;
					}>;
					students: Array<{ marks: Record<string, { status: string; note: string }> }>;
				};
			};
			expect(
				lockedData.data.sessions.some(
					(session) => session.attendanceOpen === false && session.attendanceTakenAt === null,
				),
			).toBe(true);
			expect(Object.values(lockedData.data.students[0]!.marks)).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ status: 'ABSENT_UNEXCUSED', note: 'Đã đối chiếu danh sách' }),
				]),
			);

			await page.getByRole('button', { name: 'Mở điểm danh tuần 1', exact: true }).click();
			await expect(page.getByText(/Đã mở buổi tuần/)).toBeVisible();
			await expect(lockedAttendanceCell).toHaveAttribute('data-status', 'ABSENT_UNEXCUSED');
			const reopened = await page.request.get(`/api/admin/teaching/classes/${classId}/gradebook`);
			const reopenedData = (await reopened.json()) as {
				data: {
					sessions: Array<{
						id: string;
						attendanceTakenAt: string | null;
						attendanceOpen: boolean;
					}>;
					students: Array<{ marks: Record<string, { status: string; note: string }> }>;
				};
			};
			expect(
				reopenedData.data.sessions.some(
					(session) => session.attendanceOpen === true && session.attendanceTakenAt === null,
				),
			).toBe(true);
			expect(Object.values(reopenedData.data.students[0]!.marks)).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ status: 'ABSENT_UNEXCUSED', note: 'Đã đối chiếu danh sách' }),
				]),
			);

			await page.getByRole('button', { name: 'Chốt điểm danh tuần 1', exact: true }).click();
			await page
				.getByRole('dialog', { name: 'Chốt tuần' })
				.getByTestId('admin-confirm-accept')
				.click();
			await expect(page.getByText(/Đã chốt điểm danh tuần/)).toBeVisible();
			const finalized = await page.request.get(`/api/admin/teaching/classes/${classId}/gradebook`);
			const finalizedData = (await finalized.json()) as {
				data: {
					sessions: Array<{
						attendanceTakenAt: string | null;
						attendanceOpen: boolean;
					}>;
				};
			};
			expect(
				finalizedData.data.sessions.some(
					(session) => session.attendanceOpen === false && session.attendanceTakenAt !== null,
				),
			).toBe(true);
			await expect(
				page.getByRole('button', { name: 'Bỏ chốt điểm danh tuần 1', exact: true }),
			).toBeVisible();
			await page
				.getByRole('button', { name: 'Bỏ chốt điểm danh tuần 1', exact: true })
				.press('Escape');
			await mkdir('outputs/teaching-ui-direct', { recursive: true });
			await page.screenshot({
				path: `outputs/teaching-ui-direct/after-attendance-${test.info().project.name}.png`,
			});

			await page.getByRole('button', { name: 'Chọn tuần 1', exact: true }).click();
			for (const width of [1440, 1024, 768, 390]) {
				await page.setViewportSize({ width, height: 900 });
				await page.getByRole('button', { name: 'Sửa ngày tuần 1', exact: true }).click();
				const calendar = page.getByRole('dialog', { name: 'Sửa ngày tuần 1', exact: true });
				await expect(calendar).toBeVisible();
				const box = await calendar.boundingBox();
				expect(box!.x).toBeGreaterThanOrEqual(0);
				expect(box!.x + box!.width).toBeLessThanOrEqual(width);
				await page.screenshot({
					path: `outputs/teaching-ui-direct/calendar-${test.info().project.name}-${width}.png`,
				});
				await page.keyboard.press('Escape');
				await expect(
					page.getByRole('button', { name: 'Sửa ngày tuần 1', exact: true }),
				).toBeFocused();
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
					true,
				);
				await page.screenshot({
					path: `outputs/teaching-ui-direct/after-attendance-${test.info().project.name}-${width}.png`,
				});
			}
			await page.setViewportSize({ width: 1440, height: 900 });

			await page.goto(`/my-space/teaching/${classId}?tab=cp`);
			await expect(page.getByTestId('participation-grid').first()).toBeVisible();
			await mkdir('outputs/teaching-ui-direct', { recursive: true });
			await page.getByRole('button', { name: 'Chọn tuần 1', exact: true }).click();
			await expect(
				page.getByTestId('participation-grid').locator('thead [data-week="1"]'),
			).toHaveAttribute('data-selected', 'true');
			for (const width of [1440, 1024, 768, 390]) {
				await page.setViewportSize({ width, height: 900 });
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
					true,
				);
				await expect
					.poll(async () =>
						page.getByTestId('participation-grid').evaluate((table) => {
							const target = table.querySelector('thead [data-week="1"]')!.getBoundingClientRect();
							const left = Math.max(
								...Array.from(
									table.querySelectorAll(
										'thead .mc-grid-freeze-left, thead .mc-grid-public-identity',
									),
								)
									.filter(
										(el) =>
											getComputedStyle(el).position === 'sticky' &&
											el.getBoundingClientRect().width > 0,
									)
									.map((el) => el.getBoundingClientRect().right),
							);
							return {
								fits:
									target.left >= left - 1 &&
									target.right <= table.parentElement!.getBoundingClientRect().right + 1,
								left,
								targetLeft: target.left,
								targetRight: target.right,
								width: innerWidth,
								scrollLeft: table.parentElement!.scrollLeft,
								active: document.activeElement?.outerHTML.slice(0, 160),
							};
						}),
					)
					.toEqual(expect.objectContaining({ fits: true }));
				await page.screenshot({
					path: `outputs/teaching-ui-direct/after-cp-${test.info().project.name}-${width}.png`,
				});
			}
			await page.setViewportSize({ width: 390, height: 800 });
			await expect(page.locator('.mc-grid-public-identity').first()).toBeVisible();
			await expect(page.locator('.mc-grid-desktop-only').first()).toBeHidden();
			await expect(page.locator('.teaching-management-desktop').first()).toBeHidden();
			await expect(page.locator('.teaching-management-mobile').first()).toBeVisible();
			expect(
				await page.locator('.teaching-management-mobile .teaching-icon-button:visible').count(),
			).toBe(1);
			expect(
				(await page.locator('[data-teaching-app-header]').first().boundingBox())?.height ??
					Infinity,
			).toBeLessThan(160);
			await page.getByRole('button', { name: 'Mở menu quản lý' }).click();
			await expect(page.getByRole('dialog', { name: 'Quản lý lớp' })).toBeVisible();
			await page.getByRole('button', { name: 'Đóng' }).click();
			const mobileGeometry = await page.evaluate(() => {
				const wrap = document.querySelector('.mc-grid-wrap') as HTMLElement;
				const w1 = document
					.querySelector('[data-testid="participation-grid"] thead th[data-week="1"]')!
					.getBoundingClientRect();
				const w10 = document
					.querySelector('[data-testid="participation-grid"] thead th[data-week="10"]')!
					.getBoundingClientRect();
				return {
					range: wrap.scrollWidth - wrap.clientWidth,
					w1: { left: w1.left, right: w1.right },
					w10: { left: w10.left, right: w10.right },
				};
			});
			expect(mobileGeometry.range).toBeGreaterThan(0);
			expect(mobileGeometry.w10.left).toBeGreaterThanOrEqual(mobileGeometry.w1.right);

			await page.reload();
			await expect(
				page.locator('button.mc-grid-participation-cell[data-points="0.5"]').first(),
			).toBeVisible();
			await page.setViewportSize({ width: 320, height: 800 });
			await expect(page.locator('.teaching-management-desktop').first()).toBeHidden();
			await expect(page.locator('.teaching-management-mobile').first()).toBeVisible();
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
				),
			).toBeLessThanOrEqual(1);
		} finally {
			if (!page.isClosed()) {
				await addAdminSession(context);
				await cleanupTeachingClass(page.request, classId);
			}
		}
	});

	test('admin workspace rolls a failed cell save back and retries it', async ({
		page,
		context,
	}) => {
		await addAdminSession(context);
		const suffix = Date.now().toString(36);
		const created = await page.request.post('/api/admin/teaching/classes', {
			data: {
				courseCode: `ER${suffix}`.slice(0, 10),
				courseName: 'Error Recovery Test',
				groupNo: '11',
				term: `HK1 ${suffix}`,
				totalWeeks: 1,
			},
		});
		expect(created.ok()).toBe(true);
		const classId = ((await created.json()) as { data: { id: string } }).data.id;
		try {
			const initial = await page.request.get(`/api/admin/teaching/classes/${classId}/gradebook`);
			const initialData = (await initial.json()) as { data: { tutorials: Array<{ id: string }> } };
			const added = await page.request.post(`/api/admin/teaching/classes/${classId}/enrollments`, {
				data: {
					studentCode: `SVER${suffix}`.slice(-10),
					familyName: 'Lê',
					givenName: 'Retry',
					tutorialClassId: initialData.data.tutorials[0]!.id,
				},
			});
			expect(added.ok()).toBe(true);

			let failOnce = true;
			await page.route(/\/api\/admin\/teaching\/sessions\/[^/]+\/attendance$/, async (route) => {
				if (failOnce && route.request().method() === 'PUT') {
					failOnce = false;
					await route.fulfill({
						status: 500,
						contentType: 'application/json',
						body: JSON.stringify({ error: { message: 'Simulated save failure' } }),
					});
					return;
				}
				await route.continue();
			});

			await page.goto(`/my-space/teaching/${classId}?tab=attendance`);
			await page.getByRole('button', { name: 'Mở điểm danh tuần 1', exact: true }).click();
			await expect(page.getByText(/Đã mở buổi tuần/)).toBeVisible();
			const cell = page.locator('button.mc-grid-cell:not(:disabled)').first();
			await cell.click();
			await expect(page.getByText('Có lỗi cần thử lại')).toBeVisible();
			await expect(cell).toHaveAttribute('data-status', 'ABSENT_UNEXCUSED');
			await page
				.getByRole('button', { name: /Thử lại điểm danh/ })
				.first()
				.click();
			await expect(cell).toHaveAttribute('data-status', 'PRESENT');
			await expect(page.getByText('Đã lưu điểm danh')).toBeVisible();
		} finally {
			await addAdminSession(context);
			await cleanupTeachingClass(page.request, classId);
		}
	});
});

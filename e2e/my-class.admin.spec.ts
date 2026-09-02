import { expect, test } from '@playwright/test';

import { addAdminSession } from './helpers/adminSession';

type AdminCourse = {
	id: string;
	slug: string;
	title: string;
};

function unwrapAdminCourses(data: unknown): AdminCourse[] {
	if (Array.isArray(data)) return data as AdminCourse[];
	if (
		data &&
		typeof data === 'object' &&
		'items' in data &&
		Array.isArray((data as { items: AdminCourse[] }).items)
	) {
		return (data as { items: AdminCourse[] }).items;
	}
	return [];
}

async function fetchAdminCourse(request: {
	get: (url: string) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }>;
}) {
	const response = await request.get('/api/admin/my-class/courses?q=hrm-toi-gian&pageSize=50');
	expect(response.ok()).toBe(true);
	const body = (await response.json()) as { data: unknown };
	const courses = unwrapAdminCourses(body.data);
	return courses.find((item) => item.slug === 'hrm-toi-gian') ?? courses[0];
}

test.describe('My Class admin authoring surfaces', () => {
	test.beforeEach(async ({ context }) => {
		await addAdminSession(context);
	});

	test('opens the dashboard and exposes course authoring actions', async ({ page }) => {
		const response = await page.goto('/admin/my-class');
		expect(response?.status()).toBe(200);
		await expect(page.getByRole('heading', { level: 1, name: 'Tổng quan My Class' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Tạo khóa học' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Khóa học' }).first()).toBeVisible();

		await page.goto('/admin/my-class/courses');
		await expect(page.getByRole('heading', { level: 1, name: 'Khóa học' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Khóa học' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sửa' }).first()).toBeVisible();
		await expect(page.getByRole('link', { name: 'Studio' }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: 'Lưu trữ' }).first()).toBeVisible();
	});

	test('opens every course-design tab for a seeded course', async ({ page }) => {
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();

		await page.goto(`/admin/my-class/courses/${course!.id}/overview`);
		const main = page.getByRole('main');
		for (const name of [
			'Tổng quan',
			'Nội dung',
			'Luyện tập',
			'Từ vựng',
			'Học viên',
			'Kết quả',
			'Cài đặt',
		]) {
			await expect(main.getByRole('link', { name, exact: true })).toBeVisible();
		}

		await main.getByRole('link', { name: 'Nội dung', exact: true }).click();
		await expect(page).toHaveURL(new RegExp(`/admin/my-class/courses/${course!.id}/content`));
		await expect(page.getByRole('textbox', { name: 'Tìm trong cây nội dung' })).toBeVisible();
		await expect(page.getByRole('button', { name: '+ Bài' })).toBeVisible();
	});

	test('smoke-checks all course and global admin workspaces', async ({ page }) => {
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();

		const coursePages = [
			'overview',
			'content',
			'practice',
			'vocabulary',
			'students',
			'results',
			'settings',
		].map((segment) => `/admin/my-class/courses/${course!.id}/${segment}`);
		const globalPages = [
			'/admin/my-class/courses/new',
			'/admin/my-class/knowledge',
			'/admin/my-class/tests',
			'/admin/my-class/vocabulary',
			'/admin/my-class/bank',
			'/admin/my-class/cohorts',
			'/admin/my-class/performance',
			'/admin/my-class/import',
		];

		for (const url of [...coursePages, ...globalPages]) {
			const navigation = await page.goto(url);
			expect(navigation?.status(), url).toBe(200);
			await expect(page.getByRole('main'), url).toBeVisible();
			await expect(page.getByText('Internal Server Error')).toHaveCount(0);
		}
	});

	test('renders standardized admin data tables with URL sort state', async ({ page }) => {
		await page.goto('/admin/my-class/knowledge');
		await expect(page.getByRole('columnheader', { name: /Nội dung/ })).toBeVisible();
		await page
			.getByRole('columnheader', { name: /Nội dung/ })
			.getByRole('button')
			.click();
		await expect(page).toHaveURL(/sortBy=title/);

		await page.goto('/admin/my-class/courses');
		await page.getByRole('link', { name: '50/trang' }).click();
		await expect(page).toHaveURL(/pageSize=50/);

		await page.goto('/admin/my-class/cohorts');
		await expect(page.getByRole('columnheader', { name: 'Nhóm học' })).toBeVisible();

		await page.goto('/admin/my-class/tests');
		await expect(page.getByRole('columnheader', { name: 'Bài kiểm tra' })).toBeVisible();
		await expect(page.getByRole('combobox', { name: 'Môn' })).toBeVisible();

		await page.goto('/admin/my-class/vocabulary');
		await expect(page.getByRole('columnheader', { name: 'Bộ từ' })).toBeVisible();

		await page.goto('/admin/my-class/performance');
		await expect(page.getByRole('columnheader', { name: 'Khóa học' })).toBeVisible();

		await page.goto('/admin/my-class/bank');
		await expect(page.getByTestId('bank-table').first()).toBeVisible();
		await expect(page.getByTestId('bank-inspector').first()).toBeVisible();
		const firstBankRow = page.getByTestId('bank-table').first().getByRole('checkbox').nth(1);
		if (await firstBankRow.count()) {
			await firstBankRow.click();
			await expect(page.getByText(/đã chọn/)).toBeVisible();
		}
	});

	test('keeps course-scoped tables and mobile overflow usable', async ({ page }) => {
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();

		await page.goto(`/admin/my-class/courses/${course!.id}/students`);
		await expect(page.getByRole('columnheader', { name: 'Nhóm học' })).toBeVisible();

		await page.goto(`/admin/my-class/courses/${course!.id}/practice`);
		await expect(page.getByRole('columnheader', { name: 'Bài kiểm tra' })).toBeVisible();

		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/admin/my-class/courses');
		await expect(page.getByRole('columnheader', { name: 'Khóa học' })).toBeVisible();
		await expect(page.locator('.mc-data-table').first()).toBeVisible();
	});

	test('operates the question bank and reusable test library end to end', async ({ page }) => {
		test.setTimeout(90_000);
		const suffix = Date.now();
		const marker = `E2E assessment ${suffix}`;
		const createdQuestionIds: string[] = [];
		let testId = '';
		try {
			const courseGraphResponse = await page.request.get(
				'/api/admin/my-class/authoring/courses/hrm-toi-gian',
			);
			const courseGraph = (await courseGraphResponse.json()) as {
				data: {
					id?: string;
					title?: string;
					lessons: Array<{
						id: string;
						title: string;
						sections: Array<{
							id: string;
							title: string;
							knowledgeUnits: Array<{ id: string }>;
						}>;
					}>;
				};
			};
			const knowledgeUnitId = courseGraph.data.lessons[0]?.sections[0]?.knowledgeUnits[0]?.id;
			expect(knowledgeUnitId).toBeTruthy();
			const questionInputs = [
				{
					slug: `e2e-single-${suffix}`,
					type: 'MCQ_SINGLE',
					stem: `${marker} single`,
					options: [
						{ key: 'A', text: 'Đúng' },
						{ key: 'B', text: 'Sai' },
					],
					answer: { type: 'MCQ_SINGLE', correctKey: 'A' },
					difficulty: 1,
					knowledgeUnitIds: [knowledgeUnitId!],
				},
				{
					slug: `e2e-multi-${suffix}`,
					type: 'MCQ_MULTI',
					stem: `${marker} multi`,
					options: [
						{ key: 'A', text: 'Một' },
						{ key: 'B', text: 'Hai' },
						{ key: 'C', text: 'Ba' },
					],
					answer: { type: 'MCQ_MULTI', correctKeys: ['A', 'B'], scoring: 'PARTIAL' },
					difficulty: 2,
					knowledgeUnitIds: [knowledgeUnitId!],
				},
				{
					slug: `e2e-blank-${suffix}`,
					type: 'FILL_BLANK',
					stem: `${marker} blank [[1]]`,
					options: [],
					answer: {
						type: 'FILL_BLANK',
						scoring: 'PARTIAL',
						blanks: [
							{
								id: '1',
								length: 3,
								accepted: ['mau'],
								caseSensitive: false,
								ignoreDiacritics: true,
							},
						],
					},
					difficulty: 3,
					knowledgeUnitIds: [knowledgeUnitId!],
				},
			];
			for (const input of questionInputs) {
				const response = await page.request.post('/api/admin/my-class/questions', { data: input });
				expect(response.status()).toBe(201);
				const body = (await response.json()) as { data: { id: string } };
				createdQuestionIds.push(body.data.id);
			}

			await page.goto('/admin/my-class/bank');
			await page.getByLabel('Tìm câu hỏi').first().fill(marker);
			await page.getByRole('button', { name: 'Áp dụng' }).click();
			await expect(page.getByTestId('bank-table').first()).toContainText(`${marker} single`);
			await expect(page.getByTestId('bank-table').first()).toContainText(`${marker} multi`);
			await expect(page.getByTestId('bank-table').first()).toContainText(`${marker} blank`);
			await page.getByRole('checkbox', { name: 'Chọn tất cả' }).check();
			await page.getByPlaceholder('Tags…').fill('e2e-reviewed');
			await page.getByRole('button', { name: 'Gắn tag' }).click();
			await expect(page.getByText('0 đã chọn')).toHaveCount(0);

			await page.goto('/admin/my-class/tests/new');
			await page.getByLabel('Tên bài kiểm tra').first().fill(`${marker} reusable`);
			await page.getByRole('button', { name: 'Tạo bài kiểm tra' }).first().click();
			await expect(page).toHaveURL(/\/admin\/my-class\/tests\/(?!new$)[^/?#]+$/);
			testId = new URL(page.url()).pathname.split('/').filter(Boolean).pop() ?? '';
			expect(testId).not.toBe('');

			await page.getByPlaceholder('Tìm trong ngân hàng…').first().fill(marker);
			await page.getByLabel('Số câu ngẫu nhiên').first().fill('3');
			await page.getByRole('button', { name: 'Thêm ngẫu nhiên' }).first().click();
			await expect(page.getByRole('button', { name: 'Gỡ' })).toHaveCount(3);

			await page.getByRole('button', { name: 'Cài đặt' }).first().click();
			await page.getByLabel('Điểm đạt (%)').first().fill('60');
			await page.getByLabel('Thời gian (phút)').first().fill('15');
			await page.getByLabel('Số lần làm tối đa').first().fill('2');
			await page.getByLabel('Xáo câu hỏi').first().check();
			await page.getByRole('button', { name: 'Lưu bản nháp' }).first().click();

			const lesson = courseGraph.data.lessons[0];
			const section = lesson?.sections[0];
			expect(section).toBeTruthy();
			const course = await fetchAdminCourse(page.request);
			expect(course).toBeTruthy();
			const placed = await page.request.post(`/api/admin/my-class/tests/${testId}/placements`, {
				data: {
					courseId: course!.id,
					scope: 'SECTION',
					lessonId: lesson!.id,
					sectionId: section!.id,
				},
			});
			expect(placed.ok(), await placed.text()).toBe(true);

			const validation = await page.request.get(`/api/admin/my-class/tests/${testId}/publish`);
			const validationBody = (await validation.json()) as {
				data?: Array<{ severity?: string; message: string }>;
				error?: string;
			};
			expect(validation.ok(), JSON.stringify(validationBody)).toBe(true);
			expect((validationBody.data ?? []).filter((issue) => issue.severity !== 'warning')).toEqual(
				[],
			);
			const published = await page.request.post(`/api/admin/my-class/tests/${testId}/publish`);
			expect(published.ok(), await published.text()).toBe(true);
			await expect
				.poll(async () => {
					const response = await page.request.get(`/api/admin/my-class/tests/${testId}/preview`);
					return response.ok();
				})
				.toBe(true);
			const preview = await page.request.get(`/api/admin/my-class/tests/${testId}/preview`);
			expect(preview.ok()).toBe(true);
			const previewBody = (await preview.json()) as {
				data: { questions: Array<{ type: string }> };
			};
			expect(new Set(previewBody.data.questions.map((question) => question.type))).toEqual(
				new Set(['MCQ_SINGLE', 'MCQ_MULTI', 'FILL_BLANK']),
			);
		} finally {
			if (testId) await page.request.delete(`/api/admin/my-class/tests/${testId}`);
			for (const id of createdQuestionIds) {
				await page.request.delete(`/api/admin/my-class/questions/${id}`);
			}
		}
	});

	test('My Class studio stays available in the archive shell', async ({ page }) => {
		await page.goto('/admin/my-class/courses');
		await expect(page.getByTestId('archive-banner')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Đã hiểu' })).toHaveCount(0);
	});

	test('creates a vocabulary set from the My Class studio library', async ({ page }) => {
		const suffix = Date.now();
		const title = `Studio vocab E2E ${suffix}`;
		let vocabSetId: string | undefined;
		try {
			await page.goto('/admin/my-class/vocabulary/new');
			await expect(page.getByRole('heading', { name: 'Tạo bộ từ vựng' })).toBeVisible();
			await page.locator('input[name="vocab-set-title"]').first().fill(title);
			await page.getByLabel('Từ', { exact: true }).first().fill(`term-e2e-${suffix}`);
			await page.getByLabel('Nghĩa tiếng Việt').first().fill('nghĩa e2e');
			const created = page.waitForResponse(
				(response) =>
					response.url().endsWith('/api/admin/my-class/vocab-sets') &&
					response.request().method() === 'POST' &&
					response.status() === 201,
			);
			await page.getByRole('button', { name: 'Tạo bộ từ' }).click();
			const body = (await (await created).json()) as { data: { set: { id: string } } };
			vocabSetId = body.data.set.id;
			await expect(page).toHaveURL(new RegExp(`/admin/my-class/vocabulary/${vocabSetId}`));
			await expect(page.getByRole('heading', { name: 'Sửa bộ từ vựng' })).toBeVisible();

			const archived = page.waitForResponse(
				(response) =>
					response.url().includes(`/api/admin/my-class/vocab-sets/${vocabSetId}`) &&
					response.request().method() === 'DELETE' &&
					response.ok(),
			);
			await page.getByRole('button', { name: 'Lưu trữ' }).click();
			await expect(page.getByTestId('admin-confirm')).toBeVisible();
			await page.getByTestId('admin-confirm-accept').click();
			await archived;
			await expect(page).toHaveURL(/\/admin\/my-class\/vocabulary$/);
			vocabSetId = undefined;
		} finally {
			if (vocabSetId) {
				await page.request.delete(`/api/admin/my-class/vocab-sets/${vocabSetId}`);
			}
		}
	});

	test('attaches a test from the admin TestBuilder', async ({ page }) => {
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();
		const suffix = Date.now();
		const created = await page.request.post('/api/admin/my-class/tests', {
			data: { title: `E2E gắn bài ${suffix}`, slug: `e2e-attach-${suffix}` },
		});
		expect(created.status()).toBe(201);
		const body = (await created.json()) as { data: { id: string } };
		const testId = body.data.id;
		try {
			await page.goto(`/admin/my-class/tests/${testId}`);
			await page.getByRole('button', { name: 'Đã gắn' }).click();
			await page.getByRole('button', { name: 'Gắn vào khóa học' }).click();
			const courseSelect = page.getByRole('combobox', { name: 'Khóa học', exact: true });
			await expect(courseSelect).toContainText(course!.title);
			await courseSelect.selectOption(course!.id);
			const attached = page.waitForResponse(
				(response) =>
					response.url().endsWith(`/api/admin/my-class/tests/${testId}/placements`) &&
					response.request().method() === 'POST' &&
					response.status() === 201,
			);
			await page.getByRole('button', { name: 'Gắn vào vị trí này' }).click();
			await attached;
			await expect(page.getByText(/HRM tối giản/)).toBeVisible();
			await expect(page.getByText(/COURSE/)).toBeVisible();
		} finally {
			await page.request.delete(`/api/admin/my-class/tests/${testId}`);
		}
	});

	test('imports a vocabulary CSV from the course vocabulary tab', async ({ page }) => {
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();
		const suffix = Date.now();
		const title = `Studio CSV vocab ${suffix}`;
		const term = `csv-tab-${suffix}`;
		const csv = ['term,meaning_vi', `${term},nghĩa csv tab`].join('\n');
		let vocabSetId: string | undefined;
		try {
			await page.goto(`/admin/my-class/courses/${course!.id}/vocabulary`);
			await page.getByRole('button', { name: 'Nhập CSV' }).click();
			const dialog = page.getByRole('dialog', { name: 'Thêm từ vựng' });
			await expect(dialog).toBeVisible();
			await expect(dialog).toContainText('Gắn vào khóa học');
			await expect(dialog.getByLabel('Tên bộ từ')).toHaveValue(/Từ vựng/);
			await dialog.getByLabel('Tên bộ từ').fill(title);
			await dialog.locator('textarea').last().fill(csv);
			await expect(dialog.getByRole('button', { name: 'Xem trước' })).toBeEnabled();
			await dialog.getByRole('button', { name: 'Xem trước' }).click();
			await expect(dialog.getByText('1 từ hợp lệ')).toBeVisible();
			const committed = page.waitForResponse(
				(response) =>
					response
						.url()
						.endsWith(`/api/admin/my-class/courses/${course!.id}/vocab-assignments/import`) &&
					response.request().method() === 'POST' &&
					response.status() === 201,
			);
			await dialog.getByRole('button', { name: 'Tạo & gắn' }).click();
			const commitBody = (await (await committed).json()) as { data: { set: { id: string } } };
			vocabSetId = commitBody.data.set.id;
			await expect(dialog).toHaveCount(0);
			await expect(page.getByText(title)).toBeVisible();
		} finally {
			if (vocabSetId) {
				await page.request.delete(`/api/admin/my-class/vocab-sets/${vocabSetId}`);
			}
		}
	});

	test('creates a vocabulary set from CSV and attaches it to a lesson', async ({
		page,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
			origin: 'http://localhost:3000',
		});
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();

		const authoringResponse = await page.request.get(
			`/api/admin/my-class/authoring/courses/${course!.slug}`,
		);
		expect(authoringResponse.ok()).toBe(true);
		const authoring = (await authoringResponse.json()) as {
			data: { lessons: Array<{ id: string; title: string }> };
		};
		const lesson = authoring.data.lessons[0];
		expect(lesson).toBeTruthy();

		const suffix = Date.now();
		const title = `${lesson!.title} — Từ vựng E2E ${suffix}`;
		const firstTerm = `stakeholder-e2e-${suffix}`;
		const secondTerm = `scope-e2e-${suffix}`;
		const csv = [
			'term,pronunciation,part_of_speech,meaning_en,meaning_vi,explanation,example,hints_hard,hints_medium,hints_easy',
			`${firstTerm},/ˈsteɪkˌhəʊldə/,noun,a person with an interest in a project,bên liên quan,Người hoặc nhóm có thể ảnh hưởng đến dự án,The project manager consulted every stakeholder.,ảnh hưởng đến dự án,có quyền lợi liên quan,bên liên quan`,
			`${secondTerm},/skəʊp/,noun,the extent of a project,phạm vi,Phần công việc và kết quả dự án cam kết cung cấp,The team agreed the project scope.,ranh giới công việc,nội dung dự án,phạm vi`,
		].join('\n');

		let assignmentId: string | undefined;
		let vocabSetId: string | undefined;
		try {
			await page.goto(`/admin/my-class/courses/${course!.id}/vocabulary`);
			await page
				.locator('select[aria-label="Phạm vi nhập CSV"]:visible')
				.selectOption({ value: lesson!.id });
			await page.getByRole('button', { name: 'Nhập CSV' }).click();

			const dialog = page.getByRole('dialog', { name: 'Thêm từ vựng' });
			await expect(dialog).toBeVisible();
			await expect(dialog).toContainText(`Gắn vào bài: ${lesson!.title}`);
			await dialog.getByLabel('Tên bộ từ').fill(title);
			await dialog.locator('textarea').nth(0).fill(`${firstTerm}\n${secondTerm}`);
			await dialog.getByRole('button', { name: 'Sinh prompt' }).click();
			await expect(dialog.locator('pre')).toContainText(
				'term,pronunciation,part_of_speech,meaning_en,meaning_vi',
			);
			await dialog.getByRole('button', { name: 'Copy prompt' }).click();
			await expect(dialog.getByRole('button', { name: 'Đã copy!' })).toBeVisible();

			await dialog.locator('textarea').nth(1).fill('term,meaning_vi\n,thiếu từ');
			await dialog.getByRole('button', { name: 'Xem trước' }).click();
			await expect(dialog.getByText('1 dòng lỗi')).toBeVisible();
			await expect(dialog.getByRole('button', { name: 'Copy prompt sửa lỗi' })).toBeVisible();
			await dialog.getByRole('button', { name: 'Copy prompt sửa lỗi' }).click();
			await expect(dialog.getByRole('button', { name: 'Đã copy!' }).last()).toBeVisible();

			await dialog.locator('textarea').nth(1).fill(csv);
			await dialog.getByRole('button', { name: 'Xem trước' }).click();
			await expect(dialog.getByText('2 từ hợp lệ')).toBeVisible();
			await expect(dialog.getByRole('cell', { name: firstTerm })).toBeVisible();
			await expect(dialog.getByRole('cell', { name: '/ˈsteɪkˌhəʊldə/' })).toBeVisible();

			const committed = page.waitForResponse(
				(response) =>
					response
						.url()
						.endsWith(`/api/admin/my-class/courses/${course!.id}/vocab-assignments/import`) &&
					response.request().method() === 'POST' &&
					response.status() === 201,
			);
			await dialog.getByRole('button', { name: /Tạo & gắn/ }).click();
			const commitBody = (await (await committed).json()) as {
				data: {
					set: { id: string };
					assignment: { id: string; lessonId: string | null };
				};
			};
			vocabSetId = commitBody.data.set.id;
			assignmentId = commitBody.data.assignment.id;
			expect(commitBody.data.assignment.lessonId).toBe(lesson!.id);
			await expect(dialog).toHaveCount(0);
			await expect(page.getByText(title)).toBeVisible();
			await expect(page.getByTestId('archive-banner')).toBeVisible();
		} finally {
			if (assignmentId) {
				await page.request.delete(
					`/api/admin/my-class/courses/${course!.id}/vocab-assignments/${assignmentId}`,
				);
			}
			if (vocabSetId) {
				await page.request.delete(`/api/vocab-sets/${vocabSetId}?action=archive`);
			}
		}
	});

	test('rejects an invalid lesson without leaving an orphan vocabulary set', async ({ page }) => {
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();
		const title = `Orphan guard E2E ${Date.now()}`;
		const response = await page.request.post(
			`/api/admin/my-class/courses/${course!.id}/vocab-assignments/import`,
			{
				data: {
					lessonId: 'lesson-does-not-exist',
					title,
					csv: 'term,meaning_vi\norphan-check,kiểm tra dữ liệu mồ côi',
					mode: 'commit',
				},
			},
		);
		expect(response.status()).toBe(422);

		const search = await page.request.get(
			`/api/admin/my-class/courses/${course!.id}/vocab-assignments?q=${encodeURIComponent(title)}`,
		);
		expect(search.ok()).toBe(true);
		const body = (await search.json()) as { data: Array<{ title: string }> };
		expect(body.data.some((item) => item.title === title)).toBe(false);
	});

	test('renames and reorders a section in edit mode without losing units', async ({ page }) => {
		test.setTimeout(90_000);
		const course = await fetchAdminCourse(page.request);
		expect(course).toBeTruthy();

		const authoringRes = await page.request.get(
			`/api/admin/my-class/authoring/courses/${course!.slug}`,
		);
		expect(authoringRes.ok()).toBe(true);
		const authoring = (await authoringRes.json()) as {
			data: {
				lessons: Array<{
					id: string;
					title: string;
					sections: Array<{
						id: string;
						title: string;
						authoring?: { updatedAt: string };
						knowledgeUnits: Array<{ id: string; title: string }>;
					}>;
				}>;
			};
		};
		const lesson = authoring.data.lessons[0];
		expect(lesson?.sections.length).toBeGreaterThan(1);
		const originalIds = lesson!.sections.map((section) => section.id);
		const originalTitles = lesson!.sections.map((section) => section.title);
		const firstUnits = lesson!.sections[0]!.knowledgeUnits.map((unit) => unit.title);
		const renamed = `${lesson!.sections[0]!.title} · e2e`;

		try {
			await page.goto(`/admin/my-class/courses/${course!.id}/content`);
			await page.getByRole('button', { name: 'Mở bài' }).first().click();

			const firstSection = lesson!.sections[0]!;
			const renamedResponse = await page.request.patch(
				`/api/admin/my-class/courses/${course!.id}/nodes/section/${firstSection.id}`,
				{
					data: {
						expectedUpdatedAt: firstSection.authoring?.updatedAt,
						changes: { title: renamed },
					},
				},
			);
			expect(renamedResponse.ok(), await renamedResponse.text()).toBe(true);

			const reorderedResponse = await page.request.post(
				`/api/admin/my-class/courses/${course!.id}/reorder`,
				{
					data: {
						parentType: 'lesson',
						parentId: lesson!.id,
						orderedNodeIds: [originalIds[1]!, originalIds[0]!, ...originalIds.slice(2)],
					},
				},
			);
			expect(reorderedResponse.ok(), await reorderedResponse.text()).toBe(true);

			await page.reload();
			await page.getByRole('button', { name: 'Mở bài' }).first().click();
			await expect(page.getByRole('button', { name: new RegExp(renamed) }).first()).toBeVisible();
			const titles = await page.getByRole('button', { name: / · / }).allTextContents();
			expect(titles.some((text) => text.includes(originalTitles[1]!))).toBe(true);
			expect(titles.some((text) => text.includes(renamed))).toBe(true);
			const firstSectionIndex = titles.findIndex((text) => text.includes(originalTitles[1]!));
			const renamedIndex = titles.findIndex((text) => text.includes(renamed));
			expect(firstSectionIndex).toBeGreaterThanOrEqual(0);
			expect(renamedIndex).toBeGreaterThan(firstSectionIndex);
			while ((await page.getByRole('button', { name: 'Mở chủ đề' }).count()) > 0) {
				await page.getByRole('button', { name: 'Mở chủ đề' }).first().click();
			}
			for (const title of firstUnits) {
				await expect(page.getByRole('button', { name: new RegExp(title) }).first()).toBeVisible();
			}
		} finally {
			await page.request
				.post(`/api/admin/my-class/courses/${course!.id}/reorder`, {
					timeout: 15_000,
					data: {
						parentType: 'lesson',
						parentId: lesson!.id,
						orderedNodeIds: originalIds,
					},
				})
				.catch(() => undefined);
			const freshRes = await page.request
				.get(`/api/admin/my-class/authoring/courses/${course!.slug}`, { timeout: 15_000 })
				.catch(() => null);
			if (!freshRes) return;
			const fresh = (await freshRes.json()) as typeof authoring;
			const current = fresh.data.lessons
				.find((item) => item.id === lesson!.id)
				?.sections.find((section) => section.id === originalIds[0]);
			if (current) {
				await page.request
					.patch(`/api/admin/my-class/courses/${course!.id}/nodes/section/${originalIds[0]}`, {
						timeout: 15_000,
						data: {
							expectedUpdatedAt: current.authoring?.updatedAt,
							changes: { title: originalTitles[0] },
						},
					})
					.catch(() => undefined);
			}
		}
	});

	test('does not overflow on mobile admin and inline-edit surfaces', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		for (const url of ['/admin/my-class', '/admin/my-class/courses']) {
			await page.goto(url);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
			);
			expect(overflow, url).toBe(false);
		}
	});
});

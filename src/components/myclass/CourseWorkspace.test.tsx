import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CourseWorkspace from './CourseWorkspace';
import {
	resolveLearnerState,
	seedsFromCourseOutline,
} from '@/features/my-class/domain/learnerState';
import type { MyClassCourseDetail, MyClassKnowledgeUnit } from '@/features/my-class/types';

const mocks = vi.hoisted(() => ({
	postComplete: vi.fn(),
	refresh: vi.fn(),
	push: vi.fn(),
	replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: mocks.refresh, push: mocks.push, replace: mocks.replace }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock('@/features/my-class/client/progressStore', async () => {
	const actual = await vi.importActual<typeof import('@/features/my-class/client/progressStore')>(
		'@/features/my-class/client/progressStore',
	);
	return {
		...actual,
		postComplete: mocks.postComplete,
		flushCompleteQueue: vi
			.fn()
			.mockResolvedValue({ byCourseId: {}, pendingByCourseId: {}, permanentErrors: [] }),
	};
});

const course = {
	id: 'c1',
	slug: 'hrm',
	title: 'Human Resource Management',
	summary: 'Khóa học thử nghiệm',
	description: '',
	thumbnailUrl: null,
	level: null,
	tags: [],
	tests: [
		{
			slug: 'course-check',
			title: 'Kiểm tra toàn khóa',
			description: 'Ôn lại kiến thức chính',
			questionCount: 8,
			scope: 'COURSE',
		},
	],
	vocabSets: [],
	lessons: [
		{
			id: 'l1',
			slug: 'lesson-1',
			title: 'Bài 1',
			summary: '',
			position: 0,
			tests: [],
			sections: [
				{
					id: 's1',
					slug: 'nen-tang',
					title: 'Nền tảng',
					summary: '',
					position: 0,
					tests: [
						{
							slug: 'section-check',
							title: 'Kiểm tra nền tảng',
							description: '',
							questionCount: 3,
							scope: 'SECTION',
						},
					],
					knowledgeUnits: [
						{
							id: 'k1',
							slug: 'a',
							title: 'Nội dung A',
							summary: '',
							position: 0,
							availableLevels: ['readable'],
						},
						{
							id: 'k2',
							slug: 'b',
							title: 'Nội dung B',
							summary: '',
							position: 1,
							availableLevels: ['readable'],
						},
					],
				},
			],
		},
		{
			id: 'l2',
			slug: 'lesson-2',
			title: 'Bài 2',
			summary: '',
			position: 1,
			tests: [],
			sections: [
				{
					id: 's2',
					slug: 'ung-dung',
					title: 'Ứng dụng',
					summary: '',
					position: 0,
					tests: [],
					knowledgeUnits: [
						{
							id: 'k3',
							slug: 'c',
							title: 'Nội dung C',
							summary: '',
							position: 0,
							availableLevels: ['readable'],
						},
					],
				},
			],
		},
	],
} satisfies MyClassCourseDetail;

const initialState = resolveLearnerState({
	seeds: seedsFromCourseOutline(course),
	completedUnitIds: [],
});

function contentFor(slug: string): MyClassKnowledgeUnit {
	return {
		id: slug === 'a' ? 'k1' : slug === 'b' ? 'k2' : 'k3',
		slug,
		title: slug === 'a' ? 'Nội dung A' : slug === 'b' ? 'Nội dung B' : 'Nội dung C',
		summary: '',
		foundationHtml: `<h3>Điểm chính</h3><p>${slug}</p>`,
		academicHtml: '',
		expertHtml: '',
		levels: ['FOUNDATION'],
		availableLevels: ['readable'],
	};
}

function mockViewport(desktop = false, wide = false) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn((query: string) => ({
			matches: query.includes('1280') ? wide : query.includes('1024') ? desktop : false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
			onchange: null,
		})),
	});
}

function renderReader(unitSlug = 'a') {
	return render(
		<CourseWorkspace
			course={course}
			initialState={initialState}
			initialLessonSlug="lesson-1"
			initialUnitSlug={unitSlug}
			initialSectionSlug="nen-tang"
		/>,
	);
}

describe('CourseWorkspace interactions', () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		window.history.replaceState({}, '', '/my-space/my-class/hrm/lesson-1/a');
		mockViewport(false);
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			value: vi.fn(),
			configurable: true,
		});
		Object.defineProperty(window, 'scrollTo', { value: vi.fn(), configurable: true });
		Object.defineProperty(window.HTMLDialogElement.prototype, 'showModal', {
			value() {
				this.setAttribute('open', '');
			},
			configurable: true,
		});
		Object.defineProperty(window.HTMLDialogElement.prototype, 'close', {
			value() {
				this.removeAttribute('open');
				this.dispatchEvent(new Event('close'));
			},
			configurable: true,
		});
		mocks.postComplete.mockReset();
		mocks.refresh.mockReset();
		mocks.push.mockReset();
		mocks.replace.mockReset();
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/actor/bootstrap'))
					return { json: async () => ({ data: { storageScope: 'test' } }) } as Response;
				if (url.includes('/knowledge/a') && !url.includes('/complete'))
					return {
						json: async () => ({
							ok: true,
							data: { unit: contentFor('a'), progress: initialState },
						}),
					} as Response;
				if (url.includes('/knowledge/b') && !url.includes('/complete'))
					return {
						json: async () => ({
							ok: true,
							data: { unit: contentFor('b'), progress: initialState },
						}),
					} as Response;
				if (url.includes('/knowledge/c') && !url.includes('/complete'))
					return {
						json: async () => ({
							ok: true,
							data: { unit: contentFor('c'), progress: initialState },
						}),
					} as Response;
				if (url.includes('/tests/'))
					return {
						ok: true,
						json: async () => ({
							ok: true,
							data: {
								slug: 'section-check',
								title: 'Kiểm tra nền tảng',
								description: '',
								questionCount: 1,
								scope: 'SECTION',
								courseSlug: 'hrm',
								returnTo: { href: '/my-space/my-class/hrm', label: 'Course' },
								questions: [
									{
										id: 'q1',
										stem: 'One?',
										options: [
											{ key: 'A', text: 'Yes' },
											{ key: 'B', text: 'No' },
										],
										position: 0,
									},
								],
							},
						}),
					} as Response;
				return { json: async () => ({ ok: true }) } as Response;
			}),
		);
	});

	it('shows course landing with lesson path when no unit is selected', () => {
		render(<CourseWorkspace course={course} initialState={initialState} />);
		expect(screen.getByRole('heading', { name: course.title })).toBeVisible();
		expect(screen.getByRole('heading', { name: 'Các bài học' })).toBeVisible();
		expect(screen.getAllByRole('link', { name: 'Tất cả khóa học' }).length).toBeGreaterThan(0);
		expect(screen.getAllByRole('link', { name: /Bắt đầu/ }).length).toBeGreaterThan(0);
		expect(
			screen.queryByRole('heading', { name: 'Luyện tập có chủ đích' }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('link', { name: /Kiểm tra toàn khóa|Kiểm tra nền tảng/ }),
		).not.toBeInTheDocument();
	});

	it('restores the Reader from path props', async () => {
		renderReader('b');
		expect(screen.getByRole('link', { name: 'Tất cả khóa học' })).toHaveAttribute(
			'href',
			'/my-space/my-class',
		);
		expect(screen.getByRole('heading', { name: 'Nội dung B' })).toBeVisible();
		expect(within(screen.getByTestId('my-class-reader')).getByText(/Nền tảng/)).toBeVisible();
		expect(within(screen.getByTestId('my-class-reader')).getByText(/Bài 01/)).toBeVisible();
		await waitFor(() => {
			expect(screen.getByTestId('my-class-reader')).toHaveTextContent('Điểm chính');
		});
	});

	it('shows lesson outline without noisy Nội dung x.y.z labels', () => {
		renderReader();
		const outlines = screen.getAllByTestId('my-class-outline');
		expect(outlines.some((el) => el.textContent?.includes('Nội dung A'))).toBe(true);
		expect(outlines.some((el) => el.textContent?.includes('Nội dung B'))).toBe(true);
		expect(outlines.every((el) => !/Nội dung 1\.1/.test(el.textContent ?? ''))).toBe(true);
		expect(outlines.every((el) => !(el.textContent ?? '').includes('Chưa học'))).toBe(true);
	});

	it('opens the mobile outline sheet from the reader', async () => {
		renderReader();
		const reader = screen.getByTestId('my-class-reader');
		expect(reader).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Mục lục' }));
		await waitFor(() => {
			const currents = screen.getAllByRole('button', { current: 'page' });
			expect(currents.some((el) => el.textContent?.includes('Nội dung A'))).toBe(true);
		});
	});

	it('hides topbar search and lesson jump on mobile', async () => {
		renderReader();
		expect(screen.queryByRole('button', { name: 'Tìm (/)' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Tìm trong khóa học' })).not.toBeInTheDocument();
		expect(screen.queryByTestId('my-class-lesson-jump')).not.toBeInTheDocument();
		expect(screen.queryByLabelText('Chuyển bài học')).not.toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getByTestId('my-class-reader')).toHaveTextContent('Điểm chính');
		});
	});

	it('keeps icon-only search and lesson jump on desktop', async () => {
		mockViewport(true);
		renderReader();
		expect(screen.queryByRole('button', { name: 'Tìm (/)' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Tìm trong khóa học' })).toBeVisible();
		expect(screen.getByTestId('my-class-lesson-jump')).toBeVisible();
		expect(screen.getByLabelText('Chuyển bài học')).toBeVisible();
		await waitFor(() => {
			expect(screen.getByTestId('my-class-reader')).toHaveTextContent('Điểm chính');
		});
	});

	it('opens a progress test in the reader column and dismisses it without leaving the unit', async () => {
		renderReader();
		fireEvent.click(screen.getByRole('button', { name: 'Mục lục' }));
		const outlineSheet = await screen.findByRole('dialog', { name: 'Mục lục' });
		fireEvent.click(within(outlineSheet).getByRole('button', { name: /Kiểm tra nền tảng/ }));
		expect(await screen.findByTestId('my-class-test-runner')).toBeVisible();
		expect(screen.queryByRole('dialog', { name: /Kiểm tra/ })).not.toBeInTheDocument();
		expect(window.location.pathname).toContain('/lesson-1/a');
		fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
		await waitFor(() =>
			expect(screen.queryByTestId('my-class-test-runner')).not.toBeInTheDocument(),
		);
		expect(window.location.pathname).toContain('/lesson-1/a');
	});

	it('keeps the desktop outline visible while a test is open', async () => {
		mockViewport(true);
		renderReader();
		await waitFor(() =>
			expect(document.querySelector('aside [data-testid="my-class-outline"]')).toBeTruthy(),
		);
		const outline = document.querySelector('aside [data-testid="my-class-outline"]')!;
		fireEvent.click(
			within(outline as HTMLElement).getAllByRole('button', { name: /Kiểm tra nền tảng/ })[0]!,
		);
		expect(await screen.findByTestId('my-class-test-runner')).toBeVisible();
		expect(document.querySelector('aside [data-testid="my-class-outline"]')).toBeTruthy();
		expect(screen.queryByRole('dialog', { name: /Kiểm tra/ })).not.toBeInTheDocument();
	});

	it('switches to another lesson from the outline', async () => {
		renderReader();
		fireEvent.click(screen.getByRole('button', { name: 'Mục lục' }));
		const outlineSheet = await screen.findByRole('dialog', { name: 'Mục lục' });
		fireEvent.click(within(outlineSheet).getByRole('button', { name: /02.*Bài 2/ }));
		await waitFor(() => expect(screen.getByRole('heading', { name: 'Nội dung C' })).toBeVisible());
		expect(window.location.pathname).toContain('/lesson-2/c');
	});

	it('collapses the desktop outline and remembers the choice', async () => {
		mockViewport(true);
		renderReader();
		await waitFor(() => expect(screen.getByRole('button', { name: 'Ẩn mục lục' })).toBeVisible());
		fireEvent.click(screen.getByRole('button', { name: 'Ẩn mục lục' }));
		expect(screen.getByRole('button', { name: 'Hiện mục lục' })).toBeVisible();
		expect(localStorage.getItem('my-class:sidebar-collapsed:c1')).toBe('1');
	});

	it('advances before the completion request resolves', async () => {
		mocks.postComplete.mockImplementation(() => new Promise(() => undefined));
		renderReader();
		await waitFor(() => expect(screen.getByText('a')).toBeVisible());
		fireEvent.click(screen.getAllByRole('button', { name: /Đã hiểu/ })[0]!);
		expect(screen.getByRole('heading', { name: 'Nội dung B' })).toBeVisible();
		expect(mocks.postComplete).toHaveBeenCalledTimes(1);
		expect(window.location.pathname).toContain('/b');
		expect(mocks.push).not.toHaveBeenCalled();
	});

	it('keeps the optimistic lesson open when progress can be retried later', async () => {
		mocks.postComplete.mockResolvedValue({
			ok: false,
			retryable: true,
			status: 0,
			message: 'Mất kết nối',
		});
		renderReader();
		await waitFor(() => expect(screen.getByText('a')).toBeVisible());
		fireEvent.click(screen.getAllByRole('button', { name: /Đã hiểu/ })[0]!);
		expect(screen.getByRole('heading', { name: 'Nội dung B' })).toBeVisible();
		await waitFor(() => expect(screen.getByText(/Đã lưu tạm/)).toBeVisible());
		expect(mocks.refresh).not.toHaveBeenCalled();
	});

	it('reports a permanent save failure and requests authoritative progress', async () => {
		mocks.postComplete.mockResolvedValue({
			ok: false,
			retryable: false,
			status: 422,
			message: 'Không thể lưu tiến độ',
		});
		renderReader();
		await waitFor(() => expect(screen.getByText('a')).toBeVisible());
		fireEvent.click(screen.getAllByRole('button', { name: /Đã hiểu/ })[0]!);
		expect(await screen.findByText('Không thể lưu tiến độ')).toBeVisible();
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});
});

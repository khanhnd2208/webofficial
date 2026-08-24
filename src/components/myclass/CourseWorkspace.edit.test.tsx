import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CourseWorkspace from './CourseWorkspace';
import {
	resolveLearnerState,
	seedsFromCourseOutline,
} from '@/features/my-class/domain/learnerState';
import type { MyClassCourseDetail, MyClassKnowledgeUnit } from '@/features/my-class/types';
import { myClassApi } from '@/components/myclass/admin/api';

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

vi.mock('@/components/myclass/admin/api', () => ({
	myClassApi: vi.fn(),
}));

vi.mock('@/components/myclass/admin/KnowledgeUnitFields', () => ({
	default: (props: {
		title: string;
		academicHtml: string;
		onTitleChange: (value: string) => void;
		onAcademicChange: (value: string) => void;
	}) => (
		<div>
			<label>
				Tiêu đề
				<input
					value={props.title}
					onChange={(event) => props.onTitleChange(event.target.value)}
				/>
			</label>
			<label>
				Học thuật
				<textarea
					value={props.academicHtml}
					onChange={(event) => props.onAcademicChange(event.target.value)}
				/>
			</label>
		</div>
	),
}));

const stamp = '2026-08-15T00:00:00.000Z';
const authoring = { status: 'PUBLISHED' as const, updatedAt: stamp, hasDraft: false };

const course = {
	id: 'c1',
	slug: 'hrm',
	title: 'Human Resource Management',
	summary: 'Khóa học thử nghiệm',
	description: '',
	thumbnailUrl: null,
	level: null,
	tags: [],
	tests: [],
	vocabSets: [],
	lessons: [
		{
			id: 'l1',
			slug: 'lesson-1',
			title: 'Bài 1',
			summary: '',
			position: 0,
			tests: [],
			authoring,
			sections: [
				{
					id: 's1',
					slug: 'nen-tang',
					title: 'Nền tảng',
					summary: '',
					position: 0,
					tests: [],
					authoring,
					knowledgeUnits: [
						{
							id: 'k1',
							slug: 'a',
							title: 'Nội dung A',
							summary: '',
							position: 0,
							availableLevels: ['readable', 'academic'],
							authoring,
						},
						{
							id: 'k2',
							slug: 'b',
							title: 'Nội dung B',
							summary: '',
							position: 1,
							availableLevels: ['readable'],
							authoring,
						},
					],
				},
			],
		},
	],
	authoring,
} satisfies MyClassCourseDetail;

const initialState = resolveLearnerState({
	seeds: seedsFromCourseOutline(course),
	completedUnitIds: [],
});

function contentFor(slug: string, overrides: Partial<MyClassKnowledgeUnit> = {}): MyClassKnowledgeUnit {
	return {
		id: slug === 'a' ? 'k1' : 'k2',
		slug,
		title: slug === 'a' ? 'Nội dung A' : 'Nội dung B',
		summary: '',
		foundationHtml: `<h3>Điểm chính</h3><p>${slug}</p>`,
		academicHtml: slug === 'a' ? '<p>Academic A</p>' : '',
		expertHtml: '',
		levels: slug === 'a' ? ['FOUNDATION', 'ACADEMIC'] : ['FOUNDATION'],
		availableLevels: slug === 'a' ? ['readable', 'academic'] : ['readable'],
		authoring,
		...overrides,
	};
}

function mockViewport(desktop = false) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn((query: string) => ({
			matches: query.includes('1024') ? desktop : false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			dispatchEvent: vi.fn(),
			onchange: null,
		})),
	});
}

describe('CourseWorkspace edit-mode cache', () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		window.history.replaceState({}, '', '/my-space/my-class/hrm/lesson-1/a?edit=1');
		mockViewport(true);
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			value: vi.fn(),
			configurable: true,
		});
		vi.mocked(myClassApi).mockReset();
		vi.mocked(myClassApi).mockImplementation(async (url) => {
			if (url.includes('/nodes/unit/')) return { updatedAt: '2026-08-15T00:02:00.000Z' } as never;
			if (url.includes('/publish')) return { updatedAt: '2026-08-15T00:03:00.000Z' } as never;
			return course as never;
		});
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/actor/bootstrap')) {
					return { json: async () => ({ data: { storageScope: 'test' } }) } as Response;
				}
				if (url.includes('/knowledge/a')) {
					return {
						json: async () => ({
							ok: true,
							data: { unit: contentFor('a'), progress: initialState },
						}),
					} as Response;
				}
				if (url.includes('/knowledge/b')) {
					return {
						json: async () => ({
							ok: true,
							data: { unit: contentFor('b'), progress: initialState },
						}),
					} as Response;
				}
				return { json: async () => ({ ok: true }) } as Response;
			}),
		);
	});

	it('keeps the saved unit after navigating away and back', async () => {
		render(
			<CourseWorkspace
				course={course}
				initialState={initialState}
				isAdmin
				editMode
				initialLessonSlug="lesson-1"
				initialUnitSlug="a"
				initialSectionSlug="nen-tang"
				initialContent={{ unit: contentFor('a'), progress: initialState }}
			/>,
		);

		const title = await screen.findByLabelText('Tiêu đề');
		fireEvent.change(title, { target: { value: 'Nội dung A đã lưu' } });
		fireEvent.change(screen.getByLabelText('Học thuật'), { target: { value: '' } });
		fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
		expect(await screen.findByText('Đã lưu')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
		expect(await screen.findByText('Đã lưu')).toBeInTheDocument();

		const outline = document.querySelector('aside [data-testid="my-class-outline"]') as HTMLElement;
		expect(outline).toBeTruthy();
		fireEvent.click(within(outline).getByRole('button', { name: /Mở: Nội dung B/ }));
		await waitFor(() => {
			expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Nội dung B');
		});

		fireEvent.click(within(outline).getByRole('button', { name: /Đang đọc: Nội dung A|Mở: Nội dung A/ }));
		await waitFor(() => {
			expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Nội dung A đã lưu');
		});
		expect(screen.getByLabelText('Học thuật')).toHaveValue('');
		expect(screen.getByText('Đã lưu')).toBeInTheDocument();
		expect(screen.queryByRole('dialog', { name: 'Khôi phục bản nháp cục bộ?' })).not.toBeInTheDocument();
	});

	it('lets authors collapse lessons and sections in edit mode', async () => {
		render(
			<CourseWorkspace
				course={course}
				initialState={initialState}
				isAdmin
				editMode
				initialLessonSlug="lesson-1"
				initialUnitSlug="a"
				initialSectionSlug="nen-tang"
				initialContent={{ unit: contentFor('a'), progress: initialState }}
			/>,
		);

		await screen.findByLabelText('Tiêu đề');
		const outline = document.querySelector('aside [data-testid="my-class-outline"]') as HTMLElement;
		expect(outline).toBeTruthy();
		expect(within(outline).getByRole('button', { name: /Đang đọc: Nội dung A|Mở: Nội dung A/ })).toBeVisible();

		fireEvent.click(within(outline).getByRole('button', { name: /Thu gọn phần 1\.1/ }));
		expect(within(outline).getByRole('button', { name: /Mở phần 1\.1/ })).toHaveAttribute(
			'aria-expanded',
			'false',
		);

		fireEvent.click(within(outline).getByRole('button', { name: 'Thu gọn tất cả' }));
		expect(within(outline).getByRole('button', { name: 'Mở tất cả' })).toBeVisible();
		expect(within(outline).getByRole('button', { name: 'Mở Bài 1' })).toHaveAttribute(
			'aria-expanded',
			'false',
		);
	});

	it('keeps published Progress Tests aligned with the learner outline and isolates drafts', async () => {
		const courseWithTests = {
			...course,
			lessons: [
				{
					...course.lessons[0]!,
					tests: [
						{
							id: 'draft-1',
							slug: 'progress-test',
							title: 'Progress Test',
							description: '',
							questionCount: 3,
							scope: 'LESSON' as const,
							placementId: 'p-draft-1',
							position: 0,
							authoring: { status: 'DRAFT' as const, updatedAt: stamp, hasDraft: true },
						},
						{
							id: 'pub-1',
							slug: 'hrm-bai-1',
							title: 'Test bài 1',
							description: '',
							questionCount: 10,
							scope: 'LESSON' as const,
							placementId: 'p-pub-1',
							position: 1,
							authoring,
						},
					],
				},
			],
		};
		const { rerender } = render(
			<CourseWorkspace
				course={courseWithTests}
				initialState={initialState}
				isAdmin
				editMode
				initialLessonSlug="lesson-1"
				initialUnitSlug="a"
				initialSectionSlug="nen-tang"
				initialContent={{ unit: contentFor('a'), progress: initialState }}
			/>,
		);

		await screen.findByLabelText('Tiêu đề');
		const editOutline = document.querySelector('aside [data-testid="my-class-outline"]') as HTMLElement;
		expect(within(editOutline).getByRole('button', { name: /Progress Test/ })).toBeVisible();
		expect(within(editOutline).getByRole('button', { name: /Test bài 1/ })).toBeVisible();
		expect(within(editOutline).getByText('Bản nháp · chưa hiện với học viên')).toBeVisible();
		expect(within(editOutline).getByText('Nháp')).toBeVisible();
		expect(within(editOutline).getByText('10 câu')).toBeVisible();

		rerender(
			<CourseWorkspace
				course={courseWithTests}
				initialState={initialState}
				isAdmin
				initialLessonSlug="lesson-1"
				initialUnitSlug="a"
				initialSectionSlug="nen-tang"
				initialContent={{ unit: contentFor('a'), progress: initialState }}
			/>,
		);
		const learnerOutline = document.querySelector('aside [data-testid="my-class-outline"]') as HTMLElement;
		expect(within(learnerOutline).queryByRole('button', { name: /Progress Test/ })).not.toBeInTheDocument();
		expect(within(learnerOutline).getByRole('button', { name: /Test bài 1/ })).toBeVisible();
		expect(within(learnerOutline).queryByText('Bản nháp · chưa hiện với học viên')).not.toBeInTheDocument();
		expect(within(learnerOutline).getByText('10 câu')).toBeVisible();
	});

	it('places course tests, lesson vocab, and unpublished warnings in the outline', async () => {
		const courseWithAssets = {
			...course,
			tests: [
				{
					id: 'final-1',
					slug: 'final',
					title: 'Quiz toàn khóa',
					description: '',
					questionCount: 5,
					scope: 'COURSE' as const,
					placementId: 'p-final',
					position: 0,
					authoring,
				},
			],
			vocabSets: [
				{
					assignmentId: 'as-2',
					vocabSetId: 'set-2',
					title: 'Từ vựng bài 2',
					wordCount: 8,
					position: 0,
					scope: 'lesson' as const,
					lessonId: 'l2',
					lessonSlug: 'lesson-2',
					lessonTitle: 'Bài 2',
					isArchived: false,
					guessWhoReady: false,
				},
			],
			lessons: [
				course.lessons[0]!,
				{
					id: 'l2',
					slug: 'lesson-2',
					title: 'Bài 2',
					summary: '',
					position: 1,
					tests: [],
					authoring: { status: 'DRAFT' as const, updatedAt: stamp, hasDraft: true },
					sections: [
						{
							id: 's2',
							slug: 'draft-section',
							title: 'Nháp',
							summary: '',
							position: 0,
							tests: [],
							authoring: { status: 'DRAFT' as const, updatedAt: stamp, hasDraft: true },
							knowledgeUnits: [
								{
									id: 'k3',
									slug: 'c',
									title: 'Nội dung C',
									summary: '',
									position: 0,
									availableLevels: ['readable'] as MyClassKnowledgeUnit['availableLevels'],
									authoring: { status: 'DRAFT' as const, updatedAt: stamp, hasDraft: true },
								},
							],
						},
					],
				},
			],
		};
		render(
			<CourseWorkspace
				course={courseWithAssets}
				initialState={resolveLearnerState({
					seeds: seedsFromCourseOutline(courseWithAssets),
					completedUnitIds: [],
				})}
				isAdmin
				editMode
				initialLessonSlug="lesson-1"
				initialUnitSlug="a"
				initialSectionSlug="nen-tang"
				initialContent={{ unit: contentFor('a'), progress: initialState }}
			/>,
		);

		await screen.findByLabelText('Tiêu đề');
		const outline = document.querySelector('aside [data-testid="my-class-outline"]') as HTMLElement;
		fireEvent.click(within(outline).getByRole('button', { name: 'Mở Bài 2' }));
		expect(within(outline).getByText('Toàn khóa')).toBeVisible();
		expect(within(outline).getByRole('button', { name: /Quiz toàn khóa/ })).toBeVisible();
		expect(within(outline).getByText('Từ vựng bài 2')).toBeVisible();
		expect(within(outline).getByText('Sẽ không hiện với học viên')).toBeVisible();
		expect(within(outline).getByRole('button', { name: 'Gắn vào toàn khóa' })).toBeVisible();
	});
});

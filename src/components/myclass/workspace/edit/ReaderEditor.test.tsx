import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MyClassCourseDetail, MyClassKnowledgeUnit } from '@/features/my-class/types';
import {
	readWorkspaceDraft,
	writeWorkspaceDraft,
} from '@/features/my-class/client/adminDraft';
import { EditModeProvider } from './EditModeContext';
import ReaderEditor from './ReaderEditor';
import { myClassApi } from '@/components/myclass/admin/api';

vi.mock('@/components/myclass/admin/api', () => ({
	myClassApi: vi.fn(),
}));

vi.mock('@/components/myclass/admin/KnowledgeUnitFields', () => ({
	default: (props: {
		title: string;
		slug: string;
		academicHtml: string;
		showSlug?: boolean;
		onTitleChange: (value: string) => void;
		onSlugChange?: (value: string) => void;
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
			{props.showSlug !== false && props.onSlugChange ? (
				<label>
					Đường dẫn
					<input
						value={props.slug}
						onChange={(event) => props.onSlugChange?.(event.target.value)}
					/>
				</label>
			) : null}
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

const unit: MyClassKnowledgeUnit = {
	id: 'unit-1',
	slug: 'unit-1',
	title: 'Published title',
	summary: 'Summary',
	foundationHtml: '<p>Foundation</p>',
	academicHtml: '<p>Academic</p>',
	expertHtml: '<p>Expert</p>',
	levels: ['FOUNDATION', 'ACADEMIC', 'EXPERT'],
	availableLevels: ['readable', 'academic', 'deep'],
	estimatedMinutes: 3,
	authoring: {
		status: 'PUBLISHED',
		updatedAt: '2026-08-15T00:00:00.000Z',
		hasDraft: false,
	},
};

const course = {
	id: 'course-1',
	slug: 'course-1',
	title: 'Course',
	summary: '',
	description: '',
	thumbnailUrl: null,
	level: null,
	tags: [],
	lessonCount: 1,
	unitCount: 1,
	estimatedMinutes: 3,
	tests: [],
	vocabSets: [],
	lessons: [],
	authoring: {
		status: 'PUBLISHED',
		updatedAt: '2026-08-15T00:00:00.000Z',
		hasDraft: false,
	},
} satisfies MyClassCourseDetail;

function renderEditor() {
	return render(
		<EditModeProvider enabled initialCourse={course}>
			<ReaderEditor unit={unit} onSaved={vi.fn()} />
		</EditModeProvider>,
	);
}

describe('ReaderEditor', () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		vi.mocked(myClassApi).mockReset();
	});

	it('does not ask to restore a Tiptap-serialized draft of the same unit', () => {
		writeWorkspaceDraft({
			courseId: course.id,
			nodeType: 'unit',
			nodeId: unit.id,
			title: unit.title,
			slug: unit.slug,
			summary: unit.summary,
			foundationHtml: '<p class="tiptap">Foundation</p>',
			academicHtml: '<p><span>Academic</span></p>',
			expertHtml: '<p>Expert</p><p></p>',
			baseUpdatedAt: unit.authoring!.updatedAt,
		});

		renderEditor();
		expect(screen.queryByRole('dialog', { name: 'Khôi phục bản nháp cục bộ?' })).not.toBeInTheDocument();
		expect(readWorkspaceDraft(course.id, 'unit', unit.id)).toBeNull();
	});

	it('does not ask to restore a draft that only differs by empty editor markup', () => {
		writeWorkspaceDraft({
			courseId: course.id,
			nodeType: 'unit',
			nodeId: unit.id,
			title: unit.title,
			slug: unit.slug,
			summary: unit.summary,
			foundationHtml: `${unit.foundationHtml}<p></p>`,
			academicHtml: `${unit.academicHtml}\n`,
			expertHtml: `${unit.expertHtml}<p><br></p>`,
			baseUpdatedAt: unit.authoring!.updatedAt,
		});

		renderEditor();
		expect(screen.queryByRole('dialog', { name: 'Khôi phục bản nháp cục bộ?' })).not.toBeInTheDocument();
		expect(readWorkspaceDraft(course.id, 'unit', unit.id)).toBeNull();
	});

	it('offers recovery when only an advanced reading level changed', async () => {
		writeWorkspaceDraft({
			courseId: course.id,
			nodeType: 'unit',
			nodeId: unit.id,
			title: unit.title,
			slug: unit.slug,
			summary: unit.summary,
			foundationHtml: unit.foundationHtml,
			academicHtml: '',
			expertHtml: unit.expertHtml,
			baseUpdatedAt: unit.authoring!.updatedAt,
		});

		renderEditor();
		expect(
			await screen.findByRole('dialog', { name: 'Khôi phục bản nháp cục bộ?' }),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Khôi phục' }));
		expect(screen.getByLabelText('Học thuật')).toHaveValue('');
	});

	it('keeps the local backup when publishing fails after saving the server draft', async () => {
		writeWorkspaceDraft({
			courseId: course.id,
			nodeType: 'unit',
			nodeId: unit.id,
			title: unit.title,
			slug: unit.slug,
			summary: unit.summary,
			foundationHtml: unit.foundationHtml,
			academicHtml: unit.academicHtml,
			expertHtml: unit.expertHtml,
			baseUpdatedAt: unit.authoring!.updatedAt,
		});
		vi.mocked(myClassApi).mockImplementation(async (url) => {
			if (url.includes('/nodes/unit/')) {
				return { updatedAt: '2026-08-15T00:01:00.000Z' } as never;
			}
			if (url.includes('/publish')) throw new Error('Publish failed');
			return course as never;
		});

		renderEditor();
		fireEvent.change(screen.getByLabelText('Tiêu đề'), {
			target: { value: 'New draft title' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));

		expect(await screen.findByText('Publish failed')).toBeInTheDocument();
		await waitFor(() => {
			expect(readWorkspaceDraft(course.id, 'unit', unit.id)).not.toBeNull();
		});
	});

	it('shows Đã lưu after Lưu nháp then Xuất bản and forwards the PATCH stamp', async () => {
		const patchStamp = '2026-08-15T00:02:00.000Z';
		const publishBodies: unknown[] = [];
		vi.mocked(myClassApi).mockImplementation(async (url, init) => {
			if (url.includes('/nodes/unit/')) {
				return { updatedAt: patchStamp } as never;
			}
			if (url.includes('/publish')) {
				publishBodies.push(init?.body ? JSON.parse(String(init.body)) : null);
				return { updatedAt: '2026-08-15T00:03:00.000Z' } as never;
			}
			return course as never;
		});

		function Harness() {
			const [current, setCurrent] = useState(unit);
			return (
				<EditModeProvider enabled initialCourse={course}>
					<ReaderEditor unit={current} onSaved={setCurrent} />
				</EditModeProvider>
			);
		}

		render(<Harness />);
		fireEvent.change(screen.getByLabelText('Tiêu đề'), {
			target: { value: 'Saved title' },
		});
		expect(screen.queryByLabelText('Đường dẫn')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
		expect(await screen.findByText('Đã lưu')).toBeInTheDocument();
		expect(screen.queryByRole('dialog', { name: 'Khôi phục bản nháp cục bộ?' })).not.toBeInTheDocument();

		const patchCall = vi.mocked(myClassApi).mock.calls.find(([url]) => String(url).includes('/nodes/unit/'));
		expect(patchCall).toBeTruthy();
		const patchBody = JSON.parse(String(patchCall?.[1]?.body));
		expect(patchBody.changes).not.toHaveProperty('slug');
		expect(patchBody.changes.title).toBe('Saved title');
		expect(await screen.findByText('Đã lưu')).toBeInTheDocument();
		expect(screen.queryByRole('dialog', { name: 'Khôi phục bản nháp cục bộ?' })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
		expect(await screen.findByText('Đã lưu')).toBeInTheDocument();
		expect(screen.queryByRole('dialog', { name: 'Khôi phục bản nháp cục bộ?' })).not.toBeInTheDocument();
		expect(publishBodies).toEqual([{ expectedUpdatedAt: patchStamp }]);
	});
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AttachPicker from './AttachPicker';
import { myClassApi, myClassList } from '@/components/myclass/admin/api';
import type { AttachTarget } from './EditModeContext';

const mocks = vi.hoisted(() => ({
	picker: { kind: 'test', scope: 'COURSE' } as AttachTarget,
	attachTest: vi.fn(),
	attachVocab: vi.fn(),
	setPicker: vi.fn(),
	setToast: vi.fn(),
	course: {
		title: 'HRM',
		lessons: [
			{
				id: 'l1',
				title: 'Bài 03',
				sections: [{ id: 's1', title: 'Chủ đề 3.2' }],
			},
		],
	},
}));

vi.mock('@/components/myclass/admin/api', () => ({
	myClassApi: vi.fn(),
	myClassList: vi.fn(),
}));

vi.mock('./EditModeContext', () => ({
	useEditMode: () => ({
		picker: mocks.picker,
		courseId: 'course-1',
		course: mocks.course,
		attachTest: mocks.attachTest,
		attachVocab: mocks.attachVocab,
		attachExistingUnit: vi.fn(),
		setPicker: mocks.setPicker,
		setToast: mocks.setToast,
	}),
}));

describe('AttachPicker', () => {
	beforeEach(() => {
		mocks.picker = { kind: 'test', scope: 'COURSE' };
		mocks.attachTest.mockReset();
		mocks.attachVocab.mockReset();
		mocks.setPicker.mockReset();
		mocks.setToast.mockReset();
		vi.mocked(myClassList).mockReset();
		vi.mocked(myClassApi).mockReset();
		vi.mocked(myClassList).mockResolvedValue([
			{
				id: 'test-1',
				title: 'Test tổng quan',
				slug: 'test-tong-quan',
				status: 'PUBLISHED',
				_count: { questions: 4 },
			},
		]);
		vi.mocked(myClassApi).mockResolvedValue([]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('stays open when attaching an item fails', async () => {
		mocks.attachTest.mockResolvedValue(false);
		render(<AttachPicker />);

		fireEvent.click(await screen.findByRole('button', { name: /Test tổng quan/ }));
		await waitFor(() => expect(mocks.attachTest).toHaveBeenCalledWith('test-1', expect.anything()));
		expect(mocks.setPicker).not.toHaveBeenCalledWith(null);
		expect(screen.getByRole('dialog', { name: 'Gắn bài kiểm tra' })).toBeInTheDocument();
	});

	it('closes after a successful attachment', async () => {
		mocks.attachTest.mockResolvedValue(true);
		render(<AttachPicker />);

		fireEvent.click(await screen.findByRole('button', { name: /Test tổng quan/ }));
		await waitFor(() => expect(mocks.setPicker).toHaveBeenCalledWith(null));
	});

	it('shows the destination breadcrumb for the current target', async () => {
		mocks.picker = { kind: 'test', lessonId: 'l1', sectionId: 's1', scope: 'SECTION' };
		render(<AttachPicker />);
		expect(await screen.findByTestId('attach-picker-target')).toHaveTextContent(
			'Gắn vào: Bài 03 · Chủ đề 3.2',
		);
	});

	it('disables tests with no questions', async () => {
		vi.mocked(myClassList).mockResolvedValue([
			{
				id: 'empty-1',
				title: 'Bài trống',
				slug: 'bai-trong',
				_count: { questions: 0 },
			},
		]);
		render(<AttachPicker />);
		expect(await screen.findByRole('button', { name: /Bài trống/ })).toBeDisabled();
		expect(screen.getByText('Chưa có câu hỏi')).toBeVisible();
	});

	it('disables tests already attached at this target', async () => {
		vi.mocked(myClassList).mockResolvedValue([
			{
				id: 'test-1',
				title: 'Đã gắn',
				slug: 'da-gan',
				_count: { questions: 4 },
				placements: [{ scope: 'COURSE', course: { id: 'course-1' } }],
			},
		]);
		render(<AttachPicker />);
		expect(await screen.findByRole('button', { name: /Đã gắn/ })).toBeDisabled();
		expect(screen.getByText('Đã gắn ở đây')).toBeVisible();
	});

	it('debounces search requests', async () => {
		render(<AttachPicker />);
		await waitFor(() => expect(myClassList).toHaveBeenCalledTimes(1));

		fireEvent.change(screen.getByPlaceholderText('Tìm theo tên…'), { target: { value: 'hrm' } });
		fireEvent.change(screen.getByPlaceholderText('Tìm theo tên…'), {
			target: { value: 'hrm quiz' },
		});
		expect(myClassList).toHaveBeenCalledTimes(1);

		await waitFor(() => expect(myClassList).toHaveBeenCalledTimes(2));
		expect(String(vi.mocked(myClassList).mock.calls.at(-1)?.[0])).toContain('q=hrm');
	});
});

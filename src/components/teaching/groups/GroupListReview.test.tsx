import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeachingGroupBoard } from '@/features/teaching/types';
import { teachingApi } from '@/components/teaching/admin/api';
import { GroupListWorkspace } from './GroupListWorkspace';

vi.mock('@/components/teaching/admin/api', () => ({ teachingApi: vi.fn() }));
const tutorials = [
	{
		id: 't1',
		code: '01',
		name: 'Tutorial 1',
		classId: 'c1',
		displayOrder: 0,
		room: '',
		scheduleNote: '',
		studentCount: 2,
	},
];
const initial: TeachingGroupBoard = {
	classId: 'c1',
	tutorialClassId: 't1',
	tutorialCode: '01',
	tutorialName: 'Tutorial 1',
	groupCount: 1,
	defaultGroupSize: 3,
	version: 1,
	configured: true,
	activeStudentCount: 2,
	assignedCount: 2,
	unassigned: [],
	groups: [
		{
			id: 'g1',
			displayOrder: 0,
			maxSize: null,
			effectiveMaxSize: 3,
			assignments: ['An', 'Binh'].map((givenName, i) => ({
				enrollmentId: `e${i}`,
				groupId: 'g1',
				groupOrder: 0,
				memberOrder: i,
				studentCode: `230000000${i}`,
				familyName: 'Test',
				givenName,
				learningExperience: 'SUPPORT',
			})),
		},
	],
};
beforeEach(() => vi.resetAllMocks());

describe('Group list review regressions', () => {
	it('opens settings with the current saved values', () => {
		render(<GroupListWorkspace classId="c1" tutorials={tutorials} initial={initial} admin />);
		fireEvent.click(screen.getByRole('button', { name: 'Thiết lập nhóm' }));
		expect(screen.getByLabelText('Số nhóm')).toHaveValue(1);
		expect(screen.getByLabelText('Sức chứa mặc định mỗi nhóm')).toHaveValue(3);
	});
	it('keeps the actual group size when search matches only one member', () => {
		render(<GroupListWorkspace classId="c1" tutorials={tutorials} initial={initial} admin />);
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Binh' } });
		expect(screen.getByRole('heading', { name: 'Nhóm 1 · 2/3 sinh viên' })).toBeInTheDocument();
	});
	it('loads a selected tutorial only once', async () => {
		vi.mocked(teachingApi).mockResolvedValue(initial);
		render(<GroupListWorkspace classId="c1" tutorials={tutorials} admin />);
		await screen.findByText('Nhóm 1 · 2/3 sinh viên');
		await waitFor(() => expect(teachingApi).toHaveBeenCalledTimes(1));
	});
});

describe('Group request lifecycle', () => {
	it('ignores an earlier tutorial response after switching tutorials', async () => {
		let resolveFirst!: (value: TeachingGroupBoard) => void;
		const first = new Promise<TeachingGroupBoard>((resolve) => {
			resolveFirst = resolve;
		});
		const second = {
			...initial,
			tutorialClassId: 't2',
			tutorialCode: '02',
			groups: [],
			assignedCount: 0,
		};
		vi.mocked(teachingApi).mockImplementation((url) =>
			url.includes('t1') ? first : Promise.resolve(second),
		);
		render(
			<GroupListWorkspace
				classId="c1"
				tutorials={[...tutorials, { ...tutorials[0], id: 't2', code: '02' }]}
				admin
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: /Tutorial Class/ }));
		fireEvent.click(screen.getByRole('option', { name: /^01 ·/ }));
		await waitFor(() => expect(teachingApi).toHaveBeenCalledTimes(1));
		fireEvent.click(screen.getByRole('button', { name: /Tutorial Class/ }));
		fireEvent.click(screen.getByRole('option', { name: /^02 ·/ }));
		await screen.findByText(/DANH SÁCH PHÂN CHIA NHÓM — TUTORIAL 02/);
		await act(async () => resolveFirst(initial));
		await waitFor(() => expect(screen.queryByText('Test Binh')).not.toBeInTheDocument());
	});

	it('requires a new preview after codes change while the earlier request is pending', async () => {
		let resolvePreview!: (value: unknown) => void;
		vi.mocked(teachingApi).mockReturnValue(
			new Promise((resolve) => {
				resolvePreview = resolve;
			}),
		);
		render(<GroupListWorkspace classId="c1" tutorials={tutorials} initial={initial} admin />);
		fireEvent.click(screen.getByRole('button', { name: 'Thêm sinh viên' }));
		const input = screen.getByRole('textbox', { name: /Mã sinh viên/ });
		fireEvent.change(input, { target: { value: '2300000003' } });
		fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra mã' }));
		fireEvent.change(input, { target: { value: '2300000004' } });
		await act(async () =>
			resolvePreview({
				resolved: [
					{ enrollmentId: 'e3', studentCode: '2300000003', familyName: 'Test', givenName: 'Old' },
				],
				errors: [],
				remaining: 1,
				capacity: 3,
				currentCount: 2,
			}),
		);
		await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu' })).toBeDisabled());
		expect(screen.queryByText(/Test Old/)).not.toBeInTheDocument();
	});
});

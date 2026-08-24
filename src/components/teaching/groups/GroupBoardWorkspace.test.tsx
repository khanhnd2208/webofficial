import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TeachingGroupBoard } from '@/features/teaching/types';

import { GroupBoardWorkspace } from './GroupBoardWorkspace';

function board(
	overrides: Partial<
		TeachingGroupBoard & { viewerEnrollmentId?: string | null; undoAvailableCount?: number }
	> = {},
) {
	return {
		classId: 'class-1',
		groupCount: 1,
		groupSize: 3,
		isOpen: true,
		version: 4,
		claimEpoch: 1,
		configured: true,
		activeStudentCount: 3,
		undoAvailableCount: 0,
		groups: [
			{
				id: 'group-1',
				displayOrder: 0,
				assignments: [
					{
						enrollmentId: 'leader',
						groupId: 'group-1',
						groupOrder: 0,
						slotIndex: 0,
						role: 'LEADER' as const,
						studentCode: 'SV01',
						familyName: 'Nguyễn',
						givenName: 'Leader',
					},
					{
						enrollmentId: 'member',
						groupId: 'group-1',
						groupOrder: 0,
						slotIndex: 1,
						role: 'MEMBER' as const,
						studentCode: 'SV02',
						familyName: 'Trần',
						givenName: 'Member',
					},
				],
			},
		],
		unassigned: [
			{ enrollmentId: 'free', studentCode: 'SV03', familyName: 'Lê', givenName: 'Free' },
		],
		...overrides,
	};
}

function ok(data: unknown) {
	return Promise.resolve({ json: () => Promise.resolve({ ok: true, data }) }) as Promise<Response>;
}

afterEach(() => vi.unstubAllGlobals());

describe('GroupBoardWorkspace', () => {
	it('allows an admin to choose an assigned student and place them into an empty slot', async () => {
		const initial = board();
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => ok(initial));
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		fireEvent.click(screen.getByRole('button', { name: /trần member · sv02/i }));
		fireEvent.click(screen.getByText('Chọn vị trí'));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'/api/admin/teaching/classes/class-1/groups/assignments',
		);
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			enrollmentId: 'member',
			groupId: 'group-1',
			slotIndex: 2,
			expectedVersion: 4,
		});
	});

	it('lets a selected student use tap-to-place only for their own assigned card', async () => {
		const initial = board({ viewerEnrollmentId: 'member' });
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => ok({ ...initial, version: 5 }));
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByText('Chọn vị trí'));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/teaching/classes/hrm-01/groups/move');
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			groupId: 'group-1',
			slotIndex: 2,
		});
	});

	it('lets a keyboard user focus an empty slot and place the selected student with Enter', async () => {
		const initial = board({ viewerEnrollmentId: 'member' });
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
			ok({ ...initial, version: 5 }),
		);
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		const emptySlot = screen.getByRole('button', { name: /tv 2 · trống/i });
		emptySlot.focus();
		expect(emptySlot).toHaveFocus();
		fireEvent.keyDown(emptySlot, { key: 'Enter' });

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/teaching/classes/hrm-01/groups/move');
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			groupId: 'group-1',
			slotIndex: 2,
		});
	});

	it('lets a guest select a roster name without entering a student code', async () => {
		const initial = board({ viewerEnrollmentId: null });
		const claimed = { ...initial, viewerEnrollmentId: 'member' };
		const fetchMock = vi.fn((...args: Parameters<typeof fetch>) =>
			ok(String(args[0]).endsWith('/claim') ? claimed : claimed),
		);
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: /trần member · sv02/i }));

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/teaching/classes/hrm-01/groups/claim',
				expect.objectContaining({ method: 'POST' }),
			),
		);
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
			enrollmentId: 'member',
		});
		expect(screen.queryByLabelText('Mã sinh viên')).not.toBeInTheDocument();
	});

	it('makes every student card directly draggable on an open desktop board before a name is selected', async () => {
		const initial = board({ viewerEnrollmentId: null });
		vi.stubGlobal(
			'fetch',
			vi.fn((..._args: Parameters<typeof fetch>) => ok(initial)),
		);
		const { container } = render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		await waitFor(() =>
			expect(container.querySelectorAll('[data-draggable="true"]')).toHaveLength(3),
		);
		expect(container.querySelector('[data-student-name="Lê Free"]')).toHaveAttribute(
			'data-draggable',
			'true',
		);
	});

	it('uses a small dot instead of the animated learning-experience badge in group cards', () => {
		const initial = board({
			unassigned: [
				{
					enrollmentId: 'free',
					studentCode: 'SV03',
					familyName: 'Lê',
					givenName: 'Free',
					learningExperience: 'CHALLENGE',
				},
				{
					enrollmentId: 'support',
					studentCode: 'SV04',
					familyName: 'Phạm',
					givenName: 'Support',
					learningExperience: 'SUPPORT',
				},
			],
		});
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		expect(
			container.querySelector('.group-learning-choice-dot[data-tone="challenge"]'),
		).toBeInTheDocument();
		expect(
			container.querySelector('.group-learning-choice-dot[data-tone="support"]'),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /lê free · sv03 · challenge/i })).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /phạm support · sv04 · royal support/i }),
		).toBeInTheDocument();
		expect(container.querySelector('.group-student-card .lx-mark')).not.toBeInTheDocument();
	});

	it('switches the active student without an identity prompt', async () => {
		const initial = board({ viewerEnrollmentId: 'leader' });
		const switched = { ...initial, viewerEnrollmentId: 'member' };
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => ok(switched));
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: /trần member · sv02/i }));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
			enrollmentId: 'member',
		});
		expect(screen.queryByRole('dialog', { name: /xác minh tên của bạn/i })).not.toBeInTheDocument();
	});

	it('keeps the public board read-only when locked', () => {
		const initial = board({ isOpen: false, viewerEnrollmentId: 'member' });
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => ok(initial));
		vi.stubGlobal('fetch', fetchMock);
		const { container } = render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: /trần member · sv02/i }));
		expect(fetchMock).not.toHaveBeenCalled();
		expect(container.querySelectorAll('[data-draggable="true"]')).toHaveLength(0);
		expect(screen.getAllByText(/bảng đang khóa/i).length).toBeGreaterThan(0);
	});

	it('renders an optimistic move immediately and clears its pending state after the server confirms', async () => {
		const initial = board({ viewerEnrollmentId: 'member' });
		const confirmed = {
			...initial,
			version: 5,
			groups: [
				{
					...initial.groups[0]!,
					assignments: [
						initial.groups[0]!.assignments[0]!,
						{ ...initial.groups[0]!.assignments[1]!, slotIndex: 2 },
					],
				},
			],
		};
		let resolveRequest!: (response: Response) => void;
		const request = new Promise<Response>((resolve) => {
			resolveRequest = resolve;
		});
		vi.stubGlobal(
			'fetch',
			vi.fn(() => request),
		);
		const { container } = render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: /tv 2 · trống/i }));
		await waitFor(() => expect(screen.getByLabelText(/tv 2 · trần member/i)).toBeInTheDocument());
		expect(container.querySelector('[data-student-name="Trần Member"]')).toHaveClass(
			'group-student-card-pending',
		);

		resolveRequest(await ok(confirmed));
		await waitFor(() =>
			expect(container.querySelector('.group-student-card-pending')).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText(/tv 2 · trần member/i)).toBeInTheDocument();
	});

	it('rolls an optimistic move back and refreshes when the server rejects the target', async () => {
		const initial = board({ viewerEnrollmentId: 'member' });
		let rejectMove!: (response: Response) => void;
		const rejectedMove = new Promise<Response>((resolve) => {
			rejectMove = resolve;
		});
		const fetchMock = vi
			.fn()
			.mockImplementationOnce(() => rejectedMove)
			.mockImplementationOnce(() => ok(initial));
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: /tv 2 · trống/i }));
		await waitFor(() => expect(screen.getByLabelText(/tv 2 · trần member/i)).toBeInTheDocument());
		rejectMove({
			json: () => Promise.resolve({ ok: false, error: 'Ô này vừa được người khác chọn.' }),
		} as Response);

		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent('Ô này vừa được người khác chọn.'),
		);
		expect(screen.getByLabelText(/tv 1 · trần member/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /tv 2 · trống/i })).toBeInTheDocument();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('filters and jumps between compact groups without changing assignments', () => {
		const initial = board({
			groupCount: 3,
			groups: [
				board().groups[0]!,
				{ id: 'group-2', displayOrder: 1, assignments: [] },
				{
					id: 'group-3',
					displayOrder: 2,
					assignments: [
						{ ...board().groups[0]!.assignments[0]!, enrollmentId: 'leader-3', groupId: 'group-3' },
					],
				},
			],
		});
		vi.stubGlobal(
			'fetch',
			vi.fn((..._args: Parameters<typeof fetch>) => ok(initial)),
		);
		render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		expect(screen.getAllByRole('region', { name: /bảng các nhóm/i })).toHaveLength(1);
		fireEvent.change(screen.getByLabelText('Lọc nhóm'), { target: { value: 'available' } });
		expect(screen.getByLabelText('Nhóm 2')).toBeInTheDocument();
		expect(screen.getByLabelText('Nhóm 3')).toBeInTheDocument();
		expect(screen.getByLabelText('Nhóm 1')).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Tìm nhóm'), { target: { value: 'nhóm 2' } });
		expect(screen.getByLabelText('Nhóm 2')).toBeInTheDocument();
		expect(screen.queryByLabelText('Nhóm 3')).not.toBeInTheDocument();
		expect(screen.getByTestId('group-grid')).toBeInTheDocument();
	});

	it('shows group jump details and supports server-backed undo for the current name', async () => {
		const initial = board({ viewerEnrollmentId: 'member', undoAvailableCount: 3 });
		const afterUndo = { ...initial, undoAvailableCount: 2 };
		const fetchMock = vi.fn((...args: Parameters<typeof fetch>) =>
			ok(String(args[0]).endsWith('/undo') ? afterUndo : initial),
		);
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: 'Đi tới nhóm' }));
		expect(screen.getByRole('option', { name: /Nhóm 1/i })).toHaveTextContent('2/3 người');
		expect(screen.getByRole('option', { name: /Nhóm 1/i })).toHaveTextContent(
			'Trưởng nhóm: Nguyễn Leader',
		);
		fireEvent.click(screen.getByRole('button', { name: /Hoàn tác/ }));

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/teaching/classes/hrm-01/groups/undo',
				expect.objectContaining({ method: 'POST' }),
			),
		);
		expect(screen.getByRole('button', { name: /Hoàn tác/ })).toHaveTextContent('2');
	});

	it('keeps long Vietnamese names visible and marks the leader slot distinctly', () => {
		const longName = 'Nguyễn Thị Bích Ngọc Phương Anh';
		const initial = board({
			groups: [
				{
					...board().groups[0]!,
					assignments: [
						{
							...board().groups[0]!.assignments[0]!,
							familyName: 'Nguyễn Thị Bích Ngọc',
							givenName: 'Phương Anh',
						},
						board().groups[0]!.assignments[1]!,
					],
				},
			],
		});
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		const name = container.querySelector(`[data-student-name="${longName}"]`);
		expect(name).toBeInTheDocument();
		expect(name).not.toHaveClass('truncate');
		expect(container.querySelector('.group-slot[data-slot-role="leader"]')).toHaveClass(
			'group-slot-leader',
		);
		expect(
			container.querySelector('.group-slot[data-slot-role="leader"] .group-student-name'),
		).toHaveTextContent(longName);
	});

	it('opens one mobile group at a time', () => {
		const initial = board({
			groupCount: 2,
			groups: [board().groups[0]!, { id: 'group-2', displayOrder: 1, assignments: [] }],
		});
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		fireEvent.click(screen.getByRole('button', { name: 'Mở Nhóm 2' }));
		expect(container.querySelector('[aria-label="Nhóm 1"]')).toHaveAttribute(
			'data-mobile-open',
			'false',
		);
		expect(container.querySelector('[aria-label="Nhóm 2"]')).toHaveAttribute(
			'data-mobile-open',
			'true',
		);
	});

	it('keeps the leader name in the group header when the group is collapsed', () => {
		const initial = board();
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		fireEvent.click(screen.getByRole('button', { name: 'Thu gọn Nhóm 1' }));
		const group = container.querySelector('[aria-label="Nhóm 1"]');
		expect(group).toHaveAttribute('data-mobile-open', 'false');
		expect(group?.querySelector('.group-card-leader')).toHaveTextContent(
			'Trưởng nhómNguyễn Leader',
		);
	});

	it('shows a clear placeholder in the header when a group has no leader', () => {
		const initial = board({ groups: [{ ...board().groups[0]!, assignments: [] }] });
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		const leaderSummary = container.querySelector('[aria-label="Nhóm 1"] .group-card-leader');
		expect(leaderSummary).toHaveAttribute('data-missing', 'true');
		expect(leaderSummary).toHaveTextContent('Trưởng nhómChưa có');
	});

	it('marks leader, filled member and empty member slots with distinct visual states', () => {
		const initial = board();
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		expect(container.querySelector('.group-slot[data-slot-role="leader"]')).toHaveAttribute(
			'data-slot-state',
			'filled',
		);
		expect(container.querySelector('.group-slot[data-slot-role="leader"]')).toHaveClass(
			'group-slot-leader',
			'group-slot-filled',
		);
		expect(
			container.querySelector('.group-slot[data-slot-role="member"][data-slot-state="filled"]'),
		).toHaveClass('group-slot-filled');
		expect(
			container.querySelector('.group-slot[data-slot-role="member"][data-slot-state="empty"]'),
		).toHaveClass('group-slot-empty-state');
		expect(container.querySelector('.group-card-leader strong')).toHaveTextContent('Nguyễn Leader');
	});

	it('keeps admin bulk controls out of the mobile interface while retaining group editing', async () => {
		vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
			matches: query === '(max-width: 767px)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
		const initial = board();
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => ok(initial));
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		await waitFor(() =>
			expect(screen.queryByTestId('group-admin-desktop-controls')).not.toBeInTheDocument(),
		);
		expect(screen.queryByRole('button', { name: /đổi tên/i })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /xóa trần member khỏi nhóm/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /xếp ngẫu nhiên/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /xóa hết/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /mở bảng|khóa bảng/i })).not.toBeInTheDocument();
		vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	it('keeps a large board compact and gives both panes their own scroll target', () => {
		const initial = board({
			groupCount: 20,
			groupSize: 5,
			activeStudentCount: 20,
			unassigned: Array.from({ length: 20 }, (_, index) => ({
				enrollmentId: `free-${index}`,
				studentCode: `SV${index + 10}`,
				familyName: 'Lê',
				givenName: `Free ${index}`,
			})),
			groups: Array.from({ length: 20 }, (_, index) => ({
				id: `group-${index + 1}`,
				displayOrder: index,
				assignments: [],
			})),
		});
		vi.stubGlobal(
			'fetch',
			vi.fn((..._args: Parameters<typeof fetch>) => ok(initial)),
		);
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		expect(container.querySelectorAll('.group-card-shell')).toHaveLength(20);
		expect(container.querySelectorAll('.group-slot')).toHaveLength(100);
		expect(container.querySelector('.group-grid-scroll')).toHaveAttribute(
			'data-group-scroll',
			'true',
		);
		expect(container.querySelector('.group-unassigned-scroll')).toHaveAttribute(
			'data-group-scroll',
			'true',
		);
	});

	it('opens the mobile picker from an empty slot and places the chosen student into that slot', async () => {
		vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
			matches: query === '(max-width: 767px)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
		const initial = board();
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => ok(initial));
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		fireEvent.click(screen.getByRole('button', { name: /tv 2 · trống/i }));
		await waitFor(() =>
			expect(
				screen.getByRole('dialog', { name: /chọn sinh viên · nhóm 1 · tv 2/i }),
			).toBeInTheDocument(),
		);
		const freeCards = screen.getAllByRole('button', { name: /lê free · sv03/i });
		fireEvent.click(freeCards[freeCards.length - 1]!);

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/admin/teaching/classes/class-1/groups/assignments',
				expect.objectContaining({ method: 'PUT' }),
			),
		);
		expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toMatchObject({
			enrollmentId: 'free',
			groupId: 'group-1',
			slotIndex: 2,
		});
	});

	it('does not expose drag gestures on mobile while retaining tap-to-place', async () => {
		vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
			matches: query === '(max-width: 767px)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
		const initial = board();
		vi.stubGlobal(
			'fetch',
			vi.fn((..._args: Parameters<typeof fetch>) => ok(initial)),
		);
		const { container } = render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		await waitFor(() =>
			expect(container.querySelectorAll('[data-draggable="true"]')).toHaveLength(0),
		);
		expect(screen.getByRole('button', { name: /tv 2 · trống/i })).toBeInTheDocument();
		vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	it('keeps the mobile target while selecting another student, then moves that student', async () => {
		vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
			matches: query === '(max-width: 767px)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
		const initial = board({ viewerEnrollmentId: 'leader' });
		const claimed = { ...initial, viewerEnrollmentId: 'member' };
		const fetchMock = vi.fn((...args: Parameters<typeof fetch>) => {
			const url = String(args[0]);
			if (url.endsWith('/claim')) return ok(claimed);
			if (url.endsWith('/move')) return ok(claimed);
			return ok(fetchMock.mock.calls.length > 1 ? claimed : initial);
		});
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: /tv 2 · trống/i }));
		await waitFor(() =>
			expect(
				screen.getByRole('dialog', { name: /chọn sinh viên · nhóm 1 · tv 2/i }),
			).toBeInTheDocument(),
		);
		const memberCards = screen.getAllByRole('button', { name: /trần member · sv02/i });
		fireEvent.click(memberCards[memberCards.length - 1]!);

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/teaching/classes/hrm-01/groups/move',
				expect.objectContaining({ method: 'POST' }),
			),
		);
		expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toMatchObject({
			groupId: 'group-1',
			slotIndex: 2,
		});
	});

	it('selects another student without a code before asking to remove them', async () => {
		const initial = board({ viewerEnrollmentId: 'leader' });
		const claimed = { ...initial, viewerEnrollmentId: 'member' };
		const fetchMock = vi.fn((...args: Parameters<typeof fetch>) =>
			ok(String(args[0]).endsWith('/claim') ? claimed : initial),
		);
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace slug="hrm-01" initial={initial} />);

		fireEvent.click(screen.getByRole('button', { name: /xóa trần member khỏi nhóm/i }));

		await waitFor(() =>
			expect(screen.getByRole('dialog', { name: /xóa sinh viên khỏi nhóm/i })).toBeInTheDocument(),
		);
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
			enrollmentId: 'member',
		});
		expect(screen.queryByLabelText('Mã sinh viên')).not.toBeInTheDocument();
	});

	it('confirms removing a student from a group with the destructive x action', async () => {
		const initial = board();
		const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => ok(initial));
		vi.stubGlobal('fetch', fetchMock);
		render(<GroupBoardWorkspace classId="class-1" initial={initial} admin />);

		fireEvent.click(screen.getByRole('button', { name: /xóa trần member khỏi nhóm/i }));
		await waitFor(() =>
			expect(screen.getByRole('dialog', { name: /xóa sinh viên khỏi nhóm/i })).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole('button', { name: /xóa khỏi nhóm/i }));

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/admin/teaching/classes/class-1/groups/assignments',
				expect.objectContaining({ method: 'PUT' }),
			),
		);
		expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toMatchObject({
			enrollmentId: 'member',
			groupId: null,
		});
	});
});

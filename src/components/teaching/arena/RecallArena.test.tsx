import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaData, RecallArenaPlayer } from '@/features/teaching/types';

import { RecallArena } from './RecallArena';

vi.mock('@/components/teaching/admin/api', () => ({ teachingApi: vi.fn() }));
vi.mock('@/components/motion', () => ({
	useMotionTier: () => ({
		tier: 'reduced',
		reduced: true,
		allowsAmbient: false,
		allowsReveal: false,
	}),
}));

const apiMock = vi.mocked(teachingApi);

function player(
	id: string,
	givenName: string,
	group: RecallArenaPlayer['group'],
	status: 'PRESENT' | 'ABSENT_UNEXCUSED',
): RecallArenaPlayer {
	return {
		enrollmentId: id,
		tutorialClassId: 't1',
		enrolledFromWeek: 1,
		studentCode: `SV-${id}`,
		familyName: 'Nguyễn',
		givenName,
		group,
		attendance: { s1: status },
		cp: {},
	};
}

function arenaData(overrides: Partial<RecallArenaData['sessions'][number]> = {}): RecallArenaData {
	return {
		class: { id: 'c1', courseCode: 'HRM', courseName: 'Quản trị nhân sự', classCode: 'M1' },
		tutorials: [{ id: 't1', code: 'T1', name: 'Tutorial 1' }],
		sessions: [
			{
				id: 's1',
				classId: 'c1',
				tutorialClassId: 't1',
				weekNumber: 3,
				heldOn: '2026-11-10',
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: '2026-11-10T01:00:00.000Z',
				attendanceOpen: false,
				participationTakenAt: null,
				participationOpen: true,
				...overrides,
			},
		],
		defaultSessionId: 's1',
		players: [
			player('a', 'An', 'CHALLENGE', 'PRESENT'),
			player('b', 'Bình', 'SUPPORT', 'PRESENT'),
			player('c', 'Chi', 'CHALLENGE', 'ABSENT_UNEXCUSED'),
		],
		decks: [{ deckId: 'd1', title: 'Motivation', lessonLabel: 'Bài 3', cardCount: 1 }],
		cards: [
			{
				id: 'card-1',
				deckId: 'd1',
				question: '<p>What is motivation?</p>',
				answer: '<p>The drive to act.</p>',
				questionVi: '',
				answerVi: '',
			},
		],
	};
}

describe('RecallArena', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
	});

	it('puts only students who are in the room on the floor, without group labels', () => {
		render(<RecallArena data={arenaData()} />);
		const setup = screen.getByRole('dialog', { name: 'Thiết lập kiểm tra bài cũ' });
		expect(within(setup).getByText('2 bạn có mặt')).toBeTruthy();

		fireEvent.click(within(setup).getByRole('button', { name: 'Vào trận' }));

		const names = screen.getAllByTestId('arena-player').map((node) => node.textContent);
		expect(names).toEqual(['An', 'Bình']);
		expect(screen.queryByText(/Challenging|Supporting/)).toBeNull();
	});

	it('catches only the chosen group and saves the CP award', async () => {
		apiMock.mockResolvedValue({
			enrollmentId: 'a',
			sessionId: 's1',
			previous: 0,
			points: 1,
			changed: true,
		});
		render(<RecallArena data={arenaData()} />);
		fireEvent.change(screen.getByDisplayValue('Cả lớp (2)'), { target: { value: 'CHALLENGE' } });
		fireEvent.click(screen.getByRole('button', { name: 'Vào trận' }));

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));

		const caught = await screen.findByRole('dialog', { name: 'Nguyễn An' });
		expect(within(caught).getByText('What is motivation?')).toBeTruthy();
		fireEvent.click(within(caught).getByRole('button', { name: /Hiện đáp án/ }));
		expect(within(caught).getByText('The drive to act.')).toBeTruthy();

		fireEvent.click(within(caught).getByRole('button', { name: /Đạt \+1/ }));

		await waitFor(() =>
			expect(apiMock).toHaveBeenCalledWith('/api/admin/teaching/sessions/s1/recall-arena', {
				method: 'POST',
				body: JSON.stringify({ enrollmentId: 'a', points: 1 }),
			}),
		);
		expect(await screen.findByText('An: CP 0 → 1')).toBeTruthy();
		expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy();
	});

	it('closes a catch with X or Esc without grading, and the student keeps their turn', async () => {
		render(<RecallArena data={arenaData()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Vào trận' }));

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const first = await screen.findByRole('dialog', { name: /Nguyễn/ });
		const firstName = within(first).getByRole('heading').textContent;
		fireEvent.click(within(first).getByRole('button', { name: 'Đóng, không chấm' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(screen.getByRole('button', { name: 'Đã gọi 0' })).toBeTruthy();

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const second = await screen.findByRole('dialog', { name: /Nguyễn/ });
		expect(within(second).getByRole('heading').textContent).not.toBe(firstName);
		fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
	});

	it('lets a missed answer heal the monster without saving CP', async () => {
		render(<RecallArena data={arenaData()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Vào trận' }));
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });

		fireEvent.click(within(caught).getByRole('button', { name: /Chưa đạt/ }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
	});

	it('offers to open CP grading when the week is locked', async () => {
		const opened = arenaData().sessions[0]!;
		apiMock.mockResolvedValue({
			session: { ...opened, participationOpen: true },
			students: [],
			stats: {},
		});
		render(<RecallArena data={arenaData({ participationOpen: false })} />);

		fireEvent.click(screen.getByRole('button', { name: 'Mở chấm CP tuần 3' }));

		await waitFor(() =>
			expect(apiMock).toHaveBeenCalledWith('/api/admin/teaching/sessions/s1/participation/lock', {
				method: 'PATCH',
				body: JSON.stringify({ action: 'open' }),
			}),
		);
		expect(await screen.findByText(/CP tuần 3 đang mở/)).toBeTruthy();
	});
});

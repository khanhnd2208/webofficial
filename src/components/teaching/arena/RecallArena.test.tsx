import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaData, RecallArenaPlayer } from '@/features/teaching/types';

import { RecallArena } from './RecallArena';
import { ARENA_CHARACTERS } from './arenaCharacters';

vi.mock('@/components/teaching/admin/api', () => ({ teachingApi: vi.fn() }));
vi.mock('canvas-confetti', () => ({ default: { create: () => vi.fn() } }));
const motion = vi.hoisted(() => ({ reduced: true }));
vi.mock('@/components/motion', () => ({
	useMotionTier: () => ({
		tier: motion.reduced ? 'reduced' : 'full',
		reduced: motion.reduced,
		allowsAmbient: false,
		allowsReveal: false,
	}),
}));

const apiMock = vi.mocked(teachingApi);

function player(
	id: string,
	givenName: string,
	group: RecallArenaPlayer['group'],
	status: 'PRESENT' | 'ABSENT_UNEXCUSED' | null,
	classId = 'c1',
): RecallArenaPlayer {
	const sessionId = classId === 'c1' ? 's1' : 's2';
	return {
		enrollmentId: id,
		classId,
		tutorialClassId: classId === 'c1' ? 't1' : 't2',
		enrolledFromWeek: 1,
		studentCode: `SV-${id}`,
		familyName: 'Nguyễn',
		givenName,
		group,
		attendance: status ? { [sessionId]: status } : {},
		cp: {},
	};
}

type SessionRecord = RecallArenaData['classes'][number]['sessions'][number];

function session(id: string, classId: string, heldOn: string, extra: Partial<SessionRecord> = {}) {
	return {
		id,
		classId,
		tutorialClassId: classId === 'c1' ? 't1' : 't2',
		weekNumber: 3,
		heldOn,
		topic: '',
		method: 'ROLL_CALL',
		isCancelled: false,
		attendanceTakenAt: '2026-11-10T01:00:00.000Z',
		attendanceOpen: false,
		participationTakenAt: null,
		participationOpen: true,
		...extra,
	} satisfies SessionRecord;
}

function card(id: string, deckId: string, question: string) {
	return { id, deckId, question, answer: '<p>The drive to act.</p>', questionVi: '', answerVi: '' };
}

function arenaData(overrides: Partial<SessionRecord> = {}): RecallArenaData {
	return {
		course: { id: 'course-1', courseCode: 'HRM', courseName: 'Quản trị nhân sự' },
		todayIso: '2026-11-10',
		classes: [
			{
				id: 'c1',
				classCode: 'M1',
				term: 'HK1',
				tutorials: [{ id: 't1', code: 'T1', name: 'Tutorial 1' }],
				sessions: [session('s1', 'c1', '2026-11-10', overrides)],
				defaultSessionId: 's1',
				enabledDeckIds: ['d1'],
			},
			{
				id: 'c2',
				classCode: 'M2',
				term: 'HK1',
				tutorials: [{ id: 't2', code: 'T1', name: 'Tutorial 1' }],
				sessions: [session('s2', 'c2', '2026-11-09')],
				defaultSessionId: 's2',
				enabledDeckIds: [],
			},
		],
		players: [
			player('a', 'An', 'CHALLENGE', 'PRESENT'),
			player('b', 'Bình', 'SUPPORT', 'PRESENT'),
			player('c', 'Chi', 'CHALLENGE', 'ABSENT_UNEXCUSED'),
			player('d', 'Dũng', null, null, 'c2'),
		],
		decks: [
			{
				deckId: 'd1',
				title: 'Motivation',
				lessonLabel: 'Bài 3',
				status: 'PUBLISHED',
				cardCount: 1,
			},
			{ deckId: 'd2', title: 'Job design', lessonLabel: 'Bài 4', status: 'DRAFT', cardCount: 1 },
		],
		cards: [
			card('card-1', 'd1', '<p>What is motivation?</p>'),
			card('card-2', 'd2', '<p>What is job enrichment?</p>'),
		],
	};
}

function setupDialog() {
	return screen.getByRole('dialog', { name: 'Thiết lập kiểm tra bài cũ' });
}

function openStep(label: string) {
	fireEvent.click(within(setupDialog()).getByRole('button', { name: new RegExp(label) }));
}

/** Walk the remaining steps in order, as the lecturer does before the first game. */
function enterGame() {
	const setup = setupDialog();
	let next = within(setup).queryByRole('button', { name: 'Tiếp' });
	while (next) {
		fireEvent.click(next);
		next = within(setup).queryByRole('button', { name: 'Tiếp' });
	}
	fireEvent.click(within(setup).getByRole('button', { name: 'Vào trận' }));
}

describe('RecallArena', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		motion.reduced = true;
		window.localStorage.clear();
	});

	it('starts with today’s class ticked and puts only students in the room on the floor', () => {
		render(<RecallArena data={arenaData()} />);
		const setup = setupDialog();
		expect(within(setup).getByRole('checkbox', { name: /Lớp M1/ })).toHaveProperty('checked', true);
		expect(within(setup).getByRole('checkbox', { name: /Lớp M2/ })).toHaveProperty(
			'checked',
			false,
		);
		expect(within(setup).getByText('2 bạn có mặt')).toBeTruthy();

		enterGame();

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
		openStep('Người chơi');
		fireEvent.change(screen.getByDisplayValue('Cả lớp (2)'), { target: { value: 'CHALLENGE' } });
		enterGame();

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

	it('lets the student attack before the monster loses health with full motion', async () => {
		motion.reduced = false;
		apiMock.mockResolvedValue({
			enrollmentId: 'a',
			sessionId: 's1',
			previous: 0,
			points: 1,
			changed: true,
		});
		render(<RecallArena data={arenaData()} />);
		openStep('Người chơi');
		fireEvent.change(screen.getByDisplayValue('Cả lớp (2)'), { target: { value: 'CHALLENGE' } });
		enterGame();

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn An' }, { timeout: 5000 });
		fireEvent.click(within(caught).getByRole('button', { name: /Đạt \+1/ }));

		await screen.findByText('An: CP 0 → 1');
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
		expect(
			screen.getAllByTestId('arena-player').find((node) => node.textContent === 'An')?.dataset
				.attacking,
		).toBe('true');
		expect(screen.getByRole('button', { name: /Bắt!/ })).toHaveProperty('disabled', true);

		await waitFor(() => expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy(), {
			timeout: 2200,
		});
	}, 10_000);

	it('enters the game from the first step and lets the lecturer pick heroes and the boss', () => {
		render(<RecallArena data={arenaData()} />);
		const setup = setupDialog();
		openStep('Nhân vật');
		const heroCount = ARENA_CHARACTERS.length;
		expect(
			within(setup).getByText(`Nhân vật của sinh viên · ${heroCount}/${heroCount}`),
		).toBeTruthy();
		fireEvent.click(within(setup).getByRole('checkbox', { name: 'Ông Nồi' }));
		expect(
			within(setup).getByText(`Nhân vật của sinh viên · ${heroCount - 1}/${heroCount}`),
		).toBeTruthy();
		fireEvent.click(within(setup).getByRole('button', { name: 'Ma Vương Deadline' }));
		openStep('Lớp học');
		fireEvent.click(within(setup).getByRole('button', { name: 'Vào trận' }));

		expect(screen.queryByRole('dialog', { name: 'Thiết lập kiểm tra bài cũ' })).toBeNull();
		expect(screen.getByText('Boss 1 · Ma Vương Deadline')).toBeTruthy();
		expect(document.querySelector('[data-character="ong-noi"]')).toBeNull();
		const saved = JSON.parse(window.localStorage.getItem('recall-arena:v2:config:course-1')!);
		expect(saved).toMatchObject({ bossId: 'deadline' });
		expect(saved.heroIds).toHaveLength(heroCount - 1);
	});

	it('closes a catch with X or Esc without grading, and the student keeps their turn', async () => {
		render(<RecallArena data={arenaData()} />);
		enterGame();

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
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });

		fireEvent.click(within(caught).getByRole('button', { name: /Chưa đạt/ }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
	});

	it('offers to open CP grading when the week is locked', async () => {
		const opened = arenaData().classes[0]!.sessions[0]!;
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

	it('adds a make-up student from another class and writes their CP to their own class', async () => {
		apiMock.mockResolvedValue({
			enrollmentId: 'd',
			sessionId: 's2',
			previous: 0,
			points: 1,
			changed: true,
		});
		render(<RecallArena data={arenaData()} />);
		openStep('Người chơi');
		const setup = setupDialog();
		fireEvent.change(within(setup).getByRole('searchbox'), { target: { value: 'dung' } });
		fireEvent.click(within(setup).getByRole('button', { name: /Nguyễn Dũng/ }));
		expect(within(setup).getByText(/Học bù · CP ghi vào lớp M2, tuần 3/)).toBeTruthy();
		expect(within(setup).getByText('3 bạn trong trận')).toBeTruthy();

		// Leave only the guest in the game so the monster must call them.
		fireEvent.click(within(setup).getByRole('checkbox', { name: /Nguyễn An/ }));
		fireEvent.click(within(setup).getByRole('checkbox', { name: /Nguyễn Bình/ }));
		expect(within(setup).getByText('1 bạn trong trận')).toBeTruthy();
		openStep('Bài học');
		fireEvent.click(within(setup).getByRole('button', { name: 'Vào trận' }));

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn Dũng' });
		fireEvent.click(within(caught).getByRole('button', { name: /Đạt \+1/ }));

		await waitFor(() =>
			expect(apiMock).toHaveBeenCalledWith('/api/admin/teaching/sessions/s2/recall-arena', {
				method: 'POST',
				body: JSON.stringify({ enrollmentId: 'd', points: 1 }),
			}),
		);
	});

	it('mixes questions from several lessons', () => {
		render(<RecallArena data={arenaData()} />);
		openStep('Bài học');
		const setup = setupDialog();
		expect(within(setup).getByText('Hỏi trộn 1 bài · 1 câu')).toBeTruthy();

		fireEvent.click(within(setup).getByRole('checkbox', { name: /Job design/ }));

		expect(within(setup).getByText('Hỏi trộn 2 bài · 2 câu')).toBeTruthy();
		expect(within(setup).getByText(/2 bài · 2 câu/, { selector: 'span span' })).toBeTruthy();
	});

	it('ticks the class the lecturer came from instead of today’s classes', () => {
		render(<RecallArena data={arenaData()} initialClassId="c2" />);
		const setup = setupDialog();
		expect(within(setup).getByRole('checkbox', { name: /Lớp M1/ })).toHaveProperty(
			'checked',
			false,
		);
		expect(within(setup).getByRole('checkbox', { name: /Lớp M2/ })).toHaveProperty('checked', true);
		expect(within(setup).getByText('Chưa ai được điểm danh có mặt ở buổi này.')).toBeTruthy();
	});
});

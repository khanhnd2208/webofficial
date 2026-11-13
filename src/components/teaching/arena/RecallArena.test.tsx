import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaData, RecallArenaPlayer } from '@/features/teaching/types';

import { RecallArena } from './RecallArena';
import { ARENA_CHARACTERS } from './arenaCharacters';

vi.mock('@/components/teaching/admin/api', async (original) => ({
	...(await original<typeof import('@/components/teaching/admin/api')>()),
	teachingApi: vi.fn(),
}));
// The server log of calls has its own test; here the API mock sees only CP and Gift.
vi.mock('./useArenaTurnLog', () => ({
	useArenaTurnLog: () => ({
		loading: false,
		pending: 0,
		failed: false,
		rejected: 0,
		retry: () => {},
	}),
}));
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

function chooseRule(label: string) {
	openStep('Luật gọi');
	fireEvent.click(within(setupDialog()).getByRole('radio', { name: new RegExp(label) }));
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

		const names = screen
			.getAllByTestId('arena-player')
			.map((node) => node.querySelector('[title]')?.textContent);
		expect(names).toEqual(['An', 'Bình']);
		expect(screen.queryByText(/Challenging|Supporting/)).toBeNull();
	});

	it('moves keyboard focus into the setup dialog when it opens', () => {
		render(<RecallArena data={arenaData()} />);
		expect(setupDialog().contains(document.activeElement)).toBe(true);
	});

	it('catches only the chosen group and saves the CP award', async () => {
		apiMock.mockResolvedValue({
			cpPrevious: 0,
			cpAfter: 1,
		});
		render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Challenging');
		enterGame();

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));

		const caught = await screen.findByRole('dialog', { name: 'Nguyễn An' });
		expect(within(caught).getByText('What is motivation?')).toBeTruthy();
		fireEvent.click(within(caught).getByRole('button', { name: /Hiện đáp án/ }));
		expect(within(caught).getByText('The drive to act.')).toBeTruthy();

		fireEvent.click(within(caught).getByRole('button', { name: /Đạt \+1/ }));

		await waitFor(() => expect(apiMock).toHaveBeenCalled());
		expect(apiMock.mock.calls[0]?.[0]).toBe(
			'/api/admin/teaching/courses/course-1/recall-arena/turns',
		);
		expect(JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			enrollmentId: 'a',
			result: 'pass',
			award: 1,
			grade: { kind: 'cp', sessionId: 's1' },
		});
		expect(await screen.findByText('An: CP 0 → 1')).toBeTruthy();
		expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy();
	});

	it('lets the student attack before the monster loses health with full motion', async () => {
		motion.reduced = false;
		apiMock.mockResolvedValue({
			cpPrevious: 0,
			cpAfter: 1,
		});
		render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Challenging');
		enterGame();

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn An' }, { timeout: 5000 });
		fireEvent.click(within(caught).getByRole('button', { name: /Đạt \+1/ }));

		await screen.findByText('An: CP 0 → 1');
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
		expect(
			screen.getAllByTestId('arena-player').find((node) => within(node).queryByText('An'))?.dataset
				.attacking,
		).toBe('true');
		// An was the only Challenging student, so nobody is left to call.
		expect(screen.getByRole('button', { name: /Đã gọi hết/ })).toHaveProperty('disabled', true);

		await waitFor(() => expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy(), {
			timeout: 2200,
		});
	}, 10_000);

	it('keeps the grading dialog open when saving CP fails', async () => {
		apiMock.mockRejectedValueOnce(new Error('Mất kết nối'));
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });
		fireEvent.click(within(caught).getByRole('button', { name: /Đạt \+1/ }));
		await screen.findByText('Mất kết nối');
		expect(screen.getByRole('dialog', { name: /Nguyễn/ })).toBeTruthy();
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Đã gọi 0' })).toBeTruthy();
	});

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
		fireEvent.click(within(setup).getByRole('tab', { name: /^Boss/ }));
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

	it('adds one Gift for a missed answer before ending the turn', async () => {
		apiMock.mockResolvedValue({ giftAfter: 1 });
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });

		fireEvent.click(within(caught).getByRole('button', { name: /Chưa đạt/ }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock.mock.calls[0]?.[0]).toBe(
			'/api/admin/teaching/courses/course-1/recall-arena/turns',
		);
		expect(JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			enrollmentId: caught.querySelector('h2')?.textContent === 'Nguyễn An' ? 'a' : 'b',
			result: 'fail',
			grade: { kind: 'gift' },
		});
		expect(screen.getByRole('status').textContent).toContain('+1 Gift');
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
	});

	it('keeps the caught student on screen when saving Gift fails, then allows retry', async () => {
		apiMock.mockRejectedValueOnce(new Error('Mất kết nối'));
		apiMock.mockResolvedValueOnce({ giftAfter: 1 });
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });
		fireEvent.click(within(caught).getByRole('button', { name: /Chưa đạt/ }));
		await screen.findByText(/Chưa xác nhận Gift: Mất kết nối/);
		expect(within(caught).getByRole('button', { name: 'Vừa đủ qua' })).toHaveProperty(
			'disabled',
			true,
		);
		fireEvent.click(within(caught).getByRole('button', { name: 'Xác nhận lại Gift' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).toHaveBeenCalledTimes(2);
		expect(apiMock.mock.calls[0]).toEqual(apiMock.mock.calls[1]);
	});

	it('treats vừa đủ qua as a pass without changing CP or Gift', async () => {
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });
		fireEvent.click(within(caught).getByRole('button', { name: 'Vừa đủ qua' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Đã gọi 1' }));
		expect(screen.getByText(/Vừa đủ qua/)).toBeTruthy();
	});

	it('reuses a missed question, then retires it on a no-CP pass across reloads', async () => {
		apiMock.mockResolvedValue({ giftAfter: 1 });
		const data = arenaData();
		data.players[2]!.attendance = { s1: 'PRESENT' };
		const view = render(<RecallArena data={data} />);
		enterGame();
		async function catchPlayer() {
			fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
			return screen.findByRole('dialog', { name: /Nguyễn/ });
		}
		let caught = await catchPlayer();
		fireEvent.click(within(caught).getByRole('button', { name: /Chưa đạt/ }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		caught = await catchPlayer();
		expect(within(caught).getByText('What is motivation?')).toBeTruthy();
		fireEvent.click(within(caught).getByRole('button', { name: 'Vừa đủ qua' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		view.unmount();

		render(<RecallArena data={data} />);
		enterGame();
		caught = await catchPlayer();
		expect(within(caught).getByText(/Các câu trong bài đã chọn đều đã qua/)).toBeTruthy();
		expect(within(caught).queryByText('What is motivation?')).toBeNull();
	});

	it('imports pasted names, reuses roster students, and allows removing a guest', () => {
		render(<RecallArena data={arenaData()} />);
		openStep('Người chơi');
		const setup = within(setupDialog());
		fireEvent.click(setup.getByRole('button', { name: 'Dán danh sách tên' }));
		fireEvent.change(setup.getByLabelText('Danh sách họ và tên'), {
			target: { value: 'Nguyễn An; Nguyễn Dũng\nLê Minh Anh, Trần Hải Bảo | lê minh anh' },
		});
		fireEvent.click(setup.getByRole('button', { name: 'Thêm danh sách' }));
		expect(setup.getByRole('status').textContent).toBe(
			'Đã thêm 3 người · 2 khách chơi thử · 2 mục đã có',
		);
		expect(setup.getByRole('checkbox', { name: /Nguyễn Dũng/ })).toHaveProperty('checked', true);
		expect(setup.getByText('5 bạn trong trận')).toBeTruthy();
		const guest = setup.getByText('Lê Minh Anh').closest('li')!;
		fireEvent.click(within(guest).getByRole('button', { name: 'Xóa' }));
		expect(setup.queryByText('Lê Minh Anh')).toBeNull();
		expect(setup.getByText('4 bạn trong trận')).toBeTruthy();
	});

	it('calls a named student in the room and keeps the skipped student eligible', async () => {
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const first = await screen.findByRole('dialog', { name: /Nguyễn/ });
		const otherName =
			within(first).getByRole('heading').textContent === 'Nguyễn An' ? 'Nguyễn Bình' : 'Nguyễn An';
		fireEvent.click(within(first).getByRole('button', { name: 'Gọi chỉ định' }));
		fireEvent.change(within(first).getByRole('searchbox'), {
			target: { value: otherName === 'Nguyễn An' ? 'an' : 'binh' },
		});
		fireEvent.click(within(first).getByRole('button', { name: new RegExp(otherName) }));
		const second = await screen.findByRole('dialog', { name: otherName });
		expect(within(second).getByText('What is motivation?')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Đã gọi 0' })).toBeTruthy();
		expect(apiMock).not.toHaveBeenCalled();
	});

	it('calls a different student after a random skip', async () => {
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const first = await screen.findByRole('dialog', { name: /Nguyễn/ });
		const firstName = within(first).getByRole('heading').textContent;
		fireEvent.click(within(first).getByRole('button', { name: 'Gọi ngẫu nhiên bạn khác' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: firstName! })).toBeNull());
		const second = await screen.findByRole('dialog', { name: /Nguyễn/ });
		expect(within(second).getByRole('heading').textContent).not.toBe(firstName);
		expect(apiMock).not.toHaveBeenCalled();
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
			cpPrevious: 0,
			cpAfter: 1,
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

		await waitFor(() => expect(apiMock).toHaveBeenCalled());
		expect(apiMock.mock.calls[0]?.[0]).toBe(
			'/api/admin/teaching/courses/course-1/recall-arena/turns',
		);
		expect(JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			enrollmentId: 'd',
			result: 'pass',
			award: 1,
			grade: { kind: 'cp', sessionId: 's2' },
		});
	});

	it('adds and edits an unlisted player, then lets them defeat the monster without writing CP', async () => {
		render(<RecallArena data={arenaData()} initialClassId="c2" />);
		openStep('Người chơi');
		const setup = setupDialog();
		fireEvent.change(within(setup).getByPlaceholderText('Họ và tên'), {
			target: { value: 'Lê Minh An' },
		});
		fireEvent.change(within(setup).getByLabelText('Nhóm của người ngoài danh sách'), {
			target: { value: 'CHALLENGE' },
		});
		fireEvent.click(within(setup).getByRole('button', { name: 'Thêm vào trận' }));
		expect(within(setup).getByText('1 bạn trong trận')).toBeTruthy();
		const manualList = within(setup).getByRole('region', { name: 'Người ngoài danh sách' });
		fireEvent.click(within(manualList).getByRole('button', { name: 'Sửa' }));
		fireEvent.change(within(setup).getByPlaceholderText('Họ và tên'), {
			target: { value: 'Lê Minh Bình' },
		});
		fireEvent.click(within(setup).getByRole('button', { name: 'Lưu sửa' }));
		expect(within(manualList).getByText('Lê Minh Bình')).toBeTruthy();
		chooseRule('Chỉ Challenging');
		fireEvent.click(within(setup).getByRole('button', { name: 'Vào trận' }));

		expect(within(screen.getByTestId('arena-player')).getByText('Bình')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Lê Minh Bình' });
		expect(within(caught).getByText('Khách chơi thử')).toBeTruthy();
		fireEvent.click(within(caught).getByRole('button', { name: 'Đạt' }));
		await waitFor(() => expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy());
		expect(apiMock).not.toHaveBeenCalled();
		expect(screen.getByText('Bình: đạt')).toBeTruthy();
	});

	it('lets an unlisted player return their turn when they did not answer', async () => {
		render(<RecallArena data={arenaData()} initialClassId="c2" />);
		openStep('Người chơi');
		const setup = setupDialog();
		fireEvent.change(within(setup).getByPlaceholderText('Họ và tên'), {
			target: { value: 'Lê Minh An' },
		});
		fireEvent.change(within(setup).getByLabelText('Nhóm của người ngoài danh sách'), {
			target: { value: 'CHALLENGE' },
		});
		fireEvent.click(within(setup).getByRole('button', { name: 'Thêm vào trận' }));
		chooseRule('Chỉ Challenging');
		fireEvent.click(within(setup).getByRole('button', { name: 'Vào trận' }));
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Lê Minh An' });
		expect(within(caught).queryByRole('button', { name: 'Chưa đạt' })).toBeNull();
		fireEvent.click(within(caught).getByRole('button', { name: 'Đóng, không chấm' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Lê Minh An' })).toBeNull());
		expect(apiMock).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'Đã gọi 0' })).toBeTruthy();
	});

	it('never calls a student twice, marks them, and sums up the session at the end', async () => {
		apiMock.mockResolvedValue({ cpPrevious: 0, cpAfter: 1 });
		render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Supporting');
		enterGame();
		expect(screen.getAllByTestId('arena-player')).toHaveLength(2);

		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn Bình' });
		fireEvent.click(within(caught).getByRole('button', { name: /Đạt \+1/ }));
		await screen.findByRole('button', { name: /Đã gọi hết/ });
		const done = screen
			.getAllByTestId('arena-player')
			.find((node) => within(node).queryByText('Bình'))!;
		expect(within(done).getByTitle('Đã vượt qua')).toBeTruthy();
		expect(screen.getByRole('button', { name: /Đã gọi hết/ })).toHaveProperty('disabled', true);

		fireEvent.click(screen.getByRole('button', { name: /Kết thúc/ }));
		const summary = screen.getByRole('dialog', { name: 'Tổng kết phiên' });
		const rows = within(summary).getAllByRole('row').slice(1);
		expect(rows.map((row) => row.textContent)).toEqual([
			expect.stringMatching(/Bình.*Đạt.*\+1/),
			expect.stringMatching(/An.*Chưa gọi/),
		]);
		fireEvent.click(within(summary).getByRole('button', { name: 'Tiếp tục chơi' }));
		expect(screen.queryByRole('dialog', { name: 'Tổng kết phiên' })).toBeNull();
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

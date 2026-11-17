import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';
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
const arenaSound = vi.hoisted(() => ({ muted: false, play: vi.fn() }));
vi.mock('./arenaSound', () => ({
	isArenaMuted: () => arenaSound.muted,
	playArenaSound: arenaSound.play,
	setArenaMuted: (next: boolean) => {
		arenaSound.muted = next;
	},
	subscribeArenaMuted: () => () => {},
}));
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
/** A missed answer that keeps the question: what a miss did before the grade grid had rows. */
/** A +1 pass that hides the question, as every pass did before. */
const PASS_HIDE = /^Đạt \+1(, ẩn câu)?$/;
const GIFT_KEEP = /^Chưa đạt, \+1 Gift(, giữ câu)?$/;

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
	fireEvent.click(within(setup).getByRole('button', { name: /^(Vào trận|Tiếp tục phiên)$/ }));
}

/** After a missed answer: nobody raises a hand, the turn ends. */
async function nobodyAnswersInstead() {
	fireEvent.click(await screen.findByRole('button', { name: /Không ai · tiếp tục/ }));
}

describe('RecallArena', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		arenaSound.muted = false;
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

		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));

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
		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));

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

	it('scores the full-motion hunt from low scan pulses through lock, reach and contact', () => {
		motion.reduced = false;
		vi.useFakeTimers();
		const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
		const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
		const left = vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
			this: HTMLElement,
		) {
			return this.dataset.playerId === 'b' ? 800 : 160;
		});
		const top = vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
			this: HTMLElement,
		) {
			return this.dataset.playerId === 'b' ? 260 : 100;
		});
		try {
			render(<RecallArena data={arenaData()} />);
			chooseRule('Chỉ Challenging');
			enterGame();
			arenaSound.play.mockClear();

			fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
			act(() => vi.advanceTimersByTime(60));
			expect(arenaSound.play.mock.calls).toEqual([['hunt', 0]]);

			act(() => vi.advanceTimersByTime(620));
			expect(arenaSound.play).toHaveBeenLastCalledWith('target');
			act(() => vi.advanceTimersByTime(460));
			expect(arenaSound.play).toHaveBeenLastCalledWith('suck');
			act(() => vi.advanceTimersByTime(394));
			expect(arenaSound.play).toHaveBeenLastCalledWith('chomp');
		} finally {
			width.mockRestore();
			height.mockRestore();
			left.mockRestore();
			top.mockRestore();
			vi.useRealTimers();
		}
	});

	it('keeps the grading dialog open when the server refuses the CP', async () => {
		apiMock.mockRejectedValueOnce(
			new AdminApiError('CP tuần này đang khóa. Mở chấm CP rồi chấm lại.', { status: 409 }),
		);
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });
		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));
		await screen.findByText('CP tuần này đang khóa. Mở chấm CP rồi chấm lại.');
		expect(screen.getByRole('dialog', { name: /Nguyễn/ })).toBeTruthy();
		expect(within(caught).getByRole('button', { name: 'Đóng, không chấm' })).toHaveProperty(
			'disabled',
			false,
		);
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Đã gọi 0' })).toBeTruthy();
	});

	it('goes on when a CP save gets no answer and keeps the grade to send again', async () => {
		apiMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });
		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));
		await screen.findByText(/chưa xác nhận CP \(Mất kết nối mạng\.\)\. Máy sẽ tự lưu lại\./);
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Đã gọi 1' })).toBeTruthy();
		const sent = JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body));
		const stored = JSON.parse(window.localStorage.getItem('recall-arena:v3:phien:course-1')!);
		expect(stored.history).toEqual([
			expect.objectContaining({
				id: sent.clientId,
				result: 'pass',
				award: 1,
				pendingGrade: { kind: 'cp', sessionId: 's1' },
			}),
		]);
		expect(stored.history[0].synced).toBeUndefined();
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

		fireEvent.click(within(caught).getByRole('button', { name: GIFT_KEEP }));

		expect(await within(caught).findByText('Chưa đạt · đã ghi +1 Gift')).toBeTruthy();
		await nobodyAnswersInstead();
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).toHaveBeenCalledTimes(1);
		expect(apiMock.mock.calls[0]?.[0]).toBe(
			'/api/admin/teaching/courses/course-1/recall-arena/turns',
		);
		expect(JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			enrollmentId: caught.querySelector('h2')?.textContent === 'Nguyễn An' ? 'a' : 'b',
			result: 'fail',
			grade: { kind: 'gift' },
		});
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
	});

	it('goes on when a Gift save gets no answer, so a reload cannot add a second Gift', async () => {
		apiMock.mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'));
		const view = render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });
		const caughtName = within(caught).getByRole('heading').textContent;
		fireEvent.click(within(caught).getByRole('button', { name: GIFT_KEEP }));
		expect(await within(caught).findByText('Chưa đạt · Gift đang chờ lưu lại')).toBeTruthy();
		await nobodyAnswersInstead();
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).toHaveBeenCalledTimes(1);
		view.unmount();

		// After a reload the missed student counts as answered and is not called again.
		render(<RecallArena data={arenaData()} />);
		enterGame();
		expect(screen.getByRole('button', { name: 'Đã gọi 1' })).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const next = await screen.findByRole('dialog', { name: /Nguyễn/ });
		expect(within(next).getByRole('heading').textContent).not.toBe(caughtName);
		const stored = JSON.parse(window.localStorage.getItem('recall-arena:v3:phien:course-1')!);
		expect(stored.history[0]).toMatchObject({ result: 'fail', pendingGrade: { kind: 'gift' } });
	});

	it('treats không điểm as a pass without changing CP or Gift', async () => {
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: /Nguyễn/ });
		fireEvent.click(within(caught).getByRole('button', { name: 'Không điểm, ẩn câu' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Đã gọi 1' }));
		expect(screen.getByText('Không điểm')).toBeTruthy();
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
		fireEvent.click(within(caught).getByRole('button', { name: GIFT_KEEP }));
		await nobodyAnswersInstead();
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		caught = await catchPlayer();
		expect(within(caught).getByText('What is motivation?')).toBeTruthy();
		fireEvent.click(within(caught).getByRole('button', { name: 'Không điểm, ẩn câu' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		view.unmount();

		render(<RecallArena data={data} />);
		enterGame();
		caught = await catchPlayer();
		expect(within(caught).getByText(/Các câu trong bài đã chọn đều đã ẩn/)).toBeTruthy();
		expect(within(caught).queryByText('What is motivation?')).toBeNull();
	});

	it('keeps a question on the Giữ câu row and lets the history hide it', async () => {
		apiMock.mockResolvedValue({ days: [], turns: [] });
		const data = arenaData();
		data.players[2]!.attendance = { s1: 'PRESENT' };
		render(<RecallArena data={data} />);
		enterGame();
		async function catchPlayer() {
			fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
			return screen.findByRole('dialog', { name: /Nguyễn/ });
		}
		let caught = await catchPlayer();
		expect(within(caught).queryByText('Hỏi lại')).toBeNull();
		fireEvent.click(within(caught).getByRole('button', { name: 'Không điểm, giữ câu' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).not.toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ body: expect.stringContaining('"grade"') }),
		);

		caught = await catchPlayer();
		expect(within(caught).getByText('What is motivation?')).toBeTruthy();
		expect(within(caught).getByText('Hỏi lại')).toBeTruthy();
		fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());

		fireEvent.click(screen.getByRole('button', { name: 'Đã gọi 1' }));
		const history = screen.getByRole('complementary', { name: 'Lịch sử gọi' });
		expect(within(history).getByText(/1 câu đang giữ/)).toBeTruthy();
		fireEvent.click(within(history).getByRole('button', { name: 'Ẩn câu' }));
		expect(within(history).getByText('Câu đã ẩn')).toBeTruthy();
		expect(within(history).getByRole('button', { name: 'Đưa câu trở lại' })).toBeTruthy();
		fireEvent.click(within(history).getByRole('button', { name: 'Ẩn lịch sử' }));

		caught = await catchPlayer();
		expect(within(caught).getByText(/Các câu trong bài đã chọn đều đã ẩn/)).toBeTruthy();
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

	it('has no random-skip button: closing the card returns to the floor to catch again', async () => {
		render(<RecallArena data={arenaData()} />);
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const first = await screen.findByRole('dialog', { name: /Nguyễn/ });
		expect(within(first).queryByRole('button', { name: /Gọi ngẫu nhiên/ })).toBeNull();
		fireEvent.click(within(first).getByRole('button', { name: 'Đóng, không chấm' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(screen.getByRole('button', { name: /Bắt!/ })).toHaveProperty('disabled', false);
		expect(screen.getByRole('button', { name: 'Đã gọi 0' })).toBeTruthy();
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
		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));

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
		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));
		await screen.findByRole('button', { name: /Đã gọi hết/ });
		const done = screen
			.getAllByTestId('arena-player')
			.find((node) => within(node).queryByText('Bình'))!;
		expect(within(done).getByTitle('Đã vượt qua')).toBeTruthy();
		expect(screen.getByRole('button', { name: /Đã gọi hết/ })).toHaveProperty('disabled', true);

		fireEvent.click(screen.getByRole('button', { name: 'Tổng kết' }));
		const summary = screen.getByRole('dialog', { name: 'Tổng kết phiên' });
		const rows = within(summary).getAllByRole('row').slice(1);
		expect(rows.map((row) => row.textContent)).toEqual([
			expect.stringMatching(/Bình.*Đạt.*\+1/),
			expect.stringMatching(/An.*Chưa gọi/),
		]);
		expect(rows[0]!.textContent).toMatch(/0 → 1/);
		expect(within(summary).getByText(/Đã lưu hết lên hệ thống/)).toBeTruthy();
		fireEvent.click(within(summary).getByRole('button', { name: 'Tiếp tục chơi' }));
		expect(screen.queryByRole('dialog', { name: 'Tổng kết phiên' })).toBeNull();

		// Leaving with the X shows the same summary instead of dropping the lecturer out.
		fireEvent.click(screen.getByRole('button', { name: 'Thoát khỏi trận' }));
		const leaving = screen.getByRole('dialog', { name: 'Tổng kết phiên' });
		expect(within(leaving).getByRole('link', { name: 'Rời trang, giữ phiên' })).toHaveProperty(
			'href',
			expect.stringContaining('/my-space/teaching/courses/course-1'),
		);
	});

	it('keeps the phiên across reloads and ends it only after a confirmation', async () => {
		apiMock.mockResolvedValue({ cpPrevious: 0, cpAfter: 1 });
		const view = render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Supporting');
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn Bình' });
		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));
		await screen.findByRole('button', { name: /Đã gọi hết/ });
		view.unmount();

		// A reload carries on: the setup names the open phiên and offers to continue it.
		render(<RecallArena data={arenaData()} />);
		const setup = within(setupDialog());
		expect(setup.getByText(/Đang mở: Phiên bắt đầu \d{2}:\d{2} · 1 lượt/)).toBeTruthy();
		expect(setup.getByRole('button', { name: 'Tiếp tục phiên' })).toBeTruthy();
		fireEvent.click(setup.getByRole('button', { name: 'Xem tổng kết và kết thúc phiên' }));

		let summary = screen.getByRole('dialog', { name: 'Tổng kết phiên' });
		fireEvent.click(within(summary).getByRole('button', { name: 'Kết thúc phiên' }));
		let confirm = await screen.findByRole('dialog', { name: 'Kết thúc phiên này?' });
		expect(
			within(confirm).getByRole('button', { name: /Kết thúc phiên \(\d giây\)/ }),
		).toHaveProperty('disabled', true);
		fireEvent.click(within(confirm).getByRole('button', { name: 'Chưa, quay lại' }));
		await waitFor(() =>
			expect(screen.queryByRole('dialog', { name: 'Kết thúc phiên này?' })).toBeNull(),
		);
		summary = screen.getByRole('dialog', { name: 'Tổng kết phiên' });
		expect(within(summary).getByText(/Bình/)).toBeTruthy();

		fireEvent.click(within(summary).getByRole('button', { name: 'Kết thúc phiên' }));
		confirm = await screen.findByRole('dialog', { name: 'Kết thúc phiên này?' });
		const end = await within(confirm).findByRole(
			'button',
			{ name: 'Kết thúc phiên' },
			{ timeout: 3500 },
		);
		fireEvent.click(end);

		// The next phiên starts fresh: nobody answered, nothing to continue.
		await waitFor(() =>
			expect(screen.queryByRole('dialog', { name: 'Tổng kết phiên' })).toBeNull(),
		);
		const fresh = within(setupDialog());
		expect(fresh.queryByText(/Đang mở:/)).toBeNull();
		expect(fresh.getByText(/Đã kết thúc phiên bắt đầu \d{2}:\d{2} · 1 lượt/)).toBeTruthy();
		enterGame();
		expect(screen.getByRole('button', { name: 'Đã gọi 0' })).toBeTruthy();
		expect(screen.getByRole('button', { name: /Bắt!/ })).toHaveProperty('disabled', false);
	});

	it('says why a reopened phiên cannot continue when the whole called group has answered', async () => {
		apiMock.mockResolvedValue({ cpPrevious: 0, cpAfter: 1 });
		const view = render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Supporting');
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn Bình' });
		fireEvent.click(within(caught).getByRole('button', { name: PASS_HIDE }));
		await screen.findByRole('button', { name: /Đã gọi hết/ });
		view.unmount();

		render(<RecallArena data={arenaData()} />);
		const setup = within(setupDialog());
		expect(setup.getByRole('button', { name: 'Tiếp tục phiên' })).toHaveProperty('disabled', true);
		expect(setup.getByText(/Mọi bạn trong nhóm đang gọi đã trả lời/)).toBeTruthy();

		// Widening the rule leaves An to call, so the phiên can go on.
		chooseRule('Cả lớp');
		expect(setup.queryByText(/Mọi bạn trong nhóm đang gọi đã trả lời/)).toBeNull();
		fireEvent.click(setup.getByRole('button', { name: 'Tiếp tục phiên' }));
		expect(screen.getByRole('button', { name: /Bắt!/ })).toHaveProperty('disabled', false);
	});

	it('lets the lecturer leave the setup before the game starts', () => {
		render(<RecallArena data={arenaData()} />);
		const exit = within(setupDialog()).getByRole('link', { name: 'Thoát về trang lớp' });
		expect(exit.getAttribute('href')).toBe('/my-space/teaching/courses/course-1');
	});

	it('lists the Gift a missed answer added in the summary', async () => {
		apiMock.mockResolvedValue({ giftAfter: 2 });
		render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Supporting');
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn Bình' });
		fireEvent.click(within(caught).getByRole('button', { name: GIFT_KEEP }));
		await nobodyAnswersInstead();
		await screen.findByRole('button', { name: /Đã gọi hết/ });

		fireEvent.click(screen.getByRole('button', { name: 'Tổng kết' }));
		const summary = screen.getByRole('dialog', { name: 'Tổng kết phiên' });
		const row = within(summary).getAllByRole('row')[1]!;
		expect(row.textContent).toMatch(/Bình.*Chưa đạt.*\+1 \(2\)/);
	});

	it('lets another student answer a missed question for CP while the Gift stays', async () => {
		apiMock.mockResolvedValueOnce({ giftAfter: 1 });
		apiMock.mockResolvedValueOnce({ cpAfter: 1, cpPrevious: 0 });
		render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Supporting');
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn Bình' });
		fireEvent.click(within(caught).getByRole('button', { name: GIFT_KEEP }));

		const search = await within(caught).findByLabelText('Có bạn nào trả lời thay Bình?');
		expect(within(caught).queryByRole('button', { name: /Đạt \+1/ })).toBeNull();
		fireEvent.change(search, { target: { value: 'An' } });
		fireEvent.click(within(caught).getByRole('button', { name: /Nguyễn An/ }));

		const volunteer = screen.getByRole('dialog', { name: 'Nguyễn An' });
		expect(within(volunteer).getByText('What is motivation?')).toBeTruthy();
		expect(within(volunteer).getByText(/Trả lời thay/).textContent).toBe('Trả lời thay Bình');
		expect(within(volunteer).queryByRole('button', { name: /Không điểm/ })).toBeNull();
		fireEvent.click(within(volunteer).getByRole('button', { name: 'Đạt +1' }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).toHaveBeenCalledTimes(2);
		const [gift, bonus] = apiMock.mock.calls.map((call) => JSON.parse(String(call[1]?.body)));
		expect(gift).toMatchObject({ enrollmentId: 'b', result: 'fail', grade: { kind: 'gift' } });
		expect(bonus).toMatchObject({
			enrollmentId: 'a',
			cardId: 'card-1',
			result: 'pass',
			award: 1,
			grade: { kind: 'cp', sessionId: 's1' },
		});
		expect(bonus.clientId).toMatch(/^assist:/);
		// The class answered the question, so the boss is hit instead of healing.
		expect(screen.getByLabelText('Máu quái vật 9/10')).toBeTruthy();
	});

	it('goes back to the picker without a Gift when the volunteer misses too', async () => {
		apiMock.mockResolvedValueOnce({ giftAfter: 1 });
		render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Supporting');
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn Bình' });
		fireEvent.click(within(caught).getByRole('button', { name: GIFT_KEEP }));
		const search = await within(caught).findByLabelText('Có bạn nào trả lời thay Bình?');
		fireEvent.change(search, { target: { value: 'SV-a' } });
		fireEvent.keyDown(search, { key: 'Enter' });

		const volunteer = screen.getByRole('dialog', { name: 'Nguyễn An' });
		fireEvent.click(within(volunteer).getByRole('button', { name: /Chưa đạt · chọn bạn khác/ }));

		const again = await screen.findByLabelText('Có bạn nào trả lời thay Bình?');
		fireEvent.keyDown(again, { key: 'Enter' });
		await waitFor(() => expect(screen.queryByRole('dialog', { name: /Nguyễn/ })).toBeNull());
		expect(apiMock).toHaveBeenCalledTimes(1);
		expect(screen.getByLabelText('Máu quái vật 10/10')).toBeTruthy();
	});

	it('gives only a Challenging student a 30-second thinking clock', async () => {
		const view = render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Challenging');
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const caught = await screen.findByRole('dialog', { name: 'Nguyễn An' });
		expect(within(caught).getByRole('timer').getAttribute('aria-label')).toBe(
			'Còn 30 giây suy nghĩ',
		);
		view.unmount();
		window.localStorage.clear();

		render(<RecallArena data={arenaData()} />);
		chooseRule('Chỉ Supporting');
		enterGame();
		fireEvent.click(screen.getByRole('button', { name: /Bắt!/ }));
		const supported = await screen.findByRole('dialog', { name: 'Nguyễn Bình' });
		expect(within(supported).queryByRole('timer')).toBeNull();
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

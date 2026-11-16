import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';

import { emptyProgress, type ArenaHistoryEntry, type ArenaProgress } from './arenaGame';
import { arenaRetryDelay, useArenaTurnLog } from './useArenaTurnLog';

vi.mock('@/components/teaching/admin/api', async () => {
	const actual = await vi.importActual<typeof import('@/components/teaching/admin/api')>(
		'@/components/teaching/admin/api',
	);
	return { AdminApiError: actual.AdminApiError, teachingApi: vi.fn() };
});

const apiMock = vi.mocked(teachingApi);

function entry(id: string, extra: Partial<ArenaHistoryEntry> = {}): ArenaHistoryEntry {
	return {
		id,
		at: 1_700_000_000_000,
		enrollmentId: 'enr-1',
		name: 'Nguyễn An',
		cardId: null,
		result: 'pass',
		...extra,
	};
}

const onGradeSaved = vi.fn();
const onGradeRefused = vi.fn();

function useHarness(initial: ArenaProgress) {
	const [progress, setProgress] = useState(initial);
	const log = useArenaTurnLog({
		courseId: 'course-1',
		progress,
		setProgress,
		ready: true,
		onGradeSaved,
		onGradeRefused,
	});
	return { progress, log };
}

const TURNS_URL = '/api/admin/teaching/courses/course-1/recall-arena/turns';

describe('useArenaTurnLog', () => {
	beforeEach(() => vi.clearAllMocks());

	it('waits 5 s after a failure, doubling up to a minute', () => {
		expect([1, 2, 3, 4, 5, 9].map(arenaRetryDelay)).toEqual([
			5_000, 10_000, 20_000, 40_000, 60_000, 60_000,
		]);
	});

	it('gives every send a time limit', async () => {
		apiMock.mockResolvedValue({});
		const { result } = renderHook(() =>
			useHarness({ ...emptyProgress(), history: [entry('turn-aaaa1')] }),
		);
		await waitFor(() => expect(result.current.log.pending).toBe(0));
		expect(apiMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
	});

	it('sends again on its own when the browser comes back online', async () => {
		apiMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue({});
		const { result } = renderHook(() =>
			useHarness({ ...emptyProgress(), history: [entry('turn-aaaa1')] }),
		);
		await waitFor(() => expect(result.current.log.failed).toBe(true));
		act(() => {
			window.dispatchEvent(new Event('online'));
		});
		await waitFor(() => expect(result.current.log.pending).toBe(0));
		expect(result.current.log.failed).toBe(false);
		expect(apiMock).toHaveBeenCalledTimes(2);
	});

	it('sends again on its own after a pause', async () => {
		vi.useFakeTimers();
		try {
			apiMock.mockRejectedValueOnce(new Error('server down')).mockResolvedValue({});
			const { result } = renderHook(() =>
				useHarness({ ...emptyProgress(), history: [entry('turn-aaaa1')] }),
			);
			await act(async () => {});
			expect(result.current.log.failed).toBe(true);
			await act(async () => {
				vi.advanceTimersByTime(4_999);
			});
			expect(apiMock).toHaveBeenCalledTimes(1);
			await act(async () => {
				vi.advanceTimersByTime(1);
			});
			await act(async () => {});
			expect(apiMock).toHaveBeenCalledTimes(2);
			expect(result.current.log.pending).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});

	it('sends a grade saved late with the same id and keeps what the server confirms', async () => {
		apiMock.mockResolvedValue({ cpAfter: 2, cpPrevious: 0.5 });
		const late = entry('turn-aaaa1', {
			award: 2,
			pendingGrade: { kind: 'cp', sessionId: 'session-1' },
		});
		const { result } = renderHook(() => useHarness({ ...emptyProgress(), history: [late] }));
		await waitFor(() => expect(result.current.log.pending).toBe(0));
		expect(JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			clientId: 'turn-aaaa1',
			result: 'pass',
			award: 2,
			grade: { kind: 'cp', sessionId: 'session-1' },
		});
		const saved = result.current.progress.history[0]!;
		expect(saved).toMatchObject({ synced: true, cpAfter: 2, cpBefore: 0.5 });
		expect(saved.pendingGrade).toBeUndefined();
		expect(onGradeSaved).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'turn-aaaa1', cpAfter: 2 }),
			{ kind: 'cp', sessionId: 'session-1' },
			'Nguyễn An: CP 0.5 → 2',
		);
	});

	it('reports a grade saved late that the server refuses', async () => {
		apiMock.mockRejectedValueOnce(new AdminApiError('CP tuần này đang khóa.', { status: 409 }));
		const late = entry('turn-aaaa1', { result: 'fail', pendingGrade: { kind: 'gift' } });
		const { result } = renderHook(() => useHarness({ ...emptyProgress(), history: [late] }));
		await waitFor(() => expect(result.current.log.rejected).toBe(1));
		expect(onGradeRefused).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'turn-aaaa1' }),
			'CP tuần này đang khóa.',
		);
		expect(apiMock).toHaveBeenCalledTimes(1);
	});

	it('sends each unsaved call once, in order, and marks it saved', async () => {
		apiMock.mockResolvedValue({});
		const { result } = renderHook(() =>
			useHarness({ ...emptyProgress(), history: [entry('turn-aaaa1'), entry('turn-bbbb2')] }),
		);
		await waitFor(() => expect(result.current.log.pending).toBe(0));
		const posted = apiMock.mock.calls
			.filter(([, init]) => init?.method === 'POST')
			.map(([, init]) => JSON.parse(String(init?.body)).clientId);
		expect(posted).toEqual(['turn-aaaa1', 'turn-bbbb2']);
		expect(apiMock.mock.calls.find(([, init]) => init?.method === 'POST')?.[0]).toBe(TURNS_URL);
		expect(result.current.progress.history.every((item) => item.synced)).toBe(true);
	});

	it('stops on a network error and sends again when asked', async () => {
		apiMock.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({});
		const { result } = renderHook(() =>
			useHarness({ ...emptyProgress(), history: [entry('turn-aaaa1')] }),
		);
		await waitFor(() => expect(result.current.log.failed).toBe(true));
		expect(result.current.log.pending).toBe(1);
		act(() => result.current.log.retry());
		await waitFor(() => expect(result.current.log.pending).toBe(0));
		expect(apiMock).toHaveBeenCalledTimes(2);
	});

	it('skips a call the server refuses and keeps sending the rest', async () => {
		apiMock
			.mockRejectedValueOnce(new AdminApiError('Enrollment not found', { status: 404 }))
			.mockResolvedValue({});
		const { result } = renderHook(() =>
			useHarness({ ...emptyProgress(), history: [entry('turn-aaaa1'), entry('turn-bbbb2')] }),
		);
		await waitFor(() => expect(result.current.log.pending).toBe(0));
		expect(result.current.log.rejected).toBe(1);
		expect(result.current.log.failed).toBe(false);
		expect(result.current.progress.history.find((item) => item.id === 'turn-bbbb2')?.synced).toBe(
			true,
		);
	});

	it('never pulls the saved calls of the day into the running phiên', async () => {
		apiMock.mockResolvedValue({});
		const { result } = renderHook(() =>
			useHarness({ ...emptyProgress(), history: [entry('local-1111', { synced: true })] }),
		);
		await act(async () => {});
		expect(apiMock).not.toHaveBeenCalled();
		expect(result.current.progress.history.map((item) => item.id)).toEqual(['local-1111']);
		expect(result.current.log.pending).toBe(0);
	});
});

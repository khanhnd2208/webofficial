import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';

import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import { emptyProgress, type ArenaHistoryEntry, type ArenaProgress } from './arenaGame';
import { useArenaDayTurns, useArenaTurnLog } from './useArenaTurnLog';

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

const RUN = 's1~mhx0001';

function savedTurn(clientId: string, runKey: string | null): RecallArenaTurnRecord {
	return {
		clientId,
		playedAt: 1_700_000_000_000,
		playedOn: '2026-11-13',
		runKey,
		enrollmentId: null,
		guest: true,
		guestGroup: 'SUPPORT',
		playerName: 'Lê Khách',
		studentCode: '',
		cardId: null,
		question: '',
		result: 'fail',
		award: null,
		cpAfter: null,
		giftAfter: null,
	};
}

function useHarness(initial: ArenaProgress, dayTurns: RecallArenaTurnRecord[] = []) {
	const [progress, setProgress] = useState(initial);
	const log = useArenaTurnLog({
		courseId: 'course-1',
		runKey: RUN,
		dayTurns,
		progress,
		setProgress,
		ready: true,
	});
	return { progress, log };
}

const TURNS_URL = '/api/admin/teaching/courses/course-1/recall-arena/turns';

describe('useArenaTurnLog', () => {
	beforeEach(() => vi.clearAllMocks());

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

	it('merges only the saved calls of the run on screen', async () => {
		const dayTurns = [savedTurn('saved-1111', RUN), savedTurn('other-2222', 's2~mhx0002')];
		const { result } = renderHook(() =>
			useHarness(
				{ ...emptyProgress(), history: [entry('local-1111', { synced: true })] },
				dayTurns,
			),
		);
		await waitFor(() => expect(result.current.log.loading).toBe(false));
		expect(result.current.progress.history.map((item) => item.id).sort()).toEqual([
			'local-1111',
			'saved-1111',
		]);
		expect(result.current.progress.history.find((item) => item.id === 'saved-1111')).toMatchObject({
			name: 'Lê Khách',
			result: 'fail',
			runKey: RUN,
			synced: true,
		});
		expect(apiMock).not.toHaveBeenCalled();
	});
});

describe('useArenaDayTurns', () => {
	beforeEach(() => vi.clearAllMocks());

	it('loads every run of the day once', async () => {
		apiMock.mockResolvedValue({ date: '2026-11-13', days: [], turns: [savedTurn('a-1111', RUN)] });
		const { result } = renderHook(() => useArenaDayTurns('course-1', '2026-11-13'));
		expect(result.current).toBeNull();
		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(apiMock).toHaveBeenCalledWith(`${TURNS_URL}?date=2026-11-13`);
	});

	it('falls back to no saved calls when the log cannot be read', async () => {
		apiMock.mockRejectedValue(new Error('offline'));
		const { result } = renderHook(() => useArenaDayTurns('course-1', '2026-11-13'));
		await waitFor(() => expect(result.current).toEqual([]));
	});
});

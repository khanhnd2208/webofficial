import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';

import { emptyProgress, type ArenaHistoryEntry, type ArenaProgress } from './arenaGame';
import { useArenaTurnLog } from './useArenaTurnLog';

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

function useHarness(initial: ArenaProgress) {
	const [progress, setProgress] = useState(initial);
	const log = useArenaTurnLog({
		courseId: 'course-1',
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

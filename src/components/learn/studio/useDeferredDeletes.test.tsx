import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDeferredDeletes } from './useDeferredDeletes';

describe('useDeferredDeletes', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not commit until asked, and undo restores instead', () => {
		const commit = vi.fn();
		const restore = vi.fn();
		const { result } = renderHook(() => useDeferredDeletes());

		act(() =>
			result.current.defer({
				key: 'section-1',
				message: 'Đã xóa mục "Mục 1"',
				commit,
				restore,
			}),
		);
		expect(result.current.message).toBe('Đã xóa mục "Mục 1"');
		expect(commit).not.toHaveBeenCalled();

		act(() => result.current.undo());
		expect(restore).toHaveBeenCalledOnce();
		expect(commit).not.toHaveBeenCalled();
		expect(result.current.message).toBeNull();
	});

	it('commits the pending delete before a structural change and on pagehide', async () => {
		const commit = vi.fn();
		const { result } = renderHook(() => useDeferredDeletes());
		act(() =>
			result.current.defer({
				key: 'section-1',
				message: 'Đã xóa mục "Mục 1"',
				commit,
				restore: vi.fn(),
			}),
		);

		await act(async () => {
			await result.current.commitAll();
		});
		expect(commit).toHaveBeenCalledWith(undefined);
		expect(result.current.message).toBeNull();

		const keepalive = vi.fn();
		act(() =>
			result.current.defer({
				key: 'section-2',
				message: 'Đã xóa mục "Mục 2"',
				commit: keepalive,
				restore: vi.fn(),
			}),
		);
		act(() => {
			window.dispatchEvent(new Event('pagehide'));
		});
		expect(keepalive).toHaveBeenCalledWith({ keepalive: true });
	});

	it('waits for a slow delete that is already running', async () => {
		let release: (() => void) | undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const commit = vi.fn(() => gate);
		const { result } = renderHook(() => useDeferredDeletes());
		act(() =>
			result.current.defer({
				key: 'section-1',
				message: 'Đã xóa mục "Mục 1"',
				commit,
				restore: vi.fn(),
			}),
		);

		let firstDone = false;
		let secondDone = false;
		let first: Promise<void> = Promise.resolve();
		let second: Promise<void> = Promise.resolve();
		await act(async () => {
			first = result.current.commitAll().then(() => {
				firstDone = true;
			});
			second = result.current.commitAll().then(() => {
				secondDone = true;
			});
			await Promise.resolve();
		});
		expect(commit).toHaveBeenCalledTimes(1);
		expect(firstDone).toBe(false);
		expect(secondDone).toBe(false);

		await act(async () => {
			release?.();
			await first;
			await second;
		});
		expect(firstDone).toBe(true);
		expect(secondDone).toBe(true);
	});

	it('rejects every waiter when the delete fails', async () => {
		let rejectCommit: ((error: Error) => void) | undefined;
		const gate = new Promise<void>((_resolve, reject) => {
			rejectCommit = reject;
		});
		const { result } = renderHook(() => useDeferredDeletes());
		act(() =>
			result.current.defer({
				key: 'section-1',
				message: 'Đã xóa mục "Mục 1"',
				commit: () => gate,
				restore: vi.fn(),
			}),
		);

		const first = result.current.commitAll();
		const second = result.current.commitAll();
		const seen = Promise.allSettled([first, second]);
		await act(async () => {
			rejectCommit?.(new Error('máy chủ từ chối'));
			await seen;
		});
		await expect(first).rejects.toThrow('máy chủ từ chối');
		await expect(second).rejects.toThrow('máy chủ từ chối');
	});

	it('sends an earlier delete before the next one and still reports its failure', async () => {
		let release: (() => void) | undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const commitA = vi.fn(() => gate);
		const commitB = vi.fn();
		const { result } = renderHook(() => useDeferredDeletes());
		act(() =>
			result.current.defer({
				key: 'section-a',
				message: 'Đã xóa mục "A"',
				commit: commitA,
				restore: vi.fn(),
			}),
		);
		act(() =>
			result.current.defer({
				key: 'section-b',
				message: 'Đã xóa mục "B"',
				commit: commitB,
				restore: vi.fn(),
			}),
		);
		expect(commitA).toHaveBeenCalledTimes(1);
		expect(commitB).not.toHaveBeenCalled();

		let done = false;
		const pending = result.current.commitAll().then(() => {
			done = true;
		});
		await act(async () => {
			await Promise.resolve();
		});
		expect(done).toBe(false);
		expect(commitB).not.toHaveBeenCalled();

		await act(async () => {
			release?.();
			await pending;
		});
		expect(commitB).toHaveBeenCalledTimes(1);
		expect(done).toBe(true);
	});

	it('does not leave a rejected delete unhandled when another delete replaces it', async () => {
		const { result } = renderHook(() => useDeferredDeletes());
		act(() =>
			result.current.defer({
				key: 'section-a',
				message: 'Đã xóa mục "A"',
				commit: () => Promise.reject(new Error('xóa A lỗi')),
				restore: vi.fn(),
			}),
		);
		act(() =>
			result.current.defer({
				key: 'section-b',
				message: 'Đã xóa mục "B"',
				commit: vi.fn(),
				restore: vi.fn(),
			}),
		);

		await expect(result.current.commitAll()).rejects.toThrow('xóa A lỗi');
	});
});

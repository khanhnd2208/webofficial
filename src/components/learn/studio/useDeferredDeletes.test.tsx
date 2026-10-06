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
});

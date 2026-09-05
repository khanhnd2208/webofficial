import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TeachingWorkspacePending, useTeachingWorkspacePending } from './TeachingWorkspacePending';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push }),
	useSearchParams: () => new URLSearchParams(),
}));
const wrapper = ({ children }: { children: ReactNode }) => (
	<TeachingWorkspacePending>{children}</TeachingWorkspacePending>
);

describe('date saves before tab navigation', () => {
	it('keeps blocking a failed date, then navigates on the first click after a successful retry', async () => {
		push.mockClear();
		const { result } = renderHook(useTeachingWorkspacePending, { wrapper });
		await act(async () => {
			result.current!.holdUntil(Promise.reject(new Error('offline')), 'date:1');
		});
		await act(async () => {
			result.current!.navigate('/class?tab=cp');
		});
		await act(async () => {
			result.current!.navigate('/class?tab=cp');
		});
		expect(push).not.toHaveBeenCalled();
		await act(async () => {
			result.current!.holdUntil(Promise.resolve(), 'date:1');
			result.current!.navigate('/class?tab=cp');
		});
		expect(push).toHaveBeenCalledWith('/class?tab=cp');
	});
	it('does not let another date success erase a failed date', async () => {
		push.mockClear();
		const { result } = renderHook(useTeachingWorkspacePending, { wrapper });
		await act(async () => {
			result.current!.holdUntil(Promise.reject(new Error('offline')), 'date:1');
			result.current!.holdUntil(Promise.resolve(), 'date:2');
			result.current!.navigate('/class?tab=cp');
		});
		expect(push).not.toHaveBeenCalled();
	});
	it('waits for a newer retry that arrives during navigation', async () => {
		push.mockClear();
		const { result } = renderHook(useTeachingWorkspacePending, { wrapper });
		let fail!: (reason: Error) => void;
		const original = new Promise((_, reject) => {
			fail = reject;
		});
		let complete!: () => void;
		const retry = new Promise<void>((resolve) => {
			complete = resolve;
		});
		await act(async () => {
			result.current!.holdUntil(original, 'date:1');
			result.current!.navigate('/class?tab=cp');
			result.current!.holdUntil(retry, 'date:1');
			fail(new Error('offline'));
		});
		expect(push).not.toHaveBeenCalled();
		await act(async () => {
			complete();
		});
		expect(push).toHaveBeenCalledWith('/class?tab=cp');
	});
});

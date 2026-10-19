'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import StudioToast from './StudioToast';

export type DeferredDelete = {
	key: string;
	message: string;
	restore: () => void;
	commit: (options?: { keepalive?: boolean }) => void | Promise<void>;
};

/** A section delete that did not reach the server. Callers must stop and let the user retry. */
export class StudioDeleteError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'StudioDeleteError';
	}
}

function adopt(result: void | Promise<void>): Promise<void> {
	return Promise.resolve(result).then(() => undefined);
}

/**
 * Hide a delete immediately and send it after the toast window.
 * A newer delete, a structural edit, navigation, or pagehide sends it early.
 * `commitAll` waits for every delete that has started, including one already on the network.
 */
export function useDeferredDeletes() {
	const pending = useRef<DeferredDelete | null>(null);
	const inflight = useRef<Promise<void>[]>([]);
	const [message, setMessage] = useState<string | null>(null);

	const track = useCallback((run: Promise<void>) => {
		inflight.current.push(run);
		void run.then(
			() => {
				inflight.current = inflight.current.filter((job) => job !== run);
			},
			() => {
				inflight.current = inflight.current.filter((job) => job !== run);
			},
		);
		return run;
	}, []);

	const enqueue = useCallback(
		(item: DeferredDelete, options?: { keepalive?: boolean }) => {
			const earlier = inflight.current.slice();
			// An empty queue starts `commit` now, so pagehide can still send `keepalive`.
			const run =
				earlier.length === 0
					? adopt(item.commit(options))
					: Promise.allSettled(earlier).then(() => adopt(item.commit(options)));
			return track(run);
		},
		[track],
	);

	const commitAll = useCallback(
		async (options?: { keepalive?: boolean }) => {
			const failures: unknown[] = [];
			for (;;) {
				const item = pending.current;
				if (item) {
					pending.current = null;
					setMessage(null);
					void enqueue(item, options).catch(() => undefined);
				}
				const running = inflight.current.slice();
				if (!running.length) break;
				const results = await Promise.allSettled(running);
				for (const result of results) {
					if (result.status === 'rejected') failures.push(result.reason);
				}
				if (!pending.current && inflight.current.length === 0) break;
			}
			const reason = failures[0];
			if (reason instanceof Error) throw reason;
			if (reason !== undefined) throw new StudioDeleteError('Không xóa được mục. Hãy thử lại.');
		},
		[enqueue],
	);

	const defer = useCallback(
		(item: DeferredDelete) => {
			const previous = pending.current;
			pending.current = item;
			setMessage(item.message);
			if (previous && previous.key !== item.key) void enqueue(previous).catch(() => undefined);
		},
		[enqueue],
	);

	const undo = useCallback(() => {
		const item = pending.current;
		if (!item) return;
		pending.current = null;
		setMessage(null);
		item.restore();
	}, []);

	useEffect(() => {
		const onHide = () => {
			const item = pending.current;
			if (!item) return;
			pending.current = null;
			void enqueue(item, { keepalive: true }).catch(() => undefined);
		};
		window.addEventListener('pagehide', onHide);
		return () => window.removeEventListener('pagehide', onHide);
	}, [enqueue]);

	return { defer, undo, commitAll, message };
}

/** Hide one question immediately. The parent list changes only when the undo window ends. */
export function useQuestionDelete<T extends { id: string }>(
	items: T[],
	apply: (next: T[]) => void,
) {
	const deletes = useDeferredDeletes();
	const [pendingId, setPendingId] = useState<string | null>(null);
	const itemsRef = useRef(items);
	const applyRef = useRef(apply);
	useEffect(() => {
		itemsRef.current = items;
		applyRef.current = apply;
	}, [apply, items]);
	const visible = items.filter((item) => item.id !== pendingId);

	function removeAt(index: number) {
		const item = visible[index];
		if (!item) return;
		setPendingId(item.id);
		deletes.defer({
			key: item.id,
			message: `Đã xóa câu ${index + 1}`,
			restore: () => setPendingId((current) => (current === item.id ? null : current)),
			commit: () => {
				setPendingId((current) => (current === item.id ? null : current));
				applyRef.current(itemsRef.current.filter((candidate) => candidate.id !== item.id));
			},
		});
	}

	const toast = (
		<StudioToast message={deletes.message} onAction={deletes.undo} onClose={deletes.commitAll} />
	);

	return { visible, removeAt, toast };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import StudioToast from './StudioToast';

export type DeferredDelete = {
	key: string;
	message: string;
	restore: () => void;
	commit: (options?: { keepalive?: boolean }) => void | Promise<void>;
};

/**
 * Hide a delete immediately and send it after the toast window.
 * A newer delete, a structural edit, navigation, or pagehide sends it early.
 */
export function useDeferredDeletes() {
	const current = useRef<DeferredDelete | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const commitCurrent = useCallback(async (options?: { keepalive?: boolean }) => {
		const item = current.current;
		if (!item) return;
		current.current = null;
		setMessage(null);
		await item.commit(options);
	}, []);

	const defer = useCallback((item: DeferredDelete) => {
		const previous = current.current;
		current.current = item;
		setMessage(item.message);
		if (previous && previous.key !== item.key) void previous.commit();
	}, []);

	const undo = useCallback(() => {
		const item = current.current;
		if (!item) return;
		current.current = null;
		setMessage(null);
		item.restore();
	}, []);

	useEffect(() => {
		const onHide = () => {
			const item = current.current;
			if (!item) return;
			current.current = null;
			void item.commit({ keepalive: true });
		};
		window.addEventListener('pagehide', onHide);
		return () => window.removeEventListener('pagehide', onHide);
	}, []);

	return { defer, undo, commitAll: commitCurrent, message };
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

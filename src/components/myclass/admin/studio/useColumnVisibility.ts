'use client';

import { useState } from 'react';

const STORAGE_PREFIX = 'mc-studio-columns:';

function readStored(tableId: string, fallback: Record<string, boolean>) {
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${tableId}`);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw) as Record<string, boolean>;
		return parsed && typeof parsed === 'object' ? parsed : fallback;
	} catch {
		return fallback;
	}
}

export function useColumnVisibility(tableId: string, initial: Record<string, boolean> = {}) {
	const [visibility, setVisibilityState] = useState<Record<string, boolean>>(() =>
		readStored(tableId, initial),
	);

	function setVisibility(
		updater:
			| Record<string, boolean>
			| ((current: Record<string, boolean>) => Record<string, boolean>),
	) {
		setVisibilityState((current) => {
			const next = typeof updater === 'function' ? updater(current) : updater;
			try {
				window.localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(next));
			} catch {
				// Ignore quota / private-mode failures.
			}
			return next;
		});
	}

	return [visibility, setVisibility] as const;
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { adminFetch } from '@/lib/admin/client';

import { classifySaveError, retryDelayMs } from './saveErrors';

export type SaveStatus =
	| 'saved'
	| 'pending'
	| 'saving'
	| 'retrying'
	| 'invalid'
	| 'conflict'
	| 'error';

export type SaveIssues = Record<string, Record<string, string>>;

interface PendingPatch {
	url: string;
	body: Record<string, unknown>;
	/** Revision of each field. A successful save drops a field only when this still matches. */
	revs: Record<string, number>;
	/** Revisions that failed validation and must change before they are sent again. */
	held: Record<string, number>;
	conflict: boolean;
	stopped: boolean;
}

interface Snapshot {
	status: SaveStatus;
	error: string | null;
	retryInMs: number | null;
	issues: SaveIssues;
	issueCount: number;
	conflictKey: string | null;
}

const DEBOUNCE_MS = 900;

const editorFlushes = new Set<() => void>();

/** LearnRichEditor registers here so Ctrl/Cmd+S and Lưu flush pending markdown first. */
export function registerEditorFlush(flush: () => void) {
	editorFlushes.add(flush);
	return () => {
		editorFlushes.delete(flush);
	};
}

function flushEditors() {
	for (const flush of editorFlushes) flush();
}

/** Flush editors that have not yet reported their latest markdown. */
export function flushRegisteredEditors() {
	flushEditors();
}

function sameValue(left: unknown, right: unknown): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

function sendableBody(item: PendingPatch): Record<string, unknown> | null {
	const body: Record<string, unknown> = {};
	for (const [field, value] of Object.entries(item.body)) {
		if (item.held[field] === item.revs[field]) continue;
		body[field] = value;
	}
	return Object.keys(body).length ? body : null;
}

function emptySnapshot(): Snapshot {
	return {
		status: 'saved',
		error: null,
		retryInMs: null,
		issues: {},
		issueCount: 0,
		conflictKey: null,
	};
}

/**
 * Debounced PATCH queue keyed by entity.
 * Retryable failures back off; invalid fields stay held until the user edits them.
 */
export interface StudioSaverOptions {
	onSaved?: (key: string, data: unknown) => void;
	/** Version the server last returned for this key, sent as `baseUpdatedAt` with each PATCH. */
	baseFor?: (key: string) => string | undefined;
}

export function useStudioSaver({ onSaved, baseFor }: StudioSaverOptions = {}) {
	const pending = useRef(new Map<string, PendingPatch>());
	const clientIssues = useRef(new Map<string, Record<string, string>>());
	const serverIssues = useRef(new Map<string, Record<string, string>>());
	const conflictMessage = useRef<string | null>(null);
	const stopMessage = useRef<string | null>(null);
	const revision = useRef(1);
	const inflight = useRef<Promise<void> | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const retryDue = useRef<number | null>(null);
	const retryAttempt = useRef(0);
	const onSavedRef = useRef(onSaved);
	const baseForRef = useRef(baseFor);
	const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot);

	useEffect(() => {
		onSavedRef.current = onSaved;
		baseForRef.current = baseFor;
	}, [onSaved, baseFor]);

	const publish = useCallback(() => {
		const issues: SaveIssues = {};
		const absorb = (source: Map<string, Record<string, string>>) => {
			for (const [key, fields] of source) {
				if (!Object.keys(fields).length) continue;
				issues[key] = { ...(issues[key] ?? {}), ...fields };
			}
		};
		absorb(clientIssues.current);
		absorb(serverIssues.current);

		let issueCount = 0;
		for (const fields of Object.values(issues)) issueCount += Object.keys(fields).length;

		const entries = [...pending.current.values()];
		const sendable = entries.some((item) => !item.conflict && !item.stopped && sendableBody(item));
		const conflictEntry = [...pending.current.entries()].find(([, item]) => item.conflict);
		const conflict = Boolean(conflictEntry);
		const stopped = entries.some((item) => item.stopped);
		const retrying = retryTimer.current !== null;

		let status: SaveStatus = 'saved';
		if (retrying) status = 'retrying';
		else if (conflict) status = 'conflict';
		else if (stopped) status = 'error';
		else if (issueCount > 0) status = 'invalid';
		else if (sendable) status = 'pending';

		const error =
			status === 'conflict'
				? (conflictMessage.current ?? 'Mục vừa được sửa ở nơi khác')
				: status === 'error'
					? (stopMessage.current ?? 'Không lưu được')
					: null;

		setSnapshot({
			status,
			error,
			retryInMs: retryDue.current === null ? null : Math.max(0, retryDue.current - Date.now()),
			issues,
			issueCount,
			conflictKey: conflictEntry?.[0] ?? null,
		});
	}, []);

	const clearRetry = useCallback(() => {
		if (retryTimer.current) clearTimeout(retryTimer.current);
		retryTimer.current = null;
		retryDue.current = null;
	}, []);

	const flushHolder = useRef<() => Promise<{ ok: boolean }>>(async () => ({ ok: true }));

	const flush = useCallback(async (): Promise<{ ok: boolean }> => {
		flushEditors();
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		clearRetry();
		if (inflight.current) await inflight.current;

		let retryable = false;
		const run = (async () => {
			for (let round = 0; round < 8; round += 1) {
				const batch = [...pending.current.entries()].filter(
					([, item]) => !item.conflict && !item.stopped && sendableBody(item),
				);
				if (!batch.length) break;

				setSnapshot((current) => ({ ...current, status: 'saving', retryInMs: null }));
				let blocked = false;

				for (const [key, item] of batch) {
					const body = sendableBody(item);
					if (!body) continue;
					const sentRevs = { ...item.revs };
					const latest = pending.current.get(key) ?? item;
					try {
						// Read the version at send time: the previous save may have just moved it.
						const base = baseForRef.current?.(key);
						const saved = await adminFetch(latest.url, {
							method: 'PATCH',
							body: JSON.stringify(base ? { ...body, baseUpdatedAt: base } : body),
						});
						onSavedRef.current?.(key, saved);
						const after = pending.current.get(key);
						if (!after) continue;
						const nextBody = { ...after.body };
						const nextRevs = { ...after.revs };
						const messages = { ...(serverIssues.current.get(key) ?? {}) };
						for (const field of Object.keys(body)) {
							if (after.revs[field] === sentRevs[field]) {
								delete nextBody[field];
								delete nextRevs[field];
								delete messages[field];
							}
						}
						if (Object.keys(messages).length) serverIssues.current.set(key, messages);
						else serverIssues.current.delete(key);
						const held = Object.fromEntries(
							Object.entries(after.held).filter(([field]) => field in nextBody),
						);
						if (!Object.keys(nextBody).length) pending.current.delete(key);
						else {
							pending.current.set(key, {
								...after,
								body: nextBody,
								revs: nextRevs,
								held,
								stopped: false,
							});
						}
						retryAttempt.current = 0;
					} catch (err) {
						const classified = classifySaveError(err);
						const after = pending.current.get(key) ?? latest;
						if (classified.action === 'retry') {
							retryable = true;
							blocked = true;
						} else if (classified.action === 'hold') {
							const fields = classified.fields.length ? classified.fields : Object.keys(body);
							const held = { ...after.held };
							const messages = { ...(serverIssues.current.get(key) ?? {}) };
							for (const field of fields) {
								if (sentRevs[field] !== undefined) held[field] = sentRevs[field];
								messages[field] = classified.message;
							}
							pending.current.set(key, { ...after, held });
							serverIssues.current.set(key, messages);
							blocked = true;
						} else if (classified.action === 'drop') {
							pending.current.delete(key);
							serverIssues.current.delete(key);
						} else if (classified.action === 'conflict') {
							pending.current.set(key, { ...after, conflict: true });
							conflictMessage.current = classified.message;
							blocked = true;
						} else {
							pending.current.set(key, { ...after, stopped: true });
							stopMessage.current = classified.message;
							blocked = true;
						}
					}
				}
				if (blocked) break;
			}
		})();

		inflight.current = run;
		await run;
		inflight.current = null;

		if (retryable) {
			clearRetry();
			const delay = retryDelayMs(retryAttempt.current);
			retryAttempt.current += 1;
			retryDue.current = Date.now() + delay;
			retryTimer.current = setTimeout(() => {
				retryTimer.current = null;
				retryDue.current = null;
				void flushHolder.current();
			}, delay);
			publish();
		} else publish();

		const dirty =
			retryable ||
			[...pending.current.values()].some(
				(item) =>
					item.conflict || item.stopped || sendableBody(item) || Object.keys(item.held).length,
			) ||
			[...clientIssues.current.values()].some((fields) => Object.keys(fields).length > 0);
		return { ok: !dirty };
	}, [clearRetry, flushHolder, publish]);

	useEffect(() => {
		flushHolder.current = flush;
	}, [flush]);

	const queue = useCallback(
		(key: string, url: string, patch: Record<string, unknown>) => {
			const current = pending.current.get(key);
			const body = { ...(current?.body ?? {}), ...patch };
			const revs = { ...(current?.revs ?? {}) };
			const held = { ...(current?.held ?? {}) };
			const messages = { ...(serverIssues.current.get(key) ?? {}) };
			for (const field of Object.keys(patch)) {
				const unchanged =
					current !== undefined &&
					field in current.body &&
					sameValue(current.body[field], patch[field]);
				if (unchanged) continue;
				const rev = revision.current;
				revision.current += 1;
				revs[field] = rev;
				delete held[field];
				delete messages[field];
			}
			if (Object.keys(messages).length) serverIssues.current.set(key, messages);
			else serverIssues.current.delete(key);
			// A conflict stays until the user picks a version; typing must not slip past it.
			pending.current.set(key, {
				url,
				body,
				revs,
				held,
				conflict: current?.conflict ?? false,
				stopped: false,
			});
			stopMessage.current = null;
			publish();
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => void flushHolder.current(), DEBOUNCE_MS);
		},
		[publish],
	);

	const syncIssues = useCallback(
		(key: string, touched: string[], errors: Record<string, string>) => {
			const current = { ...(clientIssues.current.get(key) ?? {}) };
			for (const field of touched) {
				if (errors[field]) current[field] = errors[field];
				else delete current[field];
			}
			if (Object.keys(current).length) clientIssues.current.set(key, current);
			else clientIssues.current.delete(key);
			publish();
		},
		[publish],
	);

	const clearInvalid = useCallback(
		(key: string, fields?: string[]) => {
			if (!fields) clientIssues.current.delete(key);
			else {
				const current = { ...(clientIssues.current.get(key) ?? {}) };
				for (const field of fields) delete current[field];
				if (Object.keys(current).length) clientIssues.current.set(key, current);
				else clientIssues.current.delete(key);
			}
			publish();
		},
		[publish],
	);

	useEffect(() => {
		const warn = (event: BeforeUnloadEvent) => {
			// Pull in text the editor is still holding in its own short debounce.
			flushEditors();
			const unsaved =
				pending.current.size > 0 ||
				inflight.current !== null ||
				[...clientIssues.current.values()].some((fields) => Object.keys(fields).length > 0);
			if (unsaved) event.preventDefault();
		};
		const retryIfWaiting = () => {
			if (retryTimer.current) void flushHolder.current();
		};
		const onVisible = () => {
			if (document.visibilityState === 'visible') retryIfWaiting();
		};
		window.addEventListener('beforeunload', warn);
		window.addEventListener('online', retryIfWaiting);
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			window.removeEventListener('beforeunload', warn);
			window.removeEventListener('online', retryIfWaiting);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, []);

	useEffect(() => {
		if (snapshot.status !== 'retrying') return;
		const id = setInterval(() => publish(), 250);
		return () => clearInterval(id);
	}, [publish, snapshot.status]);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
			if (retryTimer.current) clearTimeout(retryTimer.current);
		},
		[],
	);

	const drop = useCallback(
		(key: string) => {
			pending.current.delete(key);
			serverIssues.current.delete(key);
			clientIssues.current.delete(key);
			if (![...pending.current.values()].some((item) => item.conflict))
				conflictMessage.current = null;
			publish();
		},
		[publish],
	);

	/** Resume saving after the caller has moved this key's version to the server's latest. */
	const releaseConflict = useCallback(
		(key: string) => {
			const item = pending.current.get(key);
			if (!item) return;
			pending.current.set(key, { ...item, conflict: false });
			conflictMessage.current = null;
			publish();
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => void flushHolder.current(), DEBOUNCE_MS);
		},
		[publish],
	);

	return {
		status: snapshot.status,
		error: snapshot.error,
		retryInMs: snapshot.retryInMs,
		issues: snapshot.issues,
		issueCount: snapshot.issueCount,
		conflictKey: snapshot.conflictKey,
		queue,
		flush,
		syncIssues,
		clearInvalid,
		drop,
		releaseConflict,
	};
}

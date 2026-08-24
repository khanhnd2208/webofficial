'use client';

import { progressQueueKey } from '../domain/progressKeys';
import { resolveLearnerState, seedsFromCourseOutline, type MyClassLearnerState } from '../domain/learnerState';
import type { MyClassCourseDetail } from '../types';

export type QueueItem = {
	courseId: string;
	knowledgeUnitId: string;
	courseSlug: string;
	kuSlug: string;
	lessonSlug?: string;
	sectionId?: string;
	attempts: number;
	nextAt: number;
	scope?: string;
};

export type FlushResult = {
	byCourseId: Record<string, MyClassLearnerState>;
	pendingByCourseId: Record<string, number>;
	permanentErrors: Array<{ courseId: string; knowledgeUnitId: string; message: string }>;
};

const DEFAULT_SCOPE = 'anonymous';
const MAX_ATTEMPTS = 6;
const BASE_DELAY_MS = 1500;
let storageScope = DEFAULT_SCOPE;
let migratedLegacyQueue = false;

function queueKey() { return `my-class:${storageScope}:complete-queue`; }
function pendingDoneKey() { return `my-class:${storageScope}:pending-done`; }

function readJson<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch { return fallback; }
}

function writeJson(key: string, value: unknown) {
	try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

export function setStorageScope(scope: string) {
	storageScope = scope || DEFAULT_SCOPE;
	try { localStorage.setItem('my-class:storage-scope', storageScope); } catch { /* private mode */ }
	if (migratedLegacyQueue || typeof window === 'undefined') return;
	migratedLegacyQueue = true;
	const legacy = readJson<QueueItem[]>('my-class:complete-queue', []);
	if (legacy.length && !readJson<QueueItem[]>(queueKey(), []).length) writeJson(queueKey(), legacy.map((item) => ({ ...item, scope: storageScope })));
	try { localStorage.removeItem('my-class:complete-queue'); } catch { /* private mode */ }
}

export function getStorageScope() { return storageScope; }

/** Pending optimistic ids only; server-confirmed completion is never kept here. */
export function readLocalCompleted(courseId: string): string[] {
	return readJson<Record<string, string[]>>(pendingDoneKey(), {})[courseId] ?? [];
}

/** Compatibility shim for callers/tests. New UI should enqueue instead. */
export function writeLocalCompleted(courseId: string, unitIds: string[]) {
	const all = readJson<Record<string, string[]>>(pendingDoneKey(), {});
	all[courseId] = [...new Set(unitIds)];
	writeJson(pendingDoneKey(), all);
}

function clearPendingCompleted(courseId: string, unitId: string) {
	const all = readJson<Record<string, string[]>>(pendingDoneKey(), {});
	all[courseId] = (all[courseId] ?? []).filter((id) => id !== unitId);
	if (!all[courseId]?.length) delete all[courseId];
	writeJson(pendingDoneKey(), all);
}

export function readQueue(): QueueItem[] {
	return readJson<QueueItem[]>(queueKey(), []).map((item) => ({ ...item, scope: item.scope ?? storageScope }));
}

function writeQueue(items: QueueItem[]) { writeJson(queueKey(), items); }

export function enqueueComplete(item: Omit<QueueItem, 'attempts' | 'nextAt' | 'scope'>) {
	const key = progressQueueKey(item.courseId, item.knowledgeUnitId);
	const queue = readQueue().filter((row) => progressQueueKey(row.courseId, row.knowledgeUnitId) !== key);
	queue.push({ ...item, scope: storageScope, attempts: 0, nextAt: Date.now() });
	writeQueue(queue);
}

export function dequeueComplete(courseId: string, knowledgeUnitId: string) {
	const key = progressQueueKey(courseId, knowledgeUnitId);
	writeQueue(readQueue().filter((row) => progressQueueKey(row.courseId, row.knowledgeUnitId) !== key));
	clearPendingCompleted(courseId, knowledgeUnitId);
}

export function pendingCount() { return readQueue().length; }

export function mergeLearnerState(course: MyClassCourseDetail, server: MyClassLearnerState | null, localCompleted: string[], openedUnitId?: string | null) {
	const seeds = seedsFromCourseOutline(course);
	const completedUnitIds = [...new Set([...(server?.completedUnitIds ?? []), ...localCompleted])];
	return resolveLearnerState({ seeds, completedUnitIds, openedUnitId });
}

type CompleteLink = { href: string; courseSlug: string; lessonSlug: string; sectionId: string; kuSlug: string; knowledgeUnitId: string; title: string };
type CompleteResult = { learnerState: MyClassLearnerState; transition?: { openItem: CompleteLink | null }; next?: CompleteLink | null };

export async function postComplete(item: { courseSlug: string; kuSlug: string; lessonSlug?: string; sectionId?: string }, retried = false): Promise<{ ok: true; data: CompleteResult } | { ok: false; retryable: boolean; status: number; message: string }> {
	try {
		const response = await fetch(`/api/my-class/courses/${item.courseSlug}/knowledge/${item.kuSlug}/complete`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonSlug: item.lessonSlug, sectionId: item.sectionId }),
		});
		const json = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: CompleteResult; error?: string };
		if (response.status === 401 && !retried) {
			const bootstrap = await fetch('/api/my-class/actor/bootstrap', { method: 'POST' }).then((res) => res.json()).catch(() => null) as { data?: { storageScope?: string } } | null;
			if (bootstrap?.data?.storageScope) setStorageScope(bootstrap.data.storageScope);
			return postComplete(item, true);
		}
		if (!response.ok || !json.ok || !json.data) {
			const retryable = response.status === 0 || response.status === 408 || response.status === 429 || response.status >= 500;
			return { ok: false, retryable, status: response.status, message: json.error ?? 'Không thể đồng bộ tiến độ' };
		}
		return { ok: true, data: json.data };
	} catch {
		return { ok: false, retryable: true, status: 0, message: 'Mất kết nối mạng' };
	}
}

export async function flushCompleteQueue(): Promise<FlushResult> {
	const now = Date.now();
	const byCourseId: Record<string, MyClassLearnerState> = {};
	const pendingByCourseId: Record<string, number> = {};
	const permanentErrors: FlushResult['permanentErrors'] = [];
	const remaining: QueueItem[] = [];
	for (const item of readQueue()) {
		if (item.nextAt > now) { remaining.push(item); continue; }
		const result = await postComplete(item);
		if (result.ok) {
			byCourseId[item.courseId] = result.data.learnerState;
			clearPendingCompleted(item.courseId, item.knowledgeUnitId);
			continue;
		}
		if (!result.retryable) {
			clearPendingCompleted(item.courseId, item.knowledgeUnitId);
			permanentErrors.push({ courseId: item.courseId, knowledgeUnitId: item.knowledgeUnitId, message: result.message });
			continue;
		}
		const attempts = item.attempts + 1;
		remaining.push({ ...item, attempts, nextAt: now + Math.min(60_000, BASE_DELAY_MS * 2 ** Math.min(attempts, MAX_ATTEMPTS)) });
	}
	writeQueue(remaining);
	for (const item of remaining) pendingByCourseId[item.courseId] = (pendingByCourseId[item.courseId] ?? 0) + 1;
	return { byCourseId, pendingByCourseId, permanentErrors };
}

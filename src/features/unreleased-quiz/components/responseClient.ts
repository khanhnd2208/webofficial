'use client';

import type { Answers } from '../domain/quiz';

const STORAGE_KEY = 'unreleased-quiz-respondent';

let memoryId: string | null = null;
let lastResponseId: string | null = null;

function randomId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * A random id kept in this browser so a retake is not counted as a new person.
 * It is not linked to a name, email or account. Blocked storage falls back to
 * an id that lives only for this page view.
 */
export function respondentId(): string {
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (stored) return stored;
		const created = randomId();
		window.localStorage.setItem(STORAGE_KEY, created);
		return created;
	} catch {
		memoryId ??= randomId();
		return memoryId;
	}
}

/** Saves a finished run. Failure is silent: the result page never depends on it. */
export async function saveResponse(answers: Answers): Promise<void> {
	lastResponseId = null;
	try {
		const response = await fetch('/api/unreleased-quiz/responses', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ respondentId: respondentId(), answers }),
		});
		if (!response.ok) return;
		const body = (await response.json()) as { ok: boolean; data?: { id: string } };
		lastResponseId = body.data?.id ?? null;
	} catch {
		// Offline or blocked: the person still sees their result.
	}
}

/** Marks that the saved run led to a click on "Đăng ký". Survives the tab opening the form. */
export function noteRegisterClick(): void {
	if (!lastResponseId) return;
	const url = `/api/unreleased-quiz/responses/${lastResponseId}/register`;
	const body = JSON.stringify({ respondentId: respondentId() });
	try {
		if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return;
	} catch {
		// Fall through to fetch.
	}
	void fetch(url, { method: 'POST', body, keepalive: true }).catch(() => undefined);
}

'use client';

import { useCallback, useEffect, useState } from 'react';

function storageKey(courseId: string) {
	return `ln-studio-open:${courseId}`;
}

function readStored(courseId: string): string[] | null {
	try {
		const raw = window.localStorage.getItem(storageKey(courseId));
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		return Array.isArray(parsed)
			? parsed.filter((id): id is string => typeof id === 'string')
			: null;
	} catch {
		return null;
	}
}

function writeStored(courseId: string, ids: Set<string>) {
	try {
		window.localStorage.setItem(storageKey(courseId), JSON.stringify([...ids]));
	} catch {
		// Private mode or blocked storage: the outline still works, it just forgets.
	}
}

/**
 * Which lessons are expanded in the studio outline. Remembered per course in this browser;
 * the first visit opens only the lesson being edited. Selecting a section always opens its lesson.
 */
export function useOutlineOpen(courseId: string, activeLessonId: string | null) {
	const [open, setOpen] = useState<Set<string>>(
		() => new Set(activeLessonId ? [activeLessonId] : []),
	);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const stored = readStored(courseId);
		// Storage is only readable after hydration, so the server render shows the default.
		if (stored) setOpen(new Set([...stored, ...(activeLessonId ? [activeLessonId] : [])]));
		setLoaded(true);
		// Load once per course; later selections are handled below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [courseId]);

	const [seenActive, setSeenActive] = useState(activeLessonId);
	if (activeLessonId !== seenActive) {
		setSeenActive(activeLessonId);
		if (activeLessonId && !open.has(activeLessonId)) setOpen(new Set([...open, activeLessonId]));
	}

	useEffect(() => {
		if (loaded) writeStored(courseId, open);
	}, [courseId, loaded, open]);

	const toggle = useCallback((lessonId: string) => {
		setOpen((current) => {
			const next = new Set(current);
			if (next.has(lessonId)) next.delete(lessonId);
			else next.add(lessonId);
			return next;
		});
	}, []);

	const setAll = useCallback((lessonIds: string[]) => setOpen(new Set(lessonIds)), []);

	return { open, toggle, setAll };
}

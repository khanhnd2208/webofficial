'use client';

import { useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

import type {
	LearnSectionKind,
	LearnStudioLesson,
	LearnStudioSection,
} from '@/features/learn/types';
import { AdminApiError, adminFetch } from '@/lib/admin/client';

import { applyOrder, copyTitle, insertAfter, outlineOrder, sectionCopyBody } from './outlineOps';
import { findSection } from './sectionPatch';
import type { StudioConfirmRequest } from './StudioConfirm';
import type { useDeferredDeletes } from './useDeferredDeletes';

interface StructureDeps {
	courseId: string;
	lessons: LearnStudioLesson[];
	lessonsRef: RefObject<LearnStudioLesson[]>;
	setLessons: Dispatch<SetStateAction<LearnStudioLesson[]>>;
	selectedId: string | null;
	select: (id: string | null) => void;
	flush: () => Promise<{ ok: boolean }>;
	deletes: ReturnType<typeof useDeferredDeletes>;
	confirm: (request: StudioConfirmRequest) => Promise<boolean>;
	/** Record the server version of sections that just came back from the API. */
	remember: (sections: LearnStudioSection[]) => void;
}

function message(err: unknown, fallback: string) {
	return err instanceof Error ? err.message : fallback;
}

/** Outline changes: saved right away, after pending deletes and text edits are flushed. */
export function useStudioStructure({
	courseId,
	lessons,
	lessonsRef,
	setLessons,
	selectedId,
	select,
	flush,
	deletes,
	confirm,
	remember,
}: StructureDeps) {
	const [actionError, setActionError] = useState<string | null>(null);
	const [outlineConflict, setOutlineConflict] = useState(false);

	async function act<T>(action: () => Promise<T>): Promise<T | undefined> {
		setActionError(null);
		try {
			await deletes.commitAll();
			const saved = await flush();
			if (!saved.ok) {
				setActionError('Chưa lưu được nội dung');
				return undefined;
			}
			return await action();
		} catch (err) {
			if (err instanceof AdminApiError && err.status === 409) {
				setOutlineConflict(true);
				return undefined;
			}
			setActionError(message(err, 'Thao tác không thành công'));
			return undefined;
		}
	}

	async function saveOutline(next: LearnStudioLesson[]) {
		const previous = outlineOrder(lessonsRef.current);
		setLessons(next);
		const ok = await act(() =>
			adminFetch(`/api/admin/learn/courses/${courseId}/outline`, {
				method: 'PUT',
				body: JSON.stringify({ lessons: outlineOrder(next) }),
			}),
		);
		// Undo only the move; text typed while the request was out stays.
		if (ok === undefined) setLessons((current) => applyOrder(current, previous));
	}

	function reorderLessons(ids: string[]) {
		const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
		void saveOutline(ids.flatMap((id) => byId.get(id) ?? []));
	}

	function reorderSections(lessonId: string, ids: string[]) {
		void saveOutline(
			lessons.map((lesson) => {
				if (lesson.id !== lessonId) return lesson;
				const byId = new Map(lesson.sections.map((item) => [item.id, item]));
				return { ...lesson, sections: ids.flatMap((id) => byId.get(id) ?? []) };
			}),
		);
	}

	function placeSection(sectionId: string, lessonId: string, beforeId: string | null) {
		const moving = findSection(lessons, sectionId);
		if (!moving) return;
		const stripped = lessons.map((lesson) => ({
			...lesson,
			sections: lesson.sections.filter((item) => item.id !== sectionId),
		}));
		void saveOutline(
			stripped.map((lesson) => {
				if (lesson.id !== lessonId) return lesson;
				const sections = [...lesson.sections];
				const index = beforeId
					? sections.findIndex((item) => item.id === beforeId)
					: sections.length;
				sections.splice(index < 0 ? sections.length : index, 0, { ...moving, lessonId });
				return { ...lesson, sections };
			}),
		);
	}

	function moveSection(sectionId: string, lessonId: string) {
		const moving = findSection(lessons, sectionId);
		if (!moving || moving.lessonId === lessonId) return;
		placeSection(sectionId, lessonId, null);
	}

	async function addLesson() {
		const lesson = await act(() =>
			adminFetch<LearnStudioLesson>(`/api/admin/learn/courses/${courseId}/lessons`, {
				method: 'POST',
				body: JSON.stringify({ title: `Bài ${lessons.length + 1}` }),
			}),
		);
		if (!lesson) return;
		remember(lesson.sections);
		setLessons((current) => [...current, lesson]);
		select(lesson.sections[0]?.id ?? null);
	}

	async function addSection(lessonId: string, type: LearnSectionKind) {
		const created = await act(() =>
			adminFetch<LearnStudioSection>(`/api/admin/learn/lessons/${lessonId}/sections`, {
				method: 'POST',
				body: JSON.stringify({ type }),
			}),
		);
		if (!created) return;
		remember([created]);
		setLessons((current) =>
			current.map((lesson) =>
				lesson.id === lessonId ? { ...lesson, sections: [...lesson.sections, created] } : lesson,
			),
		);
		select(created.id);
	}

	/** Fill a section created by the API with a copy of `source`. */
	function fillCopy(targetId: string, source: LearnStudioSection, title?: string) {
		return adminFetch<LearnStudioSection>(`/api/admin/learn/sections/${targetId}?full=1`, {
			method: 'PATCH',
			body: JSON.stringify(sectionCopyBody(source, title)),
		});
	}

	async function duplicateSection(sectionId: string) {
		const source = findSection(lessonsRef.current, sectionId);
		if (!source) return;
		const copy = await act(async () => {
			const blank = await adminFetch<LearnStudioSection>(
				`/api/admin/learn/lessons/${source.lessonId}/sections`,
				{ method: 'POST', body: JSON.stringify({ type: source.type }) },
			);
			try {
				return await fillCopy(blank.id, source, copyTitle(source.title));
			} catch (err) {
				await adminFetch(`/api/admin/learn/sections/${blank.id}`, { method: 'DELETE' }).catch(
					() => undefined,
				);
				throw err;
			}
		});
		if (!copy) return;
		remember([copy]);
		const next = lessonsRef.current.map((lesson) =>
			lesson.id === source.lessonId
				? { ...lesson, sections: insertAfter(lesson.sections, source.id, copy) }
				: lesson,
		);
		select(copy.id);
		await saveOutline(next);
	}

	async function duplicateLesson(lessonId: string) {
		const source = lessonsRef.current.find((lesson) => lesson.id === lessonId);
		if (!source) return;
		const copy = await act(async () => {
			const lesson = await adminFetch<LearnStudioLesson>(
				`/api/admin/learn/courses/${courseId}/lessons`,
				{
					method: 'POST',
					body: JSON.stringify({
						title: copyTitle(source.title),
						description: source.description,
					}),
				},
			);
			if (!source.sections.length) return lesson;
			try {
				const sections: LearnStudioSection[] = [];
				for (const [index, section] of source.sections.entries()) {
					const targetId =
						index === 0 && lesson.sections[0]
							? lesson.sections[0].id
							: (
									await adminFetch<LearnStudioSection>(
										`/api/admin/learn/lessons/${lesson.id}/sections`,
										{ method: 'POST', body: JSON.stringify({ type: section.type }) },
									)
								).id;
					sections.push(await fillCopy(targetId, section));
				}
				return { ...lesson, sections };
			} catch (err) {
				await adminFetch(`/api/admin/learn/lessons/${lesson.id}`, { method: 'DELETE' }).catch(
					() => undefined,
				);
				throw err;
			}
		});
		if (!copy) return;
		remember(copy.sections);
		select(copy.sections[0]?.id ?? null);
		await saveOutline(insertAfter(lessonsRef.current, source.id, copy));
	}

	async function deleteLesson(id: string) {
		const lesson = lessons.find((item) => item.id === id);
		if (!lesson) return;
		const accepted = await confirm({
			title: 'Xóa bài?',
			body: `Xóa bài "${lesson.title}" cùng ${lesson.sections.length} mục? Thao tác này không hoàn tác được.`,
			confirmLabel: 'Xóa bài',
			danger: true,
		});
		if (!accepted) return;
		const done = await act(() =>
			adminFetch(`/api/admin/learn/lessons/${id}`, { method: 'DELETE' }),
		);
		if (done === undefined) return;
		const next = lessonsRef.current.filter((item) => item.id !== id);
		setLessons(next);
		if (lesson.sections.some((item) => item.id === selectedId))
			select(next[0]?.sections[0]?.id ?? null);
	}

	function deleteSection(id: string) {
		const source = lessonsRef.current;
		const target = findSection(source, id);
		if (!target) return;
		const lessonId = target.lessonId;
		const index =
			source
				.find((lesson) => lesson.id === lessonId)
				?.sections.findIndex((item) => item.id === id) ?? 0;
		const flat = source.flatMap((lesson) => lesson.sections);
		const at = flat.findIndex((item) => item.id === id);
		const neighbour = flat[at + 1] ?? flat[at - 1] ?? null;
		setLessons((current) =>
			current.map((lesson) => ({
				...lesson,
				sections: lesson.sections.filter((item) => item.id !== id),
			})),
		);
		if (selectedId === id) select(neighbour && neighbour.id !== id ? neighbour.id : null);
		deletes.defer({
			key: id,
			message: `Đã xóa mục "${target.title}"`,
			restore: () => {
				setLessons((current) =>
					current.map((lesson) => {
						if (lesson.id !== lessonId) return lesson;
						if (lesson.sections.some((item) => item.id === id)) return lesson;
						const sections = [...lesson.sections];
						sections.splice(Math.min(index, sections.length), 0, target);
						return { ...lesson, sections };
					}),
				);
				select(id);
			},
			commit: async (options) => {
				try {
					await adminFetch(`/api/admin/learn/sections/${id}`, {
						method: 'DELETE',
						keepalive: options?.keepalive,
					});
				} catch (err) {
					setActionError(message(err, 'Không xóa được mục'));
				}
			},
		});
	}

	return {
		act,
		actionError,
		setActionError,
		outlineConflict,
		reorderLessons,
		reorderSections,
		placeSection,
		moveSection,
		addLesson,
		addSection,
		duplicateSection,
		duplicateLesson,
		deleteLesson,
		deleteSection,
	};
}

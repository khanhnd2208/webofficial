'use client';

import { useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

import type {
	LearnDiscussion,
	LearnStudioLesson,
	LearnStudioSection,
} from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import type { AiImportInput, AiImportKind } from './AiImportDialog';
import { findSection } from './sectionPatch';

export interface ImportRequest {
	kind: AiImportKind;
	locked: boolean;
	target?: { sectionId: string; count: number };
}

/** Only send what the API accepts: blank titles and empty takeaway rows stay local. */
function questionBody(
	input: Exclude<AiImportInput, { kind: 'lesson' }>,
	current: LearnStudioSection | null,
): { discussion: LearnDiscussion } {
	const existing = current?.discussion?.questions ?? [];
	return {
		discussion: {
			questions: input.mode === 'append' ? [...existing, ...input.questions] : input.questions,
		},
	};
}

/**
 * The AI import dialog and how its result lands in the outline.
 * Imports that rewrite an open section remount its editor, so stale editor text
 * cannot be saved back over the imported content.
 */
export function useSectionImport({
	courseId,
	lessonsRef,
	setLessons,
	select,
	flush,
	remember,
	remount,
}: {
	courseId: string;
	lessonsRef: RefObject<LearnStudioLesson[]>;
	setLessons: Dispatch<SetStateAction<LearnStudioLesson[]>>;
	select: (id: string | null) => void;
	flush: () => Promise<{ ok: boolean }>;
	remember: (sections: LearnStudioSection[]) => void;
	remount: () => void;
}) {
	const [request, setRequest] = useState<ImportRequest | null>(null);

	function replaceSection(updated: LearnStudioSection) {
		remember([updated]);
		setLessons((current) =>
			current.map((lesson) => ({
				...lesson,
				sections: lesson.sections.map((item) => (item.id === updated.id ? updated : item)),
			})),
		);
	}

	async function saveImport(input: AiImportInput) {
		if (!(await flush()).ok) throw new Error('Chưa lưu được nội dung đang soạn');
		if (input.kind === 'lesson') {
			const result = await adminFetch<LearnStudioLesson | { lessons: LearnStudioLesson[] }>(
				`/api/admin/learn/courses/${courseId}/lessons`,
				{
					method: 'POST',
					body: JSON.stringify({
						markdown: input.markdown,
						mode: input.mode,
						lessonId: input.mode === 'create' ? undefined : input.lessonId,
					}),
				},
			);
			const imported = 'lessons' in result ? result.lessons : [result];
			remember(imported.flatMap((lesson) => lesson.sections));
			setLessons((current) =>
				input.mode === 'create'
					? [...current, ...imported]
					: current.map((lesson) => imported.find((item) => item.id === lesson.id) ?? lesson),
			);
			if (input.mode !== 'create') remount();
			select(imported[0]?.sections[0]?.id ?? null);
			setRequest(null);
			return;
		}

		if (input.mode === 'create') {
			const created = await adminFetch<LearnStudioSection>(
				`/api/admin/learn/lessons/${input.lessonId}/sections`,
				{
					method: 'POST',
					body: JSON.stringify({ type: 'DISCUSSION', title: input.title }),
				},
			);
			try {
				const updated = await adminFetch<LearnStudioSection>(
					`/api/admin/learn/sections/${created.id}?full=1`,
					{
						method: 'PATCH',
						body: JSON.stringify(questionBody(input, null)),
					},
				);
				remember([updated]);
				setLessons((current) =>
					current.map((lesson) =>
						lesson.id === input.lessonId
							? { ...lesson, sections: [...lesson.sections, updated] }
							: lesson,
					),
				);
				select(updated.id);
				setRequest(null);
			} catch (err) {
				await adminFetch(`/api/admin/learn/sections/${created.id}`, { method: 'DELETE' }).catch(
					() => undefined,
				);
				throw err;
			}
			return;
		}

		const current = findSection(lessonsRef.current, input.sectionId);
		if (!current) throw new Error('Không tìm thấy mục');
		const updated = await adminFetch<LearnStudioSection>(
			`/api/admin/learn/sections/${input.sectionId}?full=1`,
			{
				method: 'PATCH',
				body: JSON.stringify(questionBody(input, current)),
			},
		);
		replaceSection(updated);
		remount();
		select(updated.id);
		setRequest(null);
	}

	return { request, setRequest, saveImport, replaceSection };
}

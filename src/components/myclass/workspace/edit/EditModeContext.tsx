'use client';

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

import { myClassApi } from '@/components/myclass/admin/api';
import {
	findPlacementToDetach,
	normalizeTestPlacementBody,
} from '@/features/my-class/domain/attachTarget';
import { reorderCourseTree } from '@/features/my-class/domain/reorderCourseTree';
import type { MyClassCourseDetail } from '@/features/my-class/types';

type NodeType = 'lesson' | 'section' | 'unit';
type ParentType = 'course' | 'lesson' | 'section';
type PickerKind = 'test' | 'vocab' | 'knowledge' | null;

export type AttachTarget = {
	kind: Exclude<PickerKind, null>;
	lessonId?: string;
	sectionId?: string;
	scope?: 'COURSE' | 'LESSON' | 'SECTION';
};

export type VocabImportTarget = {
	lessonId: string;
};

type EditModeContextValue = {
	enabled: boolean;
	courseId: string;
	courseSlug: string;
	course: MyClassCourseDetail;
	busyKey: string | null;
	error: string | null;
	toast: string;
	picker: AttachTarget | null;
	setToast: (value: string) => void;
	setPicker: (value: AttachTarget | null) => void;
	clearError: () => void;
	refresh: () => Promise<MyClassCourseDetail>;
	createLesson: () => Promise<boolean>;
	createSection: (lessonId: string) => Promise<boolean>;
	createUnit: (sectionId: string) => Promise<boolean>;
	attachExistingUnit: (sectionId: string, knowledgeUnitId: string) => Promise<boolean>;
	detachUnit: (sectionId: string, knowledgeUnitId: string) => Promise<boolean>;
	renameNode: (
		type: NodeType,
		id: string,
		title: string,
		expectedUpdatedAt: string,
		extra?: Record<string, unknown>,
	) => Promise<boolean>;
	archiveNode: (
		type: 'lesson' | 'section',
		id: string,
		expectedUpdatedAt: string,
	) => Promise<boolean>;
	reorder: (parentType: ParentType, parentId: string, orderedNodeIds: string[]) => Promise<boolean>;
	attachTest: (testId: string, target: AttachTarget) => Promise<boolean>;
	detachTest: (testId: string, placementId?: string) => Promise<boolean>;
	focusOutline: { lessonId?: string; sectionId?: string; focusCourseAssets?: boolean } | null;
	clearFocusOutline: () => void;
	attachVocab: (vocabSetId: string, lessonId: string | null) => Promise<boolean>;
	detachVocab: (assignmentId: string) => Promise<boolean>;
	vocabImport: VocabImportTarget | null;
	setVocabImport: (value: VocabImportTarget | null) => void;
	importVocab: (payload: {
		lessonId: string | null;
		title: string;
		description?: string;
		csv: string;
	}) => Promise<boolean>;
};

const EditModeContext = createContext<EditModeContextValue | null>(null);

function isoFromCourse(course: MyClassCourseDetail, type: NodeType, id: string): string {
	if (type === 'lesson') {
		return course.lessons.find((item) => item.id === id)?.authoring?.updatedAt ?? '';
	}
	if (type === 'section') {
		return (
			course.lessons.flatMap((lesson) => lesson.sections).find((item) => item.id === id)?.authoring
				?.updatedAt ?? ''
		);
	}
	return (
		course.lessons
			.flatMap((lesson) => lesson.sections.flatMap((section) => section.knowledgeUnits))
			.find((item) => item.id === id)?.authoring?.updatedAt ?? ''
	);
}

export function EditModeProvider({
	enabled,
	initialCourse,
	children,
}: {
	enabled: boolean;
	initialCourse: MyClassCourseDetail;
	children: ReactNode;
}) {
	const [course, setCourse] = useState(initialCourse);
	const [busyKey, setBusyKey] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState('');
	const [picker, setPicker] = useState<AttachTarget | null>(null);
	const [focusOutline, setFocusOutline] = useState<{
		lessonId?: string;
		sectionId?: string;
		focusCourseAssets?: boolean;
	} | null>(null);
	const [vocabImport, setVocabImport] = useState<VocabImportTarget | null>(null);

	useEffect(() => {
		setCourse(initialCourse);
	}, [initialCourse]);

	const refresh = useCallback(async () => {
		const next = await myClassApi<MyClassCourseDetail>(
			`/api/admin/my-class/authoring/courses/${initialCourse.slug}`,
		);
		setCourse(next);
		return next;
	}, [initialCourse.slug]);

	const run = useCallback(
		async (key: string, work: () => Promise<void>, success?: string) => {
			setBusyKey(key);
			setError(null);
			try {
				await work();
				await refresh();
				if (success) setToast(success);
				return true;
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Không lưu được');
				return false;
			} finally {
				setBusyKey(null);
			}
		},
		[refresh],
	);

	const value = useMemo<EditModeContextValue>(
		() => ({
			enabled,
			courseId: course.id,
			courseSlug: course.slug,
			course,
			busyKey,
			error,
			toast,
			picker,
			focusOutline,
			clearFocusOutline: () => setFocusOutline(null),
			setToast,
			setPicker,
			clearError: () => setError(null),
			refresh,
			createLesson: () =>
				run(
					'create-lesson',
					async () => {
						await myClassApi(`/api/admin/my-class/courses/${course.id}/lessons`, {
							method: 'POST',
							body: JSON.stringify({ title: 'Bài mới' }),
						});
					},
					'Đã thêm bài học',
				),
			createSection: (lessonId) =>
				run(
					`create-section:${lessonId}`,
					async () => {
						await myClassApi(`/api/admin/my-class/lessons/${lessonId}/sections`, {
							method: 'POST',
							body: JSON.stringify({ title: 'Chủ đề mới' }),
						});
					},
					'Đã thêm chủ đề',
				),
			createUnit: (sectionId) =>
				run(
					`create-unit:${sectionId}`,
					async () => {
						await myClassApi(`/api/admin/my-class/sections/${sectionId}/knowledge`, {
							method: 'POST',
							body: JSON.stringify({ create: true, title: 'Nội dung mới' }),
						});
					},
					'Đã thêm nội dung',
				),
			attachExistingUnit: (sectionId, knowledgeUnitId) =>
				run(
					`attach-unit:${sectionId}`,
					async () => {
						await myClassApi(`/api/admin/my-class/sections/${sectionId}/knowledge`, {
							method: 'POST',
							body: JSON.stringify({ knowledgeUnitId }),
						});
					},
					'Đã gắn nội dung',
				),
			detachUnit: (sectionId, knowledgeUnitId) =>
				run(
					`detach:${knowledgeUnitId}`,
					async () => {
						await myClassApi(
							`/api/admin/my-class/sections/${sectionId}/knowledge/${knowledgeUnitId}`,
							{ method: 'DELETE' },
						);
					},
					'Đã gỡ nội dung',
				),
			renameNode: (type, id, title, expectedUpdatedAt, extra = {}) =>
				run(
					`rename:${id}`,
					async () => {
						await myClassApi(`/api/admin/my-class/courses/${course.id}/nodes/${type}/${id}`, {
							method: 'PATCH',
							body: JSON.stringify({
								expectedUpdatedAt: expectedUpdatedAt || isoFromCourse(course, type, id),
								changes: { title, ...extra },
							}),
						});
					},
					'Đã đổi tên',
				),
			archiveNode: (type, id, expectedUpdatedAt) =>
				run(
					`archive:${id}`,
					async () => {
						await myClassApi(`/api/admin/my-class/courses/${course.id}/nodes/${type}/${id}`, {
							method: 'POST',
							body: JSON.stringify({
								expectedUpdatedAt: expectedUpdatedAt || isoFromCourse(course, type, id),
								status: 'ARCHIVED',
							}),
						});
					},
					'Đã lưu trữ',
				),
			reorder: async (parentType, parentId, orderedNodeIds) => {
				const snapshot = course;
				setCourse(reorderCourseTree(course, parentType, parentId, orderedNodeIds));
				setBusyKey(`reorder:${parentId}`);
				setError(null);
				try {
					await myClassApi(`/api/admin/my-class/courses/${course.id}/reorder`, {
						method: 'POST',
						body: JSON.stringify({ parentType, parentId, orderedNodeIds }),
					});
					setToast('Đã đổi thứ tự');
					return true;
				} catch (err) {
					setCourse(snapshot);
					try {
						await refresh();
					} catch {
						/* keep snapshot */
					}
					setError(err instanceof Error ? err.message : 'Không lưu được');
					return false;
				} finally {
					setBusyKey(null);
				}
			},
			attachTest: (testId, target) =>
				run(
					`attach-test:${testId}`,
					async () => {
						const body = normalizeTestPlacementBody(course.id, target);
						await myClassApi(`/api/admin/my-class/tests/${testId}/placements`, {
							method: 'POST',
							body: JSON.stringify(body),
						});
						setFocusOutline(
							body.scope === 'COURSE'
								? { focusCourseAssets: true }
								: { lessonId: body.lessonId ?? undefined, sectionId: body.sectionId ?? undefined },
						);
					},
					'Đã gắn bài kiểm tra',
				),
			detachTest: (testId, placementId) =>
				run(
					`detach-test:${testId}`,
					async () => {
						if (placementId) {
							await myClassApi(`/api/admin/my-class/tests/${testId}/placements/${placementId}`, {
								method: 'DELETE',
							});
							return;
						}
						const rows = await myClassApi<
							Array<{
								id: string;
								scope?: 'COURSE' | 'LESSON' | 'SECTION';
								course: { id: string };
								lesson?: { id: string } | null;
								section?: { id: string } | null;
							}>
						>(`/api/admin/my-class/tests/${testId}/placements`);
						const match = findPlacementToDetach(rows, course.id);
						if (!match) throw new Error('Không tìm thấy vị trí gắn cần gỡ');
						await myClassApi(`/api/admin/my-class/tests/${testId}/placements/${match.id}`, {
							method: 'DELETE',
						});
					},
					'Đã gỡ bài kiểm tra',
				),
			attachVocab: (vocabSetId, lessonId) =>
				run(
					`attach-vocab:${vocabSetId}`,
					async () => {
						await myClassApi(`/api/admin/my-class/courses/${course.id}/vocab-assignments`, {
							method: 'POST',
							body: JSON.stringify({ vocabSetId, lessonId }),
						});
						setFocusOutline(lessonId ? { lessonId } : { focusCourseAssets: true });
					},
					'Đã gắn từ vựng',
				),
			detachVocab: (assignmentId) =>
				run(
					`detach-vocab:${assignmentId}`,
					async () => {
						await myClassApi(
							`/api/admin/my-class/courses/${course.id}/vocab-assignments/${assignmentId}`,
							{
								method: 'DELETE',
							},
						);
					},
					'Đã gỡ từ vựng',
				),
			vocabImport,
			setVocabImport,
			importVocab: (payload) =>
				run(
					'import-vocab',
					async () => {
						await myClassApi(`/api/admin/my-class/courses/${course.id}/vocab-assignments/import`, {
							method: 'POST',
							body: JSON.stringify({
								lessonId: payload.lessonId,
								title: payload.title,
								description: payload.description,
								csv: payload.csv,
								mode: 'commit',
							}),
						});
						setVocabImport(null);
					},
					'Đã tạo và gắn bộ từ',
				),
		}),
		[busyKey, course, enabled, error, focusOutline, picker, refresh, run, toast, vocabImport],
	);

	return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
	return useContext(EditModeContext);
}

export function useOptionalEditMode() {
	return useContext(EditModeContext);
}

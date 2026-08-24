import { AppError } from '@/lib/appError';

export type TestScope = 'COURSE' | 'LESSON' | 'SECTION';

export function assertTestScope(input: {
	scope: TestScope;
	courseId: string;
	lessonId?: string | null;
	sectionId?: string | null;
	lessonCourseId?: string | null;
	sectionLessonId?: string | null;
}): void {
	if (input.scope === 'COURSE') {
		if (input.lessonId || input.sectionId) {
			throw new AppError('Test cấp Course không được gắn Lesson hoặc Section', 422);
		}
		return;
	}
	if (input.scope === 'LESSON') {
		if (!input.lessonId) throw new AppError('Test cấp Lesson cần lessonId', 422);
		if (input.sectionId) throw new AppError('Test cấp Lesson không được gắn Section', 422);
		if (input.lessonCourseId && input.lessonCourseId !== input.courseId) {
			throw new AppError('Lesson không thuộc Course này', 422);
		}
		return;
	}
	if (!input.lessonId || !input.sectionId) {
		throw new AppError('Test cấp Section cần Lesson và Section', 422);
	}
	if (input.lessonCourseId && input.lessonCourseId !== input.courseId) {
		throw new AppError('Lesson không thuộc Course này', 422);
	}
	if (input.sectionLessonId && input.sectionLessonId !== input.lessonId) {
		throw new AppError('Section không thuộc Lesson này', 422);
	}
}

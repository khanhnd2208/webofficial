export type LessonDTO = {
	id: string;
	unitId?: string;
	title: string;
	content: string;
	vocabCollectionId?: string;
	vocabularyCount: number;
	createdAt: string;
	updatedAt: string;
};

export type AdminLessonListItemDTO = {
	id: string;
	unitId?: string;
	title: string;
	vocabCollectionId?: string;
	vocabularyCount: number;
	createdAt: string;
	updatedAt: string;
};

export type SavedLessonDTO = {
	lessonId: string;
	title: string;
	newCount: number;
	totalCount: number;
};


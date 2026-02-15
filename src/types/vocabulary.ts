export type VocabularyStatus = 'new' | 'mastered';

export type VocabularyItemDTO = {
	word: string;
	partOfSpeech: string;
	meaningVi: string;
	meaningEn: string;
};

export type VocabularyCollectionDTO = {
	id: string;
	name: string;
	itemCount: number;
	createdAt: string;
	updatedAt: string;
};

export type UserVocabularyItemDTO = {
	id: string;
	lessonId: string;
	word: string;
	partOfSpeech?: string;
	meaningVi: string;
	meaningEn: string;
	status: VocabularyStatus;
	createdAt: string;
	updatedAt: string;
};

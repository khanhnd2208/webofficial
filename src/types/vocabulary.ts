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

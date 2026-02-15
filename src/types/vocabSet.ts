export interface VocabTermDTO {
	word: string;
	definition: string;
	partOfSpeech: string;
	example: string;
}

export interface VocabSetDTO {
	id: string;
	title: string;
	description: string;
	ownerId: string;
	ownerName: string;
	terms: VocabTermDTO[];
	termCount: number;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface VocabSetListItemDTO {
	id: string;
	title: string;
	description: string;
	ownerName: string;
	ownerId: string;
	termCount: number;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
}

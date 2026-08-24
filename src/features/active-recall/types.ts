export type ActiveRecallStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ActiveRecallCardDTO = {
	id: string;
	question: string;
	answer: string;
	position: number;
	createdAt: string;
	updatedAt: string;
};

export type ActiveRecallDeckListItem = {
	id: string;
	slug: string;
	title: string;
	subject: string;
	lessonLabel: string;
	description: string;
	status: ActiveRecallStatus;
	position: number;
	cardCount: number;
	updatedAt: string;
	publishedAt: string | null;
};

export type ActiveRecallDeckDTO = ActiveRecallDeckListItem & {
	createdAt: string;
	cards: ActiveRecallCardDTO[];
};

export type RecallImportRow = {
	row: number;
	id?: string;
	question: string;
	answer: string;
	order?: number;
	errors: string[];
	action?: 'create' | 'update' | 'skip';
};

export type RecallImportPreview = {
	rows: RecallImportRow[];
	summary: { total: number; valid: number; invalid: number; duplicates: number; orphanAnswers: number };
	format: 'csv' | 'paste' | 'tsv';
};

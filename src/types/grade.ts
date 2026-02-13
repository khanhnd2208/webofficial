export interface GradeDTO {
	id: string;
	studentId: string;
	course: string;
	score: number;
	note?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateGradeInput {
	studentId: string;
	course: string;
	score: number;
	note?: string;
}

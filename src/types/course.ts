export type CourseDTO = {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
};

export type AdminCourseListItemDTO = CourseDTO & {
	lessonCount: number;
	vocabularyCount: number;
};

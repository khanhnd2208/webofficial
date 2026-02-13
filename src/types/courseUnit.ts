export type CourseUnitDTO = {
	id: string;
	courseId: string;
	unitId: string;
	order: number;
	createdAt: string;
	updatedAt: string;
};

export type CourseUnitListItemDTO = CourseUnitDTO & {
	unit: {
		id: string;
		name: string;
		createdAt: string;
		updatedAt: string;
	};
};


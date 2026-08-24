import type { Prisma } from '@prisma/client';

const testCountInclude = {
	include: { test: { include: { _count: { select: { questions: true } } } } },
} as const;

const publishedPlacementWhere = {
	status: 'PUBLISHED' as const,
	test: { status: 'PUBLISHED' as const },
	OR: [
		{ scope: 'COURSE' as const },
		{ scope: 'LESSON' as const, lesson: { status: 'PUBLISHED' as const } },
		{
			scope: 'SECTION' as const,
			lesson: { status: 'PUBLISHED' as const },
			section: { status: 'PUBLISHED' as const },
		},
	],
};

const publishedPlacementInclude = {
	where: publishedPlacementWhere,
	orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
	...testCountInclude,
};

const authoringPlacementInclude = {
	orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
	...testCountInclude,
};

const outlineRevisionSelect = {
	title: true,
	summary: true,
	estimatedMinutes: true,
} as const;

export const publicCourseInclude = {
	lessons: {
		where: { status: 'PUBLISHED' as const },
		orderBy: { position: 'asc' as const },
		include: {
			sections: {
				where: { status: 'PUBLISHED' as const },
				orderBy: { position: 'asc' as const },
				include: {
					knowledge: {
						where: { knowledgeUnit: { status: 'PUBLISHED' as const, currentPublishedRevisionId: { not: null } } },
						orderBy: { position: 'asc' as const },
						include: {
							knowledgeUnit: {
								include: { currentPublishedRevision: { select: outlineRevisionSelect } },
							},
						},
					},
					placements: {
						...publishedPlacementInclude,
						where: { ...publishedPlacementWhere, scope: 'SECTION' as const },
					},
				},
			},
			placements: {
				...publishedPlacementInclude,
				where: { ...publishedPlacementWhere, scope: 'LESSON' as const },
			},
		},
	},
	placements: {
		...publishedPlacementInclude,
		where: { ...publishedPlacementWhere, scope: 'COURSE' as const },
	},
} satisfies Prisma.MyClassCourseInclude;

export const authoringCourseInclude = {
	lessons: {
		orderBy: { position: 'asc' as const },
		include: {
			sections: {
				orderBy: { position: 'asc' as const },
				include: {
					knowledge: {
						orderBy: { position: 'asc' as const },
						include: {
							knowledgeUnit: {
								include: {
									currentPublishedRevision: true,
									revisions: { orderBy: { version: 'desc' as const }, take: 1 },
								},
							},
						},
					},
					placements: {
						...authoringPlacementInclude,
						where: { scope: 'SECTION' as const },
					},
				},
			},
			placements: {
				...authoringPlacementInclude,
				where: { scope: 'LESSON' as const },
			},
		},
	},
	placements: {
		...authoringPlacementInclude,
		where: { scope: 'COURSE' as const },
	},
} satisfies Prisma.MyClassCourseInclude;

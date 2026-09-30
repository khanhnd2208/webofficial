import { prisma } from '@/lib/prisma';

export async function listAssignments(courseId: string) {
	return prisma.myClassVocabAssignment.findMany({
		where: { courseId },
		include: {
			lesson: { select: { id: true, slug: true, title: true, courseId: true, status: true } },
			vocabSet: {
				select: {
					id: true,
					title: true,
					isArchived: true,
					_count: { select: { words: { where: { isDeleted: false } } } },
					words: {
						where: {
							isDeleted: false,
							NOT: {
								hintsHard: { equals: [] },
								hintsMedium: { equals: [] },
								hintsEasy: { equals: [] },
							},
						},
						select: { id: true, hintsHard: true, hintsMedium: true, hintsEasy: true },
						take: 1,
					},
				},
			},
		},
		orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
	});
}

export async function findAssignment(courseId: string, vocabSetId: string) {
	const rows = await prisma.myClassVocabAssignment.findMany({
		where: { courseId, vocabSetId },
		include: {
			lesson: true,
			vocabSet: { include: { words: { where: { isDeleted: false } } } },
		},
		orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
	});
	return rows.find((row) => row.lessonId === null) ?? rows[0] ?? null;
}

export async function findAssignmentById(id: string) {
	return prisma.myClassVocabAssignment.findUnique({
		where: { id },
		include: { lesson: true, vocabSet: true, course: true },
	});
}

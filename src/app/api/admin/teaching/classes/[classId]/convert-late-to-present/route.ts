import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { prisma } from '@/lib/prisma';

const TRACE_NOTE = 'Muộn -> Đúng giờ';

export const POST = withAdmin(async (_request, _user, context) => {
	const classId = String((await context!.params).classId);
	const lateRows = await prisma.teachingAttendance.findMany({
		where: {
			status: 'LATE',
			session: { classId },
			enrollment: { classId, status: 'ACTIVE' },
		},
		select: { id: true, note: true },
	});

	let updatedCount = 0;
	await prisma.$transaction(async (tx) => {
		for (const row of lateRows) {
			const trimmed = row.note.trim();
			const nextNote = trimmed.includes(TRACE_NOTE)
				? trimmed
				: trimmed
					? `${trimmed} | ${TRACE_NOTE}`
					: TRACE_NOTE;
			await tx.teachingAttendance.update({
				where: { id: row.id },
				data: { status: 'PRESENT', note: nextNote },
			});
			updatedCount += 1;
		}
	});

	return apiSuccess({ classId, updatedCount });
});

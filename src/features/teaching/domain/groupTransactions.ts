import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/appError';

/** Reads, capacity checks and writes must share a serializable snapshot. */
export async function groupTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
	try {
		return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
			throw new AppError('Danh sách vừa thay đổi. Hãy tải lại rồi thử lại.', 409, 'STALE_BOARD');
		}
		throw error;
	}
}

/** Called inside the enrollment update transaction, even when the UI is disabled. */
export async function removeEnrollmentGroup(tx: Prisma.TransactionClient, enrollmentId: string) {
	const assignment = await tx.teachingGroupAssignment.findUnique({
		where: { enrollmentId },
		include: { group: true },
	});
	if (!assignment) return;
	await tx.teachingGroupAssignment.delete({ where: { enrollmentId } });
	await tx.teachingGroupBoard.update({
		where: { id: assignment.boardId },
		data: { version: { increment: 1 } },
	});
	await tx.teachingGroupAudit.create({
		data: {
			boardId: assignment.boardId,
			actor: 'SYSTEM',
			action: 'REMOVE',
			enrollmentId,
			fromGroupOrder: assignment.group.displayOrder,
			metadata: { reason: 'enrollment_tutorial_or_status_change' },
		},
	});
}

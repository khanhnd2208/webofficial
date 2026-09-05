import type { Prisma, PrismaClient } from '@prisma/client';

type LegacyBoard = { id: string; classId: string; groupSize: number; version: number };

async function inspect(tx: Prisma.TransactionClient) {
	// Prisma's new required field cannot decode legacy NULL tutorial ids.
	const boards = await tx.$queryRaw<LegacyBoard[]>`
		SELECT * FROM "TeachingGroupBoard" WHERE "tutorialClassId" IS NULL ORDER BY id
	`;
	return Promise.all(
		boards.map(async (board) => {
			const [tutorials, assignments, groups, audits, existing] = await Promise.all([
				tx.teachingTutorialClass.findMany({
					where: { classId: board.classId },
					orderBy: { displayOrder: 'asc' },
				}),
				tx.teachingGroupAssignment.findMany({
					where: { boardId: board.id },
					include: {
						group: true,
						enrollment: { select: { id: true, tutorialClassId: true, status: true } },
					},
				}),
				tx.teachingGroup.findMany({ where: { boardId: board.id } }),
				tx.teachingGroupAudit.findMany({ where: { boardId: board.id } }),
				tx.$queryRaw<Array<{ tutorialClassId: string }>>`
				SELECT "tutorialClassId" FROM "TeachingGroupBoard" WHERE "classId" = ${board.classId} AND "tutorialClassId" IS NOT NULL
			`,
			]);
			const issues: string[] = [];
			if (!tutorials.length) issues.push(`Board ${board.id}: class has no tutorial`);
			for (const assignment of assignments) {
				if (
					!tutorials.some((t) => t.id === assignment.enrollment.tutorialClassId) ||
					assignment.enrollment.status !== 'ACTIVE'
				) {
					issues.push(
						`Enrollment ${assignment.enrollmentId}: missing/invalid tutorial or inactive; resolve before migration`,
					);
				}
			}
			if (existing.length)
				issues.push(
					`Board ${board.id}: destination board already exists; reconcile explicitly before migration`,
				);
			return { board, tutorials, assignments, groups, audits, issues };
		}),
	);
}

/** All boards, archive snapshots and final constraints commit together or not at all. */
export async function migrateLegacyGroupBoards(db: PrismaClient, apply = false) {
	return db.$transaction(
		async (tx) => {
			const plans = await inspect(tx);
			const issues = plans.flatMap((plan) => plan.issues);
			const report = {
				mode: apply ? 'apply' : 'dry-run',
				applied: false,
				issues,
				boards: plans.map(({ board, assignments, tutorials }) => ({
					legacyBoardId: board.id,
					members: assignments.length,
					tutorials: tutorials.map((tutorial) => ({
						id: tutorial.id,
						code: tutorial.code,
						members: assignments.filter((a) => a.enrollment.tutorialClassId === tutorial.id).length,
					})),
				})),
			};
			if (!apply || issues.length) return report;

			for (const { board, tutorials, assignments, groups, audits } of plans) {
				// Archive before cascading deletion. Snapshot and live migration are atomic.
				await tx.teachingGroupBoardArchive.create({
					data: {
						legacyBoardId: board.id,
						snapshot: JSON.parse(
							JSON.stringify({ board, groups, assignments, audits }),
						) as Prisma.InputJsonValue,
					},
				});
				for (const tutorial of tutorials) {
					const members = assignments.filter((a) => a.enrollment.tutorialClassId === tutorial.id);
					const orders = [...new Set(members.map((a) => a.group.displayOrder))].sort(
						(a, b) => a - b,
					);
					const studentCount = await tx.teachingEnrollment.count({
						where: { tutorialClassId: tutorial.id, status: 'ACTIVE' },
					});
					const groupSize = board.groupSize > 0 ? board.groupSize : 5;
					const groupCount = Math.max(orders.length, Math.ceil(studentCount / groupSize), 1);
					const next = await tx.teachingGroupBoard.create({
						data: {
							classId: board.classId,
							tutorialClassId: tutorial.id,
							groupSize,
							groupCount,
							version: board.version + 1,
						},
					});
					for (let displayOrder = 0; displayOrder < groupCount; displayOrder += 1) {
						const groupMembers = members
							.filter((a) => a.group.displayOrder === orders[displayOrder])
							.sort((a, b) => a.slotIndex - b.slotIndex);
						const group = await tx.teachingGroup.create({
							data: {
								boardId: next.id,
								displayOrder,
								maxSize: groupMembers.length > groupSize ? groupMembers.length : null,
							},
						});
						for (const [slotIndex, member] of groupMembers.entries()) {
							// Move the original assignment; enrollmentId uniqueness is never violated.
							await tx.teachingGroupAssignment.update({
								where: { id: member.id },
								data: { boardId: next.id, groupId: group.id, slotIndex },
							});
						}
					}
					await tx.teachingGroupAudit.create({
						data: {
							boardId: next.id,
							actor: 'SYSTEM',
							action: 'CONFIGURE',
							metadata: {
								migratedFrom: board.id,
								archiveLegacyBoardId: board.id,
								memberCount: members.length,
							},
						},
					});
				}
				if (await tx.teachingGroupAssignment.count({ where: { boardId: board.id } })) {
					throw new Error(`Unmigrated assignments remain in ${board.id}; rolling back`);
				}
				await tx.teachingGroupBoard.delete({ where: { id: board.id } });
			}
			await tx.$executeRawUnsafe(
				'ALTER TABLE "TeachingGroupBoard" VALIDATE CONSTRAINT "TeachingGroupBoard_tutorial_required"',
			);
			await tx.$executeRawUnsafe(
				'ALTER TABLE "TeachingGroupBoard" ALTER COLUMN "tutorialClassId" SET NOT NULL',
			);
			return { ...report, applied: true };
		},
		{ isolationLevel: 'Serializable', timeout: 120_000, maxWait: 10_000 },
	);
}

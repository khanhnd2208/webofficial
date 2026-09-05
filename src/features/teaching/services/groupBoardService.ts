import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { groupTransaction, removeEnrollmentGroup } from '../domain/groupTransactions';
import { maskStudentCode } from '../domain/privacy';
import { withUniqueConflict } from '../domain/prismaErrors';
import { assertTeachingGroupBoardEnabled } from '../groupBoardAvailability';

import type {
	GroupNumbersByTutorial,
	PublicTeachingGroupBoard,
	TeachingGroupAssignmentRecord,
	TeachingGroupBoard,
	TeachingGroupRecord,
} from '../types';

function normalizeStudentCode(value: string) {
	return value.trim().replace(/\s+/g, '');
}

function effectiveMaxSize(group: { maxSize: number | null }, board: { groupSize: number }) {
	return group.maxSize ?? board.groupSize;
}

function mapAssignment(row: {
	enrollmentId: string;
	slotIndex: number;
	group: { id: string; displayOrder: number };
	enrollment: {
		learningExperience: TeachingGroupAssignmentRecord['learningExperience'];
		student: { studentCode: string; familyName: string; givenName: string };
	};
}): TeachingGroupAssignmentRecord {
	return {
		enrollmentId: row.enrollmentId,
		groupId: row.group.id,
		groupOrder: row.group.displayOrder,
		memberOrder: row.slotIndex,
		studentCode: row.enrollment.student.studentCode,
		familyName: row.enrollment.student.familyName,
		givenName: row.enrollment.student.givenName,
		learningExperience: row.enrollment.learningExperience,
	};
}

async function assertTutorialInClass(classId: string, tutorialClassId: string) {
	const tutorial = await prisma.teachingTutorialClass.findFirst({
		where: { id: tutorialClassId, classId },
		select: { id: true, code: true, name: true },
	});
	if (!tutorial) throw new AppError('Tutorial không thuộc lớp này.', 404, 'NOT_FOUND');
	return tutorial;
}

async function ensureBoard(tx: Prisma.TransactionClient, classId: string, tutorialClassId: string) {
	return tx.teachingGroupBoard.upsert({
		where: { tutorialClassId },
		create: { classId, tutorialClassId },
		update: {},
		include: { groups: { orderBy: { displayOrder: 'asc' } } },
	});
}

function suggestedGroupCount(studentCount: number, defaultSize: number) {
	if (studentCount <= 0) return 1;
	return Math.max(1, Math.ceil(studentCount / defaultSize));
}

function buildBoardPayload(
	classId: string,
	tutorial: { id: string; code: string; name: string },
	board: {
		classId: string;
		tutorialClassId: string;
		groupCount: number;
		groupSize: number;
		version: number;
		groups: Array<{ id: string; displayOrder: number; maxSize: number | null }>;
		assignments: Array<{
			enrollmentId: string;
			slotIndex: number;
			group: { id: string; displayOrder: number };
			enrollment: {
				learningExperience: TeachingGroupAssignmentRecord['learningExperience'];
				student: { studentCode: string; familyName: string; givenName: string };
			};
		}>;
	} | null,
	students: Array<{
		id: string;
		learningExperience: TeachingGroupAssignmentRecord['learningExperience'];
		student: { studentCode: string; familyName: string; givenName: string };
	}>,
	maskCodes: boolean,
): TeachingGroupBoard {
	const activeIds = new Set(students.map((student) => student.id));
	const assignments = (board?.assignments ?? [])
		.filter((row) => activeIds.has(row.enrollmentId))
		.map((row) => {
			const assignment = mapAssignment(row);
			return {
				...assignment,
				studentCode: maskCodes ? maskStudentCode(assignment.studentCode) : assignment.studentCode,
			};
		});
	const byGroup = new Map<string, TeachingGroupAssignmentRecord[]>();
	for (const assignment of assignments) {
		byGroup.set(assignment.groupId, [...(byGroup.get(assignment.groupId) ?? []), assignment]);
	}
	const defaultGroupSize = board?.groupSize ?? 5;
	const groups: TeachingGroupRecord[] = (board?.groups ?? []).map((group) => ({
		id: group.id,
		displayOrder: group.displayOrder,
		maxSize: group.maxSize,
		effectiveMaxSize: effectiveMaxSize(group, { groupSize: defaultGroupSize }),
		assignments: (byGroup.get(group.id) ?? []).sort((a, b) => a.memberOrder - b.memberOrder),
	}));
	const assigned = new Set(assignments.map((item) => item.enrollmentId));
	const unassigned = students
		.filter((student) => !assigned.has(student.id))
		.map((student) => ({
			enrollmentId: student.id,
			studentCode: maskCodes
				? maskStudentCode(student.student.studentCode)
				: student.student.studentCode,
			familyName: student.student.familyName,
			givenName: student.student.givenName,
			learningExperience: student.learningExperience,
		}));

	return {
		classId,
		tutorialClassId: tutorial.id,
		tutorialCode: tutorial.code,
		tutorialName: tutorial.name,
		groupCount: board?.groupCount ?? 0,
		defaultGroupSize,
		version: board?.version ?? 0,
		configured: Boolean(board && board.groupCount > 0 && board.groupSize > 0),
		activeStudentCount: students.length,
		assignedCount: assignments.length,
		groups,
		unassigned,
	};
}

export async function getGroupBoard(
	classId: string,
	tutorialClassId: string,
): Promise<TeachingGroupBoard>;
export async function getGroupBoard(
	classId: string,
	tutorialClassId: string,
	slug: string,
): Promise<PublicTeachingGroupBoard>;
export async function getGroupBoard(
	classId: string,
	tutorialClassId: string,
	slug?: string,
): Promise<TeachingGroupBoard | PublicTeachingGroupBoard> {
	assertTeachingGroupBoardEnabled();
	const tutorial = await assertTutorialInClass(classId, tutorialClassId);
	const [board, students] = await Promise.all([
		prisma.teachingGroupBoard.findUnique({
			where: { tutorialClassId },
			include: {
				groups: { orderBy: { displayOrder: 'asc' } },
				assignments: {
					include: {
						group: true,
						enrollment: {
							include: {
								student: { select: { studentCode: true, familyName: true, givenName: true } },
							},
						},
					},
				},
			},
		}),
		prisma.teachingEnrollment.findMany({
			where: { classId, tutorialClassId, status: 'ACTIVE' },
			orderBy: [{ orderNo: 'asc' }, { createdAt: 'asc' }],
			include: { student: { select: { studentCode: true, familyName: true, givenName: true } } },
		}),
	]);

	const data = buildBoardPayload(classId, tutorial, board, students, Boolean(slug));
	if (!slug) return data;
	return { ...data, slug };
}

export async function getGroupNumbersByEnrollment(
	classId: string,
): Promise<GroupNumbersByTutorial> {
	assertTeachingGroupBoardEnabled();
	const boards = await prisma.teachingGroupBoard.findMany({
		where: { classId },
		select: {
			tutorialClassId: true,
			assignments: {
				select: {
					enrollmentId: true,
					enrollment: { select: { tutorialClassId: true, status: true } },
					group: { select: { displayOrder: true } },
				},
			},
		},
	});
	const result: GroupNumbersByTutorial = {};
	for (const board of boards) {
		result[board.tutorialClassId] = Object.fromEntries(
			board.assignments
				.filter(
					(assignment) =>
						assignment.enrollment.status === 'ACTIVE' &&
						assignment.enrollment.tutorialClassId === board.tutorialClassId,
				)
				.map((assignment) => [assignment.enrollmentId, assignment.group.displayOrder + 1]),
		);
	}
	return result;
}

export async function configureGroupBoard(
	classId: string,
	input: {
		tutorialClassId: string;
		groupCount: number;
		defaultGroupSize: number;
		expectedVersion?: number;
		actorUserId?: string;
	},
) {
	assertTeachingGroupBoardEnabled();
	await assertTutorialInClass(classId, input.tutorialClassId);
	if (
		!Number.isInteger(input.groupCount) ||
		input.groupCount < 1 ||
		input.groupCount > 50 ||
		!Number.isInteger(input.defaultGroupSize) ||
		input.defaultGroupSize < 1 ||
		input.defaultGroupSize > 50
	) {
		throw new AppError('Số nhóm phải từ 1–50 và sức chứa mặc định từ 1–50.', 422, 'VALIDATION');
	}

	await groupTransaction(async (tx) => {
		const board = await ensureBoard(tx, classId, input.tutorialClassId);
		if (input.expectedVersion != null && input.expectedVersion !== board.version) {
			throw new AppError('Bảng đã thay đổi. Hãy tải lại trước khi lưu.', 409, 'STALE_BOARD');
		}

		const assignments = await tx.teachingGroupAssignment.findMany({
			where: { boardId: board.id },
			include: { group: true },
		});
		for (const assignment of assignments) {
			if (assignment.group.displayOrder >= input.groupCount) {
				throw new AppError(
					'Không thể giảm số nhóm khi vẫn còn sinh viên ở nhóm sẽ bị xóa.',
					409,
					'GROUP_CAPACITY_CONFLICT',
				);
			}
			const group = board.groups.find((item) => item.id === assignment.groupId);
			if (
				group?.maxSize == null &&
				assignments.filter((item) => item.groupId === assignment.groupId).length >
					input.defaultGroupSize
			) {
				throw new AppError(
					'Không thể giảm sức chứa mặc định khi nhóm đã vượt giới hạn mới.',
					409,
					'GROUP_CAPACITY_CONFLICT',
				);
			}
		}

		const groups = [...board.groups];
		for (let index = 0; index < input.groupCount; index += 1) {
			if (!groups[index]) {
				await tx.teachingGroup.create({
					data: { boardId: board.id, displayOrder: index },
				});
			}
		}
		await tx.teachingGroup.deleteMany({
			where: { boardId: board.id, displayOrder: { gte: input.groupCount } },
		});
		await tx.teachingGroupBoard.update({
			where: { id: board.id },
			data: {
				groupCount: input.groupCount,
				groupSize: input.defaultGroupSize,
				version: { increment: 1 },
			},
		});
		await tx.teachingGroupAudit.create({
			data: {
				boardId: board.id,
				actor: 'ADMIN',
				actorUserId: input.actorUserId,
				action: 'CONFIGURE',
				metadata: {
					groupCount: input.groupCount,
					defaultGroupSize: input.defaultGroupSize,
				},
			},
		});
	});

	return getGroupBoard(classId, input.tutorialClassId);
}

export async function setGroupCapacity(
	classId: string,
	groupId: string,
	input: {
		tutorialClassId: string;
		maxSize: number | null;
		expectedVersion?: number;
		actorUserId?: string;
	},
) {
	assertTeachingGroupBoardEnabled();
	await assertTutorialInClass(classId, input.tutorialClassId);
	if (
		input.maxSize != null &&
		(!Number.isInteger(input.maxSize) || input.maxSize < 1 || input.maxSize > 50)
	) {
		throw new AppError('Sức chứa nhóm phải từ 1–50.', 422, 'VALIDATION');
	}

	await groupTransaction(async (tx) => {
		const board = await tx.teachingGroupBoard.findUnique({
			where: { tutorialClassId: input.tutorialClassId },
			include: { groups: true },
		});
		if (!board || board.classId !== classId) {
			throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
		}
		if (input.expectedVersion != null && input.expectedVersion !== board.version) {
			throw new AppError('Bảng đã thay đổi. Hãy tải lại.', 409, 'STALE_BOARD');
		}
		const group = board.groups.find((item) => item.id === groupId);
		if (!group) throw new AppError('Nhóm không hợp lệ.', 422, 'INVALID_GROUP');

		const memberCount = await tx.teachingGroupAssignment.count({ where: { groupId } });
		const nextCapacity = input.maxSize ?? board.groupSize;
		if (memberCount > nextCapacity) {
			throw new AppError(
				'Không thể giảm sức chứa dưới số thành viên hiện có.',
				409,
				'GROUP_CAPACITY_CONFLICT',
			);
		}

		await tx.teachingGroup.update({
			where: { id: groupId },
			data: { maxSize: input.maxSize },
		});
		await tx.teachingGroupBoard.update({
			where: { id: board.id },
			data: { version: { increment: 1 } },
		});
		await tx.teachingGroupAudit.create({
			data: {
				boardId: board.id,
				actor: 'ADMIN',
				actorUserId: input.actorUserId,
				action: 'UPDATE_CAPACITY',
				metadata: { groupOrder: group.displayOrder, maxSize: input.maxSize },
			},
		});
	});

	return getGroupBoard(classId, input.tutorialClassId);
}

async function nextMemberOrder(tx: Prisma.TransactionClient, groupId: string) {
	const max = await tx.teachingGroupAssignment.aggregate({
		where: { groupId },
		_max: { slotIndex: true },
	});
	return (max._max.slotIndex ?? -1) + 1;
}

export async function addGroupMembers(
	classId: string,
	input: {
		tutorialClassId: string;
		groupId: string;
		studentCodes: string[];
		expectedVersion?: number;
		actorUserId?: string;
	},
) {
	assertTeachingGroupBoardEnabled();
	await assertTutorialInClass(classId, input.tutorialClassId);
	const normalizedCodes = input.studentCodes.map(normalizeStudentCode).filter(Boolean);
	if (!normalizedCodes.length) {
		throw new AppError('Hãy nhập ít nhất một mã sinh viên.', 422, 'VALIDATION');
	}

	await withUniqueConflict(
		'Một số sinh viên vừa được thêm vào nhóm khác. Hãy tải lại.',
		() =>
			groupTransaction(async (tx) => {
				const preview = await previewGroupMembers(
					classId,
					input.tutorialClassId,
					input.groupId,
					normalizedCodes,
					tx,
				);
				const validCodes = preview.resolved.map((item) => item.studentCode);
				if (!validCodes.length) {
					throw new AppError('Không có mã hợp lệ để thêm.', 422, 'VALIDATION', {
						errors: preview.errors.join('\n'),
					});
				}
				if (preview.errors.length) {
					throw new AppError('Một số mã không hợp lệ. Hãy sửa trước khi lưu.', 422, 'VALIDATION', {
						errors: preview.errors.join('\n'),
					});
				}

				const board = await tx.teachingGroupBoard.findUnique({
					where: { tutorialClassId: input.tutorialClassId },
					include: { groups: true },
				});
				if (!board || !board.groupCount || board.classId !== classId) {
					throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
				}
				if (input.expectedVersion != null && input.expectedVersion !== board.version) {
					throw new AppError('Bảng đã thay đổi. Hãy tải lại.', 409, 'STALE_BOARD');
				}
				const group = board.groups.find((item) => item.id === input.groupId);
				if (!group) throw new AppError('Nhóm không hợp lệ.', 422, 'INVALID_GROUP');

				const capacity = effectiveMaxSize(group, board);
				const currentCount = await tx.teachingGroupAssignment.count({
					where: { groupId: input.groupId },
				});
				if (currentCount + validCodes.length > capacity) {
					throw new AppError(
						`Nhóm chỉ còn ${Math.max(0, capacity - currentCount)} chỗ trống.`,
						409,
						'GROUP_FULL',
					);
				}

				for (const item of preview.resolved) {
					const slotIndex = await nextMemberOrder(tx, input.groupId);
					await tx.teachingGroupAssignment.create({
						data: {
							boardId: board.id,
							groupId: input.groupId,
							enrollmentId: item.enrollmentId,
							slotIndex,
						},
					});
				}

				await tx.teachingGroupBoard.update({
					where: { id: board.id },
					data: { version: { increment: 1 } },
				});
				await tx.teachingGroupAudit.create({
					data: {
						boardId: board.id,
						actor: 'ADMIN',
						actorUserId: input.actorUserId,
						action: 'ADD_BATCH',
						metadata: {
							groupOrder: group.displayOrder,
							studentCodes: validCodes,
							count: validCodes.length,
						},
					},
				});
			}),
		'GROUP_SLOT_OCCUPIED',
	);

	return getGroupBoard(classId, input.tutorialClassId);
}

export async function previewGroupMembers(
	classId: string,
	tutorialClassId: string,
	groupId: string,
	studentCodes: string[],
	db: Prisma.TransactionClient = prisma,
) {
	assertTeachingGroupBoardEnabled();
	await assertTutorialInClass(classId, tutorialClassId);
	const board = await db.teachingGroupBoard.findUnique({
		where: { tutorialClassId },
		include: {
			groups: true,
			assignments: { include: { group: true } },
		},
	});
	if (!board || !board.groupCount) {
		throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
	}
	const group = board.groups.find((item) => item.id === groupId);
	if (!group) throw new AppError('Nhóm không hợp lệ.', 422, 'INVALID_GROUP');

	const enrollments = await db.teachingEnrollment.findMany({
		where: { classId, status: 'ACTIVE' },
		include: { student: { select: { studentCode: true, familyName: true, givenName: true } } },
	});
	const byCode = new Map(
		enrollments.map((enrollment) => [
			normalizeStudentCode(enrollment.student.studentCode),
			enrollment,
		]),
	);
	const assigned = new Map(
		board.assignments.map((assignment) => [assignment.enrollmentId, assignment.group]),
	);

	const errors: string[] = [];
	const resolved: Array<{
		enrollmentId: string;
		studentCode: string;
		familyName: string;
		givenName: string;
	}> = [];
	const seen = new Set<string>();

	for (const rawCode of studentCodes) {
		const code = normalizeStudentCode(rawCode);
		if (!code) continue;
		if (seen.has(code)) {
			errors.push(`${code}: mã trùng trong danh sách nhập`);
			continue;
		}
		seen.add(code);
		const enrollment = byCode.get(code);
		if (!enrollment) {
			errors.push(`${code}: không tìm thấy trong lớp`);
			continue;
		}
		if (enrollment.tutorialClassId !== tutorialClassId) {
			errors.push(`${code}: không thuộc tutorial đang chọn`);
			continue;
		}
		const existing = assigned.get(enrollment.id);
		if (existing) {
			if (existing.id === groupId) {
				errors.push(`${code}: đã có trong nhóm này`);
			} else {
				errors.push(`${code}: đã thuộc Nhóm ${existing.displayOrder + 1}`);
			}
			continue;
		}
		resolved.push({
			enrollmentId: enrollment.id,
			studentCode: enrollment.student.studentCode,
			familyName: enrollment.student.familyName,
			givenName: enrollment.student.givenName,
		});
	}

	const capacity = effectiveMaxSize(group, board);
	const currentCount = board.assignments.filter(
		(assignment) => assignment.groupId === groupId,
	).length;
	const remaining = Math.max(0, capacity - currentCount);

	return {
		resolved,
		errors,
		remaining,
		capacity,
		currentCount,
	};
}

export async function moveGroupMember(
	classId: string,
	input: {
		tutorialClassId: string;
		enrollmentId: string;
		targetGroupId: string | null;
		expectedVersion?: number;
		actorUserId?: string;
	},
) {
	assertTeachingGroupBoardEnabled();
	await assertTutorialInClass(classId, input.tutorialClassId);

	await withUniqueConflict(
		'Nhóm vừa thay đổi. Hãy tải lại.',
		() =>
			groupTransaction(async (tx) => {
				const board = await tx.teachingGroupBoard.findUnique({
					where: { tutorialClassId: input.tutorialClassId },
					include: { groups: true },
				});
				if (!board || !board.groupCount || board.classId !== classId) {
					throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
				}
				if (input.expectedVersion != null && input.expectedVersion !== board.version) {
					throw new AppError('Bảng đã thay đổi. Hãy tải lại.', 409, 'STALE_BOARD');
				}

				const enrollment = await tx.teachingEnrollment.findFirst({
					where: {
						id: input.enrollmentId,
						classId,
						tutorialClassId: input.tutorialClassId,
						status: 'ACTIVE',
					},
				});
				if (!enrollment)
					throw new AppError('Sinh viên không thuộc tutorial này.', 404, 'NOT_FOUND');

				const existing = await tx.teachingGroupAssignment.findUnique({
					where: { enrollmentId: input.enrollmentId },
					include: { group: true },
				});
				const fromGroupOrder = existing?.group.displayOrder ?? null;

				if (input.targetGroupId == null) {
					if (existing) {
						await tx.teachingGroupAssignment.delete({
							where: { enrollmentId: input.enrollmentId },
						});
					}
				} else {
					const targetGroup = board.groups.find((item) => item.id === input.targetGroupId);
					if (!targetGroup) throw new AppError('Nhóm không hợp lệ.', 422, 'INVALID_GROUP');
					if (existing?.groupId === input.targetGroupId) return;

					const capacity = effectiveMaxSize(targetGroup, board);
					const targetCount = await tx.teachingGroupAssignment.count({
						where: { groupId: input.targetGroupId },
					});
					if (targetCount >= capacity) {
						throw new AppError('Nhóm đích đã đầy.', 409, 'GROUP_FULL');
					}

					if (existing) {
						await tx.teachingGroupAssignment.delete({
							where: { enrollmentId: input.enrollmentId },
						});
					}
					const slotIndex = await nextMemberOrder(tx, input.targetGroupId);
					await tx.teachingGroupAssignment.create({
						data: {
							boardId: board.id,
							groupId: input.targetGroupId,
							enrollmentId: input.enrollmentId,
							slotIndex,
						},
					});
				}

				await tx.teachingGroupBoard.update({
					where: { id: board.id },
					data: { version: { increment: 1 } },
				});
				await tx.teachingGroupAudit.create({
					data: {
						boardId: board.id,
						actor: 'ADMIN',
						actorUserId: input.actorUserId,
						action: input.targetGroupId == null ? 'REMOVE' : 'MOVE',
						enrollmentId: input.enrollmentId,
						fromGroupOrder,
						toGroupOrder:
							input.targetGroupId == null
								? null
								: (board.groups.find((item) => item.id === input.targetGroupId)?.displayOrder ??
									null),
					},
				});
			}),
		'GROUP_SLOT_OCCUPIED',
	);

	return getGroupBoard(classId, input.tutorialClassId);
}

export async function ensureDefaultGroupBoard(classId: string, tutorialClassId: string) {
	assertTeachingGroupBoardEnabled();
	await assertTutorialInClass(classId, tutorialClassId);
	const existing = await prisma.teachingGroupBoard.findUnique({ where: { tutorialClassId } });
	if (existing?.groupCount) return existing;

	const studentCount = await prisma.teachingEnrollment.count({
		where: { classId, tutorialClassId, status: 'ACTIVE' },
	});
	const defaultGroupSize = 5;
	const groupCount = suggestedGroupCount(studentCount, defaultGroupSize);
	return configureGroupBoard(classId, {
		tutorialClassId,
		groupCount,
		defaultGroupSize,
	});
}

export async function removeGroupAssignmentForEnrollment(enrollmentId: string) {
	return groupTransaction((tx) => removeEnrollmentGroup(tx, enrollmentId));
}

export async function getPublicClassIdBySlug(slug: string): Promise<string | null> {
	assertTeachingGroupBoardEnabled();
	const teachingClass = await prisma.teachingClass.findFirst({
		where: { publicSlug: slug, attendanceVisible: true, status: 'ACTIVE' },
		select: { id: true },
	});
	return teachingClass?.id ?? null;
}

export async function getGroupBoardVersion(
	classId: string,
	tutorialClassId: string,
): Promise<number> {
	assertTeachingGroupBoardEnabled();
	const board = await prisma.teachingGroupBoard.findUnique({
		where: { tutorialClassId },
		select: { version: true, classId: true },
	});
	if (!board || board.classId !== classId) return 0;
	return board.version;
}

/** @deprecated Student self-assign disabled */
export async function moveGroupAssignment(): Promise<never> {
	assertTeachingGroupBoardEnabled();
	throw new AppError('Sinh viên không thể tự xếp nhóm.', 403, 'GROUP_MOVE_FORBIDDEN');
}

/** @deprecated Board open/lock removed */
export async function setGroupBoardOpen(): Promise<never> {
	assertTeachingGroupBoardEnabled();
	throw new AppError('Chức năng mở/khóa bảng đã được gỡ bỏ.', 410, 'GONE');
}

/** @deprecated Student claim disabled */
export async function claimGroupViewer(): Promise<never> {
	assertTeachingGroupBoardEnabled();
	throw new AppError('Sinh viên không thể tự xếp nhóm.', 403, 'GROUP_MOVE_FORBIDDEN');
}

/** @deprecated Student claim disabled */
export async function getGroupViewer(): Promise<null> {
	return null;
}

/** @deprecated Student undo disabled */
export async function undoLatestGroupMove(): Promise<never> {
	assertTeachingGroupBoardEnabled();
	throw new AppError('Sinh viên không thể tự xếp nhóm.', 403, 'GROUP_MOVE_FORBIDDEN');
}

/** @deprecated No-op */
export async function forgetGroupViewer(_slug?: string) {
	return;
}

/** @deprecated Randomize removed */
export async function randomizeGroupAssignments(): Promise<never> {
	assertTeachingGroupBoardEnabled();
	throw new AppError('Xếp ngẫu nhiên đã được gỡ bỏ.', 410, 'GONE');
}

/** @deprecated Use moveGroupMember to unassign individually */
export async function clearGroupAssignments(): Promise<never> {
	assertTeachingGroupBoardEnabled();
	throw new AppError('Xóa toàn bộ đã được gỡ bỏ.', 410, 'GONE');
}

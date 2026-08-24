import crypto from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { cookies } from 'next/headers';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { maskStudentCode } from '../domain/privacy';
import { withUniqueConflict } from '../domain/prismaErrors';
import { assertTeachingGroupBoardEnabled } from '../groupBoardAvailability';

import type {
	PublicTeachingGroupBoard,
	TeachingGroupBoard,
	TeachingGroupAssignmentRecord,
	TeachingGroupRecord,
} from '../types';

const COOKIE_PREFIX = 'teaching-group-';
const COOKIE_MAX_AGE = 24 * 60 * 60;

type Placement = { enrollmentId: string; groupId: string; slotIndex: number };
type GroupPosition = { groupOrder: number | null; slotIndex: number | null };

function secret(): string | null {
	const configured = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || process.env.ADMIN_SECRET?.trim();
	if (configured) return configured;
	return process.env.NODE_ENV === 'production' ? null : 'development-group-secret';
}

function cookieName(slug: string) {
	return `${COOKIE_PREFIX}${slug.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function encode(payload: Record<string, string | number>) {
	const signingSecret = secret();
	if (!signingSecret) throw new AppError('Chức năng xếp nhóm đang tạm khóa vì thiếu cấu hình bảo vệ.', 503, 'GROUP_AUTH_UNAVAILABLE');
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = crypto.createHmac('sha256', signingSecret).update(body).digest('base64url');
	return `${body}.${signature}`;
}

function decode(value: string | undefined): { classId: string; enrollmentId: string; epoch: number; exp: number } | null {
	if (!value) return null;
	const [body, signature] = value.split('.');
	if (!body || !signature) return null;
	const signingSecret = secret();
	if (!signingSecret) return null;
	const expected = crypto.createHmac('sha256', signingSecret).update(body).digest('base64url');
	if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
	try {
		const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { classId?: string; enrollmentId?: string; epoch?: number; exp?: number };
		if (!parsed.classId || !parsed.enrollmentId || !Number.isInteger(parsed.epoch) || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
		return { classId: parsed.classId, enrollmentId: parsed.enrollmentId, epoch: Number(parsed.epoch), exp: Number(parsed.exp) };
	} catch {
		return null;
	}
}

async function setViewerCookie(slug: string, payload: { classId: string; enrollmentId: string; epoch: number }) {
	const store = await cookies();
	store.set(cookieName(slug), encode({ ...payload, exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE }), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: COOKIE_MAX_AGE,
		path: '/',
	});
}

export async function forgetGroupViewer(slug: string) {
	assertTeachingGroupBoardEnabled();
	const store = await cookies();
	store.set(cookieName(slug), '', { httpOnly: true, maxAge: 0, path: '/' });
}

async function viewerFor(slug: string, classId: string, epoch: number) {
	const value = (await cookies()).get(cookieName(slug))?.value;
	const token = decode(value);
	if (!token || token.classId !== classId || token.epoch !== epoch) return null;
	const enrollment = await prisma.teachingEnrollment.findFirst({
		where: { id: token.enrollmentId, classId, status: 'ACTIVE' },
		include: { student: { select: { studentCode: true, givenName: true } } },
	});
	return enrollment ? { enrollmentId: enrollment.id, studentCode: enrollment.student.studentCode, givenName: enrollment.student.givenName, claimEpoch: token.epoch } : null;
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
		slotIndex: row.slotIndex,
		role: row.slotIndex === 0 ? 'LEADER' : 'MEMBER',
		studentCode: row.enrollment.student.studentCode,
		familyName: row.enrollment.student.familyName,
		givenName: row.enrollment.student.givenName,
		learningExperience: row.enrollment.learningExperience,
	};
}

export async function getGroupBoard(classId: string): Promise<TeachingGroupBoard>;
export async function getGroupBoard(classId: string, slug: string): Promise<PublicTeachingGroupBoard>;
export async function getGroupBoard(classId: string, slug?: string): Promise<TeachingGroupBoard | PublicTeachingGroupBoard> {
	assertTeachingGroupBoardEnabled();
	const [teachingClass, board] = await Promise.all([
		prisma.teachingClass.findUnique({ where: { id: classId }, select: { id: true, publicSlug: true } }),
		prisma.teachingGroupBoard.findUnique({
			where: { classId },
			include: {
				groups: { orderBy: { displayOrder: 'asc' } },
			assignments: { include: { group: true, enrollment: { include: { student: { select: { studentCode: true, familyName: true, givenName: true } } } } } },
			},
		}),
	]);
	if (!teachingClass) throw new AppError('Class not found', 404, 'NOT_FOUND');
	const students = await prisma.teachingEnrollment.findMany({
		where: { classId, status: 'ACTIVE' },
		orderBy: [{ orderNo: 'asc' }, { createdAt: 'asc' }],
		include: { student: { select: { studentCode: true, familyName: true, givenName: true } } },
	});
	const assignments = board?.assignments.map(mapAssignment) ?? [];
	const byGroup = new Map<string, TeachingGroupAssignmentRecord[]>();
	for (const assignment of assignments) byGroup.set(assignment.groupId, [...(byGroup.get(assignment.groupId) ?? []), assignment]);
	const groups: TeachingGroupRecord[] = (board?.groups ?? []).map((group) => ({
		id: group.id,
		displayOrder: group.displayOrder,
		assignments: (byGroup.get(group.id) ?? []).sort((a, b) => a.slotIndex - b.slotIndex),
	}));
	const assigned = new Set(assignments.map((item) => item.enrollmentId));
	const unassigned = students.filter((student) => !assigned.has(student.id)).map((student) => ({
		enrollmentId: student.id,
		studentCode: slug ? maskStudentCode(student.student.studentCode) : student.student.studentCode,
		familyName: student.student.familyName,
		givenName: student.student.givenName,
		learningExperience: student.learningExperience,
	}));
	const data = {
		classId,
		groupCount: board?.groupCount ?? 0,
		groupSize: board?.groupSize ?? 0,
		isOpen: board?.isOpen ?? false,
		version: board?.version ?? 0,
		claimEpoch: board?.claimEpoch ?? 0,
		configured: Boolean(board && board.groupCount > 0 && board.groupSize > 0),
		activeStudentCount: students.length,
		groups,
		unassigned,
	};
	if (!slug) return data;
	data.groups = data.groups.map((group) => ({
		...group,
		assignments: group.assignments.map((assignment) => ({
			...assignment,
			studentCode: maskStudentCode(assignment.studentCode),
		})),
	}));
	const viewer = board ? await viewerFor(slug, classId, board.claimEpoch) : null;
	return { ...data, slug, viewerEnrollmentId: viewer?.enrollmentId ?? null, undoAvailableCount: viewer && board ? await countUndoableMoves(board.id, viewer.enrollmentId, board.claimEpoch) : 0 };
}

async function ensureBoard(tx: Prisma.TransactionClient, classId: string) {
	return tx.teachingGroupBoard.upsert({
		where: { classId },
		create: { classId },
		update: {},
		include: { groups: { orderBy: { displayOrder: 'asc' } } },
	});
}

export async function configureGroupBoard(classId: string, input: { groupCount: number; groupSize: number; expectedVersion?: number }) {
	assertTeachingGroupBoardEnabled();
	if (!Number.isInteger(input.groupCount) || input.groupCount < 1 || input.groupCount > 50 || !Number.isInteger(input.groupSize) || input.groupSize < 2 || input.groupSize > 50) {
		throw new AppError('Số nhóm phải từ 1–50 và sức chứa mỗi nhóm từ 2–50.', 422, 'VALIDATION');
	}
	await prisma.$transaction(async (tx) => {
		const board = await ensureBoard(tx, classId);
		if (board.isOpen) throw new AppError('Hãy khóa bảng trước khi đổi cấu trúc nhóm.', 409, 'GROUP_BOARD_OPEN');
		if (input.expectedVersion != null && input.expectedVersion !== board.version) throw new AppError('Bảng đã thay đổi. Hãy tải lại trước khi lưu.', 409, 'STALE_BOARD');
		const assignments = await tx.teachingGroupAssignment.findMany({ where: { boardId: board.id }, include: { group: true } });
		for (const assignment of assignments) {
			if (assignment.group.displayOrder >= input.groupCount || assignment.slotIndex >= input.groupSize) {
				throw new AppError('Không thể giảm cấu trúc khi vẫn còn người ở các ô sẽ bị xóa.', 409, 'GROUP_CAPACITY_CONFLICT');
			}
		}
		const groups = [...board.groups];
		for (let index = 0; index < input.groupCount; index += 1) {
			const current = groups[index];
			if (!current) await tx.teachingGroup.create({ data: { boardId: board.id, displayOrder: index } });
		}
		await tx.teachingGroup.deleteMany({ where: { boardId: board.id, displayOrder: { gte: input.groupCount } } });
		await tx.teachingGroupBoard.update({ where: { id: board.id }, data: { groupCount: input.groupCount, groupSize: input.groupSize, version: { increment: 1 } } });
		await tx.teachingGroupAudit.create({ data: { boardId: board.id, actor: 'ADMIN', action: 'CONFIGURE', metadata: { groupCount: input.groupCount, groupSize: input.groupSize } } });
	});
	return getGroupBoard(classId);
}

export async function setGroupBoardOpen(classId: string, open: boolean) {
	assertTeachingGroupBoardEnabled();
	return prisma.$transaction(async (tx) => {
		const board = await ensureBoard(tx, classId);
		if (!board.groupCount || !board.groupSize) throw new AppError('Hãy thiết lập số nhóm và sức chứa trước.', 422, 'GROUP_BOARD_UNCONFIGURED');
		if (board.isOpen === open) return board;
		if (open) {
			const [klass, count] = await Promise.all([
				tx.teachingClass.findUnique({ where: { id: classId }, select: { status: true, attendanceVisible: true, publicSlug: true } }),
				tx.teachingEnrollment.count({ where: { classId, status: 'ACTIVE' } }),
			]);
			if (!klass || klass.status !== 'ACTIVE' || !klass.attendanceVisible || !klass.publicSlug) throw new AppError('Lớp phải đang hoạt động và được chia sẻ trước khi mở bảng.', 409, 'CLASS_NOT_PUBLIC');
			if (count > board.groupCount * board.groupSize) throw new AppError('Tổng sức chứa nhóm chưa đủ cho sĩ số hiện tại.', 409, 'GROUP_CAPACITY_TOO_SMALL');
		}
		const updated = await tx.teachingGroupBoard.update({ where: { id: board.id }, data: { isOpen: open, claimEpoch: { increment: 1 }, version: { increment: 1 }, openedAt: open ? new Date() : board.openedAt, lockedAt: open ? null : new Date() } });
		await tx.teachingGroupAudit.create({ data: { boardId: board.id, actor: 'ADMIN', action: open ? 'OPEN' : 'LOCK' } });
		return updated;
	});
}

async function assertTarget(tx: Prisma.TransactionClient, boardId: string, groupId: string, slotIndex: number, groupSize: number) {
	const group = await tx.teachingGroup.findFirst({ where: { id: groupId, boardId } });
	if (!group || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= groupSize) throw new AppError('Ô nhóm không hợp lệ.', 422, 'INVALID_GROUP_SLOT');
	const occupied = await tx.teachingGroupAssignment.findFirst({ where: { groupId, slotIndex } });
	if (occupied) throw new AppError('Ô này vừa được người khác chọn. Hãy chọn ô trống.', 409, 'GROUP_SLOT_OCCUPIED');
	return group;
}

export async function moveGroupAssignment(classId: string, input: { enrollmentId: string; groupId: string | null; slotIndex?: number; expectedVersion?: number; actor: 'ADMIN' | 'STUDENT'; actorEnrollmentId?: string; actorClaimEpoch?: number }) {
	assertTeachingGroupBoardEnabled();
	await withUniqueConflict(
		'Ô này vừa được người khác chọn. Hãy chọn ô trống.',
		() => prisma.$transaction(async (tx) => {
		const board = await tx.teachingGroupBoard.findUnique({ where: { classId } });
		if (!board || !board.groupCount) throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
		if (input.actor === 'STUDENT' && (!board.isOpen || input.actorEnrollmentId !== input.enrollmentId || input.actorClaimEpoch !== board.claimEpoch)) throw new AppError('Bảng đã khóa hoặc lựa chọn tên đã hết hiệu lực.', 403, 'GROUP_MOVE_FORBIDDEN');
		if (input.expectedVersion != null && input.expectedVersion !== board.version) throw new AppError('Bảng đã thay đổi. Hãy tải lại.', 409, 'STALE_BOARD');
		const enrollment = await tx.teachingEnrollment.findFirst({ where: { id: input.enrollmentId, classId, status: 'ACTIVE' } });
		if (!enrollment) throw new AppError('Sinh viên không thuộc lớp này.', 404, 'NOT_FOUND');
		const existing = await tx.teachingGroupAssignment.findUnique({ where: { enrollmentId: input.enrollmentId }, include: { group: true } });
		const fromGroupOrder = existing?.group.displayOrder ?? null;
		const fromSlotIndex = existing?.slotIndex ?? null;
		let toGroupOrder: number | null = null;
		if (input.groupId == null) {
			if (existing) await tx.teachingGroupAssignment.delete({ where: { enrollmentId: input.enrollmentId } });
		} else {
			if (existing?.groupId === input.groupId && existing.slotIndex === (input.slotIndex ?? 0)) return;
			const targetGroup = await assertTarget(tx, board.id, input.groupId, input.slotIndex ?? 0, board.groupSize);
			toGroupOrder = targetGroup.displayOrder;
			if (existing) {
				await tx.teachingGroupAssignment.delete({ where: { enrollmentId: input.enrollmentId } });
			}
			await tx.teachingGroupAssignment.create({ data: { boardId: board.id, groupId: input.groupId, enrollmentId: input.enrollmentId, slotIndex: input.slotIndex ?? 0 } });
		}
		await tx.teachingGroupBoard.update({ where: { id: board.id }, data: { version: { increment: 1 } } });
		await tx.teachingGroupAudit.create({ data: { boardId: board.id, actor: input.actor, action: 'MOVE', actorEnrollmentId: input.actorEnrollmentId, enrollmentId: input.enrollmentId, fromGroupOrder, fromSlotIndex, toGroupOrder, toSlotIndex: input.groupId ? input.slotIndex ?? 0 : null, metadata: input.actor === 'STUDENT' ? { claimEpoch: board.claimEpoch } : undefined } });
	}),
		'GROUP_SLOT_OCCUPIED',
	);
	return getGroupBoard(classId);
}

export async function clearGroupAssignments(classId: string, expectedVersion?: number) {
	assertTeachingGroupBoardEnabled();
	await prisma.$transaction(async (tx) => {
		const board = await tx.teachingGroupBoard.findUnique({ where: { classId } });
		if (!board) throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
		if (board.isOpen) throw new AppError('Hãy khóa bảng trước khi xóa toàn bộ.', 409, 'GROUP_BOARD_OPEN');
		if (expectedVersion != null && expectedVersion !== board.version) throw new AppError('Bảng đã thay đổi. Hãy tải lại.', 409, 'STALE_BOARD');
		await tx.teachingGroupAssignment.deleteMany({ where: { boardId: board.id } });
		await tx.teachingGroupBoard.update({ where: { id: board.id }, data: { version: { increment: 1 } } });
		await tx.teachingGroupAudit.create({ data: { boardId: board.id, actor: 'ADMIN', action: 'CLEAR' } });
	});
	return getGroupBoard(classId);
}

function seededShuffle<T>(items: T[], seed: number) {
	let value = seed >>> 0;
	const next = () => {
		value = (value + 0x6d2b79f5) | 0;
		let t = Math.imul(value ^ (value >>> 15), 1 | value);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const result = [...items];
	for (let index = result.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(next() * (index + 1));
		[result[index], result[swap]] = [result[swap], result[index]];
	}
	return result;
}

export async function randomizeGroupAssignments(classId: string, input: { expectedVersion?: number; placements?: Placement[]; seed?: number }) {
	assertTeachingGroupBoardEnabled();
	const board = await prisma.teachingGroupBoard.findUnique({ where: { classId }, include: { groups: { orderBy: { displayOrder: 'asc' } }, assignments: true } });
	if (!board) throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
	if (board.isOpen) throw new AppError('Hãy khóa bảng trước khi xếp ngẫu nhiên.', 409, 'GROUP_BOARD_OPEN');
	if (input.expectedVersion != null && input.expectedVersion !== board.version) throw new AppError('Bảng đã thay đổi. Hãy tải lại.', 409, 'STALE_BOARD');
	const assigned = new Set(board.assignments.map((assignment) => assignment.enrollmentId));
	const students = await prisma.teachingEnrollment.findMany({ where: { classId, status: 'ACTIVE', id: { notIn: [...assigned] } }, orderBy: { orderNo: 'asc' }, include: { student: true } });
	const occupied = new Set(board.assignments.map((assignment) => `${assignment.groupId}:${assignment.slotIndex}`));
	const slots = board.groups.flatMap((group) => Array.from({ length: board.groupSize }, (_, slotIndex) => ({ groupId: group.id, slotIndex }))).filter((slot) => !occupied.has(`${slot.groupId}:${slot.slotIndex}`));
	if (!input.placements) {
		const seed = input.seed ?? crypto.randomInt(1, 2 ** 31 - 1);
		const shuffled = seededShuffle(students, seed);
		return { preview: true, seed, version: board.version, placements: shuffled.slice(0, slots.length).map((student, index) => ({ enrollmentId: student.id, groupId: slots[index]!.groupId, slotIndex: slots[index]!.slotIndex, studentCode: student.student.studentCode })) };
	}
	const placements = input.placements ?? [];
	const duplicateEnrollment = new Set<string>();
	const duplicateSlot = new Set<string>();
	for (const placement of placements) {
		if (duplicateEnrollment.has(placement.enrollmentId) || duplicateSlot.has(`${placement.groupId}:${placement.slotIndex}`)) {
			throw new AppError('Preview xếp ngẫu nhiên không hợp lệ. Hãy tạo lại preview.', 422, 'INVALID_RANDOM_PREVIEW');
		}
		duplicateEnrollment.add(placement.enrollmentId);
		duplicateSlot.add(`${placement.groupId}:${placement.slotIndex}`);
	}
	await withUniqueConflict(
		'Ô này vừa được người khác chọn. Hãy chọn ô trống.',
		() =>
			prisma.$transaction(async (tx) => {
				const current = await tx.teachingGroupBoard.findUnique({ where: { classId } });
				if (!current || current.version !== board.version)
					throw new AppError('Bảng đã thay đổi. Hãy tạo lại preview.', 409, 'STALE_BOARD');
				for (const placement of placements) {
					await assertTarget(tx, current.id, placement.groupId, placement.slotIndex, current.groupSize);
					const student = await tx.teachingEnrollment.findFirst({
						where: { id: placement.enrollmentId, classId, status: 'ACTIVE' },
					});
					if (!student) throw new AppError('Sinh viên không thuộc lớp này.', 404, 'NOT_FOUND');
					await tx.teachingGroupAssignment.create({
						data: {
							boardId: current.id,
							groupId: placement.groupId,
							enrollmentId: placement.enrollmentId,
							slotIndex: placement.slotIndex,
						},
					});
				}
				await tx.teachingGroupBoard.update({
					where: { id: current.id },
					data: { version: { increment: 1 } },
				});
				await tx.teachingGroupAudit.create({
					data: {
						boardId: current.id,
						actor: 'ADMIN',
						action: 'RANDOMIZE',
						metadata: { count: placements.length, seed: input.seed ?? null },
					},
				});
			}),
		'GROUP_SLOT_OCCUPIED',
	);
	return getGroupBoard(classId);
}

export async function claimGroupViewer(slug: string, enrollmentId: string) {
	assertTeachingGroupBoardEnabled();
	const klass = await prisma.teachingClass.findFirst({ where: { publicSlug: slug, attendanceVisible: true, status: 'ACTIVE' }, select: { id: true } });
	if (!klass) throw new AppError('Không tìm thấy lớp.', 404, 'NOT_FOUND');
	const board = await prisma.teachingGroupBoard.findUnique({ where: { classId: klass.id }, select: { id: true, groupCount: true, groupSize: true, isOpen: true, claimEpoch: true } });
	if (!board || !board.groupCount || !board.groupSize) throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
	if (!board.isOpen) throw new AppError('Bảng đang khóa. Hãy chờ giảng viên mở bảng.', 409, 'GROUP_BOARD_LOCKED');
	const enrollment = await prisma.teachingEnrollment.findFirst({
		where: { id: enrollmentId, classId: klass.id, status: 'ACTIVE' },
	});
	if (!enrollment) throw new AppError('Không tìm thấy sinh viên trong lớp.', 404, 'NOT_FOUND');
	await setViewerCookie(slug, { classId: klass.id, enrollmentId: enrollment.id, epoch: board.claimEpoch });
	return getGroupBoard(klass.id, slug);
}

export async function getGroupViewer(slug: string) {
	assertTeachingGroupBoardEnabled();
	const klass = await prisma.teachingClass.findFirst({ where: { publicSlug: slug, attendanceVisible: true, status: 'ACTIVE' }, select: { id: true } });
	if (!klass) return null;
	const board = await prisma.teachingGroupBoard.findUnique({ where: { classId: klass.id }, select: { claimEpoch: true } });
	return board ? viewerFor(slug, klass.id, board.claimEpoch) : null;
}

function auditClaimEpoch(metadata: unknown): number | null {
	if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
	const value = (metadata as { claimEpoch?: unknown }).claimEpoch;
	return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

async function countUndoableMoves(boardId: string, enrollmentId: string, claimEpoch: number) {
	const [moves, undos] = await Promise.all([
		prisma.teachingGroupAudit.findMany({ where: { boardId, actor: 'STUDENT', actorEnrollmentId: enrollmentId, action: 'MOVE' }, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, metadata: true } }),
		prisma.teachingGroupAudit.findMany({ where: { boardId, actor: 'STUDENT', actorEnrollmentId: enrollmentId, action: 'UNDO' }, orderBy: { createdAt: 'desc' }, take: 3, select: { metadata: true } }),
	]);
	const undone = new Set(undos.map((audit) => auditClaimEpoch(audit.metadata) === claimEpoch ? ((audit.metadata as { undoOf?: unknown })?.undoOf) : null).filter((value): value is string => typeof value === 'string'));
	return moves.filter((move) => auditClaimEpoch(move.metadata) === claimEpoch && !undone.has(move.id)).length;
}

export async function undoLatestGroupMove(slug: string) {
	assertTeachingGroupBoardEnabled();
	const klass = await prisma.teachingClass.findFirst({ where: { publicSlug: slug, attendanceVisible: true, status: 'ACTIVE' }, select: { id: true } });
	if (!klass) throw new AppError('Không tìm thấy lớp.', 404, 'NOT_FOUND');
	const viewer = await getGroupViewer(slug);
	if (!viewer) throw new AppError('Hãy chọn tên của bạn trước khi hoàn tác.', 401, 'IDENTITY_REQUIRED');
	await withUniqueConflict(
		'Ô này vừa được người khác chọn. Hãy chọn ô trống.',
		() => prisma.$transaction(async (tx) => {
		const board = await tx.teachingGroupBoard.findUnique({ where: { classId: klass.id } });
		if (!board || !board.groupCount) throw new AppError('Bảng xếp nhóm chưa được thiết lập.', 404, 'GROUP_BOARD_NOT_FOUND');
		if (!board.isOpen) throw new AppError('Bảng đang khóa. Không thể hoàn tác.', 409, 'GROUP_BOARD_LOCKED');
		const [moves, undos] = await Promise.all([
			tx.teachingGroupAudit.findMany({ where: { boardId: board.id, actor: 'STUDENT', actorEnrollmentId: viewer.enrollmentId, action: 'MOVE' }, orderBy: { createdAt: 'desc' }, take: 3 }),
			tx.teachingGroupAudit.findMany({ where: { boardId: board.id, actor: 'STUDENT', actorEnrollmentId: viewer.enrollmentId, action: 'UNDO' }, orderBy: { createdAt: 'desc' }, take: 3 }),
		]);
		const undone = new Set(undos.map((audit) => auditClaimEpoch(audit.metadata) === board.claimEpoch ? ((audit.metadata as { undoOf?: unknown })?.undoOf) : null).filter((value): value is string => typeof value === 'string'));
		const source = moves.find((move) => auditClaimEpoch(move.metadata) === board.claimEpoch && !undone.has(move.id));
		if (!source) throw new AppError('Không còn thao tác nào để hoàn tác.', 409, 'UNDO_EMPTY');
		const current = await tx.teachingGroupAssignment.findUnique({ where: { enrollmentId: viewer.enrollmentId }, include: { group: true } });
		const currentPosition: GroupPosition = { groupOrder: current?.group.displayOrder ?? null, slotIndex: current?.slotIndex ?? null };
		if (currentPosition.groupOrder !== source.toGroupOrder || currentPosition.slotIndex !== source.toSlotIndex) throw new AppError('Không thể hoàn tác vì vị trí hiện tại đã thay đổi.', 409, 'UNDO_CONFLICT');
		let restoreGroupId: string | null = null;
		if (source.fromGroupOrder != null) {
			const restoreGroup = await tx.teachingGroup.findFirst({ where: { boardId: board.id, displayOrder: source.fromGroupOrder } });
			if (!restoreGroup || source.fromSlotIndex == null) throw new AppError('Vị trí cũ không còn tồn tại.', 409, 'UNDO_CONFLICT');
			const occupied = await tx.teachingGroupAssignment.findFirst({ where: { groupId: restoreGroup.id, slotIndex: source.fromSlotIndex } });
			if (occupied) throw new AppError('Không thể hoàn tác vì vị trí cũ đã có người.', 409, 'UNDO_CONFLICT');
			restoreGroupId = restoreGroup.id;
		}
		if (current) await tx.teachingGroupAssignment.delete({ where: { enrollmentId: viewer.enrollmentId } });
		if (restoreGroupId) await tx.teachingGroupAssignment.create({ data: { boardId: board.id, groupId: restoreGroupId, enrollmentId: viewer.enrollmentId, slotIndex: source.fromSlotIndex! } });
		await tx.teachingGroupBoard.update({ where: { id: board.id }, data: { version: { increment: 1 } } });
		await tx.teachingGroupAudit.create({ data: { boardId: board.id, actor: 'STUDENT', action: 'UNDO', actorEnrollmentId: viewer.enrollmentId, enrollmentId: viewer.enrollmentId, fromGroupOrder: source.toGroupOrder, fromSlotIndex: source.toSlotIndex, toGroupOrder: source.fromGroupOrder, toSlotIndex: source.fromSlotIndex, metadata: { claimEpoch: board.claimEpoch, undoOf: source.id } } });
	}),
		'GROUP_SLOT_OCCUPIED',
	);
	return getGroupBoard(klass.id, slug);
}

export async function getPublicClassIdBySlug(slug: string): Promise<string | null> {
	assertTeachingGroupBoardEnabled();
	const teachingClass = await prisma.teachingClass.findFirst({
		where: { publicSlug: slug, attendanceVisible: true, status: 'ACTIVE' },
		select: { id: true },
	});
	return teachingClass?.id ?? null;
}

export async function getGroupBoardVersion(classId: string): Promise<number> {
	assertTeachingGroupBoardEnabled();
	const board = await prisma.teachingGroupBoard.findUnique({
		where: { classId },
		select: { version: true },
	});
	return board?.version ?? 0;
}

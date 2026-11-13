import type { ArenaAwardLevel } from '../domain/recallArena';

import { AppError } from '@/lib/appError';

import { vietnamTodayIso } from '../domain/recallArena';
import * as repo from '../repositories/teachingRepository';
import type { RecallArenaTurnInput } from '../schemas';
import type { RecallArenaTurnRecord } from '../types';
import { notFound } from './classService';
import { awardRecallArenaCpInTransaction, recallArenaTransaction } from './recallArenaService';

const RESULT_TO_DB = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' } as const;
const RESULT_FROM_DB = { PASS: 'pass', FAIL: 'fail', SKIP: 'skip' } as const;

const turnSelect = {
	clientId: true,
	playedAt: true,
	playedOn: true,
	enrollmentId: true,
	guestGroup: true,
	playerName: true,
	studentCode: true,
	cardId: true,
	question: true,
	result: true,
	award: true,
	cpAfter: true,
	giftAfter: true,
} as const;

type TurnRow = {
	clientId: string;
	playedAt: Date;
	playedOn: Date;
	enrollmentId: string | null;
	guestGroup: 'CHALLENGE' | 'SUPPORT' | null;
	playerName: string;
	studentCode: string;
	cardId: string | null;
	question: string;
	result: keyof typeof RESULT_FROM_DB;
	award: { toString(): string } | null;
	cpAfter: { toString(): string } | null;
	giftAfter: number | null;
};

function decimal(value: { toString(): string } | null): number | null {
	return value == null ? null : Number(value.toString());
}

function mapTurn(row: TurnRow): RecallArenaTurnRecord {
	return {
		clientId: row.clientId,
		playedAt: row.playedAt.getTime(),
		playedOn: row.playedOn.toISOString().slice(0, 10),
		enrollmentId: row.enrollmentId,
		guest: row.studentCode === '',
		guestGroup: row.guestGroup,
		playerName: row.playerName,
		studentCode: row.studentCode,
		cardId: row.cardId,
		question: row.question,
		result: RESULT_FROM_DB[row.result],
		award: decimal(row.award),
		cpAfter: decimal(row.cpAfter),
		giftAfter: row.giftAfter,
	};
}

/** A Vietnam calendar day as the DATE column stores it. */
function dayColumn(isoDay: string) {
	return new Date(`${isoDay}T00:00:00.000Z`);
}

async function requireCourse(courseId: string) {
	const course = await repo.getCourse(courseId);
	if (!course) notFound('Course');
}

/** Save the grade and its history together. Retries reuse the committed result. */
export async function recordRecallArenaTurn(
	courseId: string,
	input: RecallArenaTurnInput,
	userId?: string,
): Promise<RecallArenaTurnRecord> {
	await requireCourse(courseId);
	return recallArenaTransaction(async (tx) => {
		const where = { clientId: input.clientId };
		const existing = await tx.teachingArenaTurn.findUnique({
			where,
			select: { ...turnSelect, courseId: true },
		});
		const result = RESULT_TO_DB[input.result];
		const award = input.award ?? null;
		const scored = {
			result,
			award,
			cpAfter: input.cpAfter ?? null,
			giftAfter: input.giftAfter ?? null,
		};
		if (existing) {
			if (existing.courseId !== courseId) {
				throw new AppError('Lượt này đã lưu cho môn khác', 409, 'CONFLICT');
			}
			if (input.grade) {
				if (
					existing.enrollmentId !== input.enrollmentId ||
					existing.result !== result ||
					decimal(existing.award) !== award ||
					(input.grade.kind === 'cp' ? existing.cpAfter == null : existing.giftAfter == null)
				) {
					throw new AppError(
						'Lượt này đã được chấm. Hãy thử lại với mức đã chọn.',
						409,
						'CONFLICT',
					);
				}
				return mapTurn(existing);
			}
			// Older clients can retry a CP history update without grading again.
			if (
				existing.enrollmentId !== (input.enrollmentId ?? null) ||
				(!input.enrollmentId && existing.playerName !== input.guestName) ||
				existing.result !== result
			) {
				throw new AppError('Lượt này đã được lưu với kết quả khác', 409, 'CONFLICT');
			}
			return mapTurn(
				await tx.teachingArenaTurn.update({ where, data: scored, select: turnSelect }),
			);
		}

		const enrollment = input.enrollmentId
			? await tx.teachingEnrollment.findFirst({
					where: { id: input.enrollmentId, class: { courseId } },
					select: {
						id: true,
						status: true,
						student: { select: { studentCode: true, familyName: true, givenName: true } },
					},
				})
			: null;
		if (input.enrollmentId && !enrollment) notFound('Enrollment');
		if (input.grade && enrollment?.status !== 'ACTIVE') notFound('Enrollment');
		const student = enrollment?.student;
		const card = input.cardId
			? await tx.activeRecallCard.findFirst({
					where: { id: input.cardId, deck: { courseId } },
					select: { id: true, question: true, questionVi: true },
				})
			: null;

		let cpPrevious: number | undefined;
		if (input.grade?.kind === 'cp') {
			const cp = await awardRecallArenaCpInTransaction(
				tx,
				input.grade.sessionId,
				{ enrollmentId: enrollment!.id, points: input.award as ArenaAwardLevel },
				userId,
			);
			scored.cpAfter = cp.points;
			cpPrevious = cp.previous;
		} else if (input.grade?.kind === 'gift') {
			const updated = await tx.teachingEnrollment.update({
				where: { id: enrollment!.id },
				data: { giftCount: { increment: 1 } },
				select: { giftCount: true },
			});
			scored.giftAfter = updated.giftCount;
		}

		const playedAt = new Date(input.playedAt);
		const row = await tx.teachingArenaTurn.create({
			data: {
				clientId: input.clientId,
				courseId,
				playedAt,
				playedOn: dayColumn(vietnamTodayIso(playedAt)),
				enrollmentId: enrollment?.id ?? null,
				playerName: student
					? `${student.familyName} ${student.givenName}`.trim()
					: input.guestName!,
				studentCode: student?.studentCode ?? '',
				guestGroup: student ? null : (input.guestGroup ?? null),
				cardId: card?.id ?? null,
				question: card?.question || card?.questionVi || '',
				recordedById: userId ?? null,
				...scored,
			},
			select: turnSelect,
		});
		return { ...mapTurn(row), ...(cpPrevious != null ? { cpPrevious } : {}) };
	});
}

/** Every call saved for a course on one game day, oldest first. */
export async function listRecallArenaTurns(
	courseId: string,
	isoDay: string,
): Promise<RecallArenaTurnRecord[]> {
	await requireCourse(courseId);
	const rows = await repo.prisma.teachingArenaTurn.findMany({
		where: { courseId, playedOn: dayColumn(isoDay) },
		orderBy: [{ playedAt: 'asc' }, { createdAt: 'asc' }],
		select: turnSelect,
	});
	return rows.map((row) => mapTurn(row as TurnRow));
}

/** Game days that have saved calls, newest first, for the history picker. */
export async function listRecallArenaDays(courseId: string, limit = 60): Promise<string[]> {
	await requireCourse(courseId);
	const rows = await repo.prisma.teachingArenaTurn.findMany({
		where: { courseId },
		distinct: ['playedOn'],
		orderBy: { playedOn: 'desc' },
		take: limit,
		select: { playedOn: true },
	});
	return rows.map((row) => row.playedOn.toISOString().slice(0, 10));
}

import { AppError } from '@/lib/appError';

import { vietnamTodayIso } from '../domain/recallArena';
import * as repo from '../repositories/teachingRepository';
import type { RecallArenaTurnInput } from '../schemas';
import type { RecallArenaTurnRecord } from '../types';
import { notFound } from './classService';

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

/**
 * Save one arena call. A student must be enrolled in a class of this course;
 * anyone else is kept by the name the lecturer typed. Sending the same turn
 * again (same clientId) updates its result instead of adding a second row.
 */
export async function recordRecallArenaTurn(
	courseId: string,
	input: RecallArenaTurnInput,
	userId?: string,
): Promise<RecallArenaTurnRecord> {
	await requireCourse(courseId);
	let player: { enrollmentId: string | null; playerName: string; studentCode: string };
	if (input.enrollmentId) {
		const enrollment = await repo.prisma.teachingEnrollment.findFirst({
			where: { id: input.enrollmentId, class: { courseId } },
			select: {
				id: true,
				student: { select: { studentCode: true, familyName: true, givenName: true } },
			},
		});
		if (!enrollment) notFound('Enrollment');
		const { student } = enrollment;
		player = {
			enrollmentId: enrollment.id,
			playerName: `${student.familyName} ${student.givenName}`.trim(),
			studentCode: student.studentCode,
		};
	} else {
		player = { enrollmentId: null, playerName: input.guestName!, studentCode: '' };
	}
	// A card deleted since the turn was played is kept as "no card".
	const card = input.cardId
		? await repo.prisma.activeRecallCard.findFirst({
				where: { id: input.cardId, deck: { courseId } },
				select: { id: true, question: true },
			})
		: null;
	const playedAt = new Date(input.playedAt);
	const scored = {
		result: RESULT_TO_DB[input.result],
		award: input.award ?? null,
		cpAfter: input.cpAfter ?? null,
		giftAfter: input.giftAfter ?? null,
	};

	const existing = await repo.prisma.teachingArenaTurn.findUnique({
		where: { clientId: input.clientId },
		select: { courseId: true },
	});
	if (existing && existing.courseId !== courseId) {
		throw new AppError('Lượt này đã lưu cho môn khác', 409, 'CONFLICT');
	}
	const row = existing
		? await repo.prisma.teachingArenaTurn.update({
				where: { clientId: input.clientId },
				data: scored,
				select: turnSelect,
			})
		: await repo.prisma.teachingArenaTurn.create({
				data: {
					clientId: input.clientId,
					courseId,
					playedAt,
					playedOn: dayColumn(vietnamTodayIso(playedAt)),
					...player,
					guestGroup: player.enrollmentId ? null : (input.guestGroup ?? null),
					cardId: card?.id ?? null,
					question: card?.question ?? '',
					recordedById: userId ?? null,
					...scored,
				},
				select: turnSelect,
			});
	return mapTurn(row as TurnRow);
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

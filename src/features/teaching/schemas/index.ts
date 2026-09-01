import { z } from 'zod';

import { AppError } from '@/lib/appError';

export function parseWithAppError<T>(schema: z.ZodType<T>, data: unknown): T {
	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		const fields: Record<string, string> = {};
		for (const issue of parsed.error.issues) {
			const key = issue.path.join('.') || '_';
			if (!fields[key]) fields[key] = issue.message;
		}
		throw new AppError('Invalid data', 422, 'VALIDATION', fields);
	}
	return parsed.data;
}

export async function parseJsonWithAppError<T>(schema: z.ZodType<T>, request: Request): Promise<T> {
	let data: unknown;
	try {
		data = await request.json();
	} catch {
		throw new AppError('Invalid JSON body', 400, 'VALIDATION');
	}
	return parseWithAppError(schema, data);
}

export const teachingClassStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);
export const teachingEnrollmentStatusSchema = z.enum(['ACTIVE', 'WITHDRAWN']);
export const teachingAttendanceMethodSchema = z.enum(['ROLL_CALL', 'SHORT_TEST']);
export const teachingAttendanceStatusSchema = z.enum([
	'PRESENT',
	'LATE',
	'ABSENT_UNEXCUSED',
	'ABSENT_EXCUSED',
	'MAKEUP',
]);

const trimmed = (max: number) => z.string().trim().max(max);

export const createTeachingClassSchema = z.object({
	courseCode: trimmed(40).min(1),
	courseName: trimmed(200).min(1),
	groupNo: trimmed(20).min(1),
	term: trimmed(120).min(1),
	credits: z.number().int().min(1).max(20).nullable().optional(),
	lecturerName: trimmed(120).optional(),
	lecturerCode: trimmed(40).optional(),
	totalWeeks: z.number().int().min(1).max(20).optional(),
});

export const updateTeachingClassSchema = z
	.object({
		courseCode: trimmed(40).min(1).optional(),
		courseName: trimmed(200).min(1).optional(),
		groupNo: trimmed(20).min(1).optional(),
		term: trimmed(120).min(1).optional(),
		credits: z.number().int().min(1).max(20).nullable().optional(),
		lecturerName: trimmed(120).optional(),
		lecturerCode: trimmed(40).optional(),
		totalWeeks: z.number().int().min(1).max(20).optional(),
		attendanceMaxPoints: z.number().min(0).max(10).multipleOf(0.5).optional(),
		cpMaxPoints: z.number().min(0).max(10).multipleOf(0.5).optional(),
		absenceDeductionPoints: z.number().min(0).max(10).multipleOf(0.25).optional(),
		lateDeductionPoints: z.number().min(0).max(10).multipleOf(0.25).optional(),
		lateCountsTowardAbsenceThreshold: z.boolean().optional(),
		giftDeductionPoints: z.number().min(0).max(10).multipleOf(0.25).optional(),
		absenceThresholdPercent: z.number().int().min(0).max(100).optional(),
		lateGraceMinutes: z.number().int().min(0).max(180).optional(),
		status: teachingClassStatusSchema.optional(),
	})
	.strict();

export const createTutorialSchema = z.object({
	code: trimmed(20).min(1),
	name: trimmed(120).min(1),
	room: trimmed(80).optional(),
	scheduleNote: trimmed(200).optional(),
});

export const updateTutorialSchema = createTutorialSchema.partial();

export const studentIdentitySchema = z.object({
	studentCode: trimmed(40).min(1),
	familyName: trimmed(120).min(1),
	givenName: trimmed(80).min(1),
	dateOfBirth: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable()
		.optional(),
	homeClassCode: trimmed(40).optional(),
	majorName: trimmed(160).optional(),
	phone: trimmed(40).nullable().optional(),
	email: z.string().trim().email().max(200).nullable().optional(),
});

export const addEnrollmentSchema = studentIdentitySchema.extend({
	orderNo: z.number().int().min(1).optional(),
	tutorialClassId: z.string().min(1).nullable().optional(),
	enrolledFromWeek: z.number().int().min(1).max(40).optional(),
});

export const teachingClassSetupSchema = z.object({
	class: createTeachingClassSchema,
	students: z
		.array(
			studentIdentitySchema.extend({
				orderNo: z.number().int().min(1).optional(),
				enrolledFromWeek: z.number().int().min(1).max(40).optional(),
			}),
		)
		.max(500),
});

export const updateEnrollmentSchema = z.object({
	orderNo: z.number().int().min(1).optional(),
	tutorialClassId: z.string().min(1).nullable().optional(),
	enrolledFromWeek: z.number().int().min(1).max(40).optional(),
	status: teachingEnrollmentStatusSchema.optional(),
	familyName: trimmed(120).min(1).optional(),
	givenName: trimmed(80).min(1).optional(),
	homeClassCode: trimmed(40).optional(),
	majorName: trimmed(160).optional(),
	phone: trimmed(40).nullable().optional(),
	dateOfBirth: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable()
		.optional(),
	email: z.string().trim().email().max(200).nullable().optional(),
	note: trimmed(240).optional(),
	learningExperienceAction: z.enum(['unlock', 'clear']).optional(),
});

export const updateSessionSchema = z
	.object({
		heldOn: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.nullable()
			.optional(),
		topic: trimmed(200).optional(),
		method: teachingAttendanceMethodSchema.optional(),
		isCancelled: z.boolean().optional(),
	})
	.strict();

export const attendanceMarkSchema = z
	.object({
		enrollmentId: z.string().min(1),
		status: teachingAttendanceStatusSchema,
		note: trimmed(240).optional(),
	})
	.strict();

export const batchAttendanceSchema = z
	.object({
		marks: z.array(attendanceMarkSchema).min(1).max(500),
	})
	.strict();

export const sessionLifecycleActionSchema = z.enum(['open', 'park', 'finalize', 'unfinalize']);

export const attendanceLockSchema = z
	.object({
		action: sessionLifecycleActionSchema.optional(),
		open: z.boolean().optional(),
		finalize: z.boolean().optional(),
		heldOn: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.nullable()
			.optional(),
	})
	.refine((value) => value.action != null || value.open != null, {
		message: 'Provide action or open',
	});

export const participationLockSchema = z
	.object({
		action: sessionLifecycleActionSchema.optional(),
		open: z.boolean().optional(),
		finalize: z.boolean().optional(),
	})
	.refine((value) => value.action != null || value.open != null, {
		message: 'Provide action or open',
	});

export function resolveSessionLifecycleAction(input: {
	action?: SessionLifecycleAction;
	open?: boolean;
	finalize?: boolean;
}): SessionLifecycleAction {
	if (input.action) return input.action;
	if (input.open === true) return 'open';
	if (input.finalize) return 'finalize';
	return 'park';
}

export const randomizeGroupBoardSchema = z
	.object({
		expectedVersion: z.number().int().min(0).optional(),
		seed: z.number().int().min(1).optional(),
		placements: z
			.array(
				z.object({
					enrollmentId: z.string().min(1),
					groupId: z.string().min(1),
					slotIndex: z.number().int().min(0).max(49),
				}),
			)
			.max(500)
			.optional(),
	})
	.strict();

export const clearGroupBoardSchema = z
	.object({
		expectedVersion: z.number().int().min(0).optional(),
	})
	.strict();

export const giftDeltaSchema = z.object({ delta: z.union([z.literal(1), z.literal(-1)]) });

const participationPointsSchema = z.union([
	z.literal(0),
	z.literal(0.5),
	z.literal(1),
	z.literal(2),
]);

export const participationMarkSchema = z
	.object({
		enrollmentId: z.string().min(1),
		points: participationPointsSchema,
		note: trimmed(240).optional(),
	})
	.strict();

export const batchParticipationSchema = z
	.object({
		marks: z.array(participationMarkSchema).min(1).max(500),
	})
	.strict();

export const teachingPublicLinkSchema = z.object({
	label: trimmed(120).min(1),
	url: trimmed(2048)
		.url()
		.refine(
			(value) => value.startsWith('https://') || value.startsWith('http://'),
			'Use an http:// or https:// URL',
		),
	description: trimmed(240).optional(),
});

export const updateTeachingPublicPageSchema = z.object({
	publicSlug: trimmed(80)
		.min(3)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens only'),
	publicTitle: trimmed(160),
	publicSummary: trimmed(320),
	publicDescription: trimmed(5000),
	publicAnnouncement: trimmed(500),
	links: z.array(teachingPublicLinkSchema).max(20),
});

export const shareTeachingClassSchema = z
	.object({
		shared: z.boolean(),
		classRules: trimmed(2000).optional(),
	})
	.strict();

export const configureGroupBoardSchema = z
	.object({
		groupCount: z.number().int().min(1).max(50),
		groupSize: z.number().int().min(2).max(50),
		expectedVersion: z.number().int().min(0).optional(),
	})
	.strict();

export const groupBoardOpenSchema = z.object({ open: z.boolean() });

export const groupAssignmentSchema = z.object({
	enrollmentId: z.string().min(1),
	groupId: z.string().min(1).nullable(),
	slotIndex: z.number().int().min(0).max(49).optional(),
	expectedVersion: z.number().int().min(0).optional(),
});

export const groupClaimSchema = z
	.object({
		enrollmentId: z.string().min(1),
	})
	.strict();

export const learningExperienceLoginSchema = z
	.object({
		enrollmentId: z.string().min(1).max(100),
		password: z
			.string()
			.regex(/^\d{8}$/, 'Mật khẩu gồm 8 chữ số theo định dạng ddmmyyyy')
			.optional(),
	})
	.strict();

export const learningExperienceChoiceSchema = z
	.object({
		choice: z.enum(['CHALLENGE', 'SUPPORT']),
	})
	.strict();

const noteTitle = z.string().trim().min(1).max(160);
const noteHtml = z.string().max(250_000);

export const createTeachingClassNoteSchema = z
	.object({ title: noteTitle, html: noteHtml.optional() })
	.strict();

export const updateTeachingClassNoteSchema = z
	.object({ title: noteTitle.optional(), html: noteHtml.optional() })
	.strict()
	.refine((value) => value.title !== undefined || value.html !== undefined, {
		message: 'Provide title or html',
	});

export const reorderTeachingClassNotesSchema = z
	.object({ ids: z.array(z.string().min(1).max(100)).max(500) })
	.strict();

export type CreateTeachingClassInput = z.infer<typeof createTeachingClassSchema>;
export type UpdateTeachingClassInput = z.infer<typeof updateTeachingClassSchema>;
export type CreateTutorialInput = z.infer<typeof createTutorialSchema>;
export type UpdateTutorialInput = z.infer<typeof updateTutorialSchema>;
export type AddEnrollmentInput = z.infer<typeof addEnrollmentSchema>;
export type TeachingClassSetupInput = z.infer<typeof teachingClassSetupSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type BatchAttendanceInput = z.infer<typeof batchAttendanceSchema>;
export type BatchParticipationInput = z.infer<typeof batchParticipationSchema>;
export type SessionLifecycleAction = z.infer<typeof sessionLifecycleActionSchema>;
export type ParticipationLockInput = z.infer<typeof participationLockSchema>;
export type RandomizeGroupBoardInput = z.infer<typeof randomizeGroupBoardSchema>;
export type ClearGroupBoardInput = z.infer<typeof clearGroupBoardSchema>;
export type GiftDeltaInput = z.infer<typeof giftDeltaSchema>;
export type UpdateTeachingPublicPageInput = z.infer<typeof updateTeachingPublicPageSchema>;
export type ShareTeachingClassInput = z.infer<typeof shareTeachingClassSchema>;
export type ConfigureGroupBoardInput = z.infer<typeof configureGroupBoardSchema>;
export type GroupAssignmentInput = z.infer<typeof groupAssignmentSchema>;
export type LearningExperienceLoginInput = z.infer<typeof learningExperienceLoginSchema>;
export type LearningExperienceChoiceInput = z.infer<typeof learningExperienceChoiceSchema>;
export type CreateTeachingClassNoteInput = z.infer<typeof createTeachingClassNoteSchema>;
export type UpdateTeachingClassNoteInput = z.infer<typeof updateTeachingClassNoteSchema>;
export type ReorderTeachingClassNotesInput = z.infer<typeof reorderTeachingClassNotesSchema>;

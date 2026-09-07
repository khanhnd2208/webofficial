import { removeEnrollmentGroup } from '../domain/groupTransactions';
import { classIdentityMatches, normalizeClassCode, normalizeTerm } from '../domain/adminLifecycle';
import { AppError } from '@/lib/appError';
import {
	ensureTeachingCourse,
	lockActiveCourse,
	normalizeCourseCode,
	throwIfCourseArchived,
} from '../domain/courseIdentity';

import {
	applyConflictResolution,
	classifyRosterRow,
	defaultConflictResolution,
	summarizeRosterPreview,
	type RosterConflictResolution,
	type RosterExistingSnapshot,
	type RosterImportCommitResult,
	type RosterImportCommitRow,
	type RosterImportPreview,
	type RosterImportPreviewRow,
	type RosterProfileField,
	type NormalizedTeachingStudentInput,
} from '../domain/rosterImport';
import { parseIsoDate, toIsoDate, withUniqueConflict } from '../domain/prismaErrors';
import { normalizeStudentCode } from '../domain/studentIdentity';
import { isLikelyStudentHeaderRow, parseDelimitedTable } from '../imports/parseDelimited';
import {
	enforceRowLimit,
	markBatchDuplicates,
	normalizeRawStudentInput,
	parsedRowToNormalized,
} from '../imports/normalizeStudentRow';
import {
	parseStudentListBuffer,
	parseStudentListFromRows,
	type ParsedClassMetadata,
} from '../imports/parseStudentList';
import * as repo from '../repositories/teachingRepository';
import { DEFAULT_TUTORIAL_CODE, DEFAULT_TUTORIAL_NAME } from '../repositories/teachingRepository';
import type { TeachingClassSetupInput } from '../schemas';
import { getGradebook, getTeachingClass } from './classService';

export type RosterImportSource =
	| { kind: 'xlsx'; buffer: Buffer }
	| { kind: 'csv' | 'paste'; text: string }
	| {
			kind: 'manual';
			students: Array<Record<string, unknown> | NormalizedTeachingStudentInput>;
	  };

type TutorialRef = { id: string; code: string };

function emptyMetadata(): ParsedClassMetadata {
	return {
		courseName: '',
		courseCode: '',
		lecturerName: '',
		lecturerCode: '',
		credits: null,
		groupNo: '',
		term: '',
	};
}

function snapshotFromStudent(
	student: {
		id: string;
		updatedAt: Date;
		studentCode: string;
		familyName: string;
		givenName: string;
		dateOfBirth: Date | null;
		homeClassCode: string;
		majorName: string;
		phone: string | null;
		email: string | null;
		enrollments: Array<{ id: string; classId: string; status: 'ACTIVE' | 'WITHDRAWN' }>;
	},
	classId?: string,
): RosterExistingSnapshot {
	const enrollment = classId
		? student.enrollments.find((item) => item.classId === classId)
		: undefined;
	return {
		studentId: student.id,
		updatedAt: student.updatedAt.toISOString(),
		studentCode: student.studentCode,
		familyName: student.familyName,
		givenName: student.givenName,
		dateOfBirth: toIsoDate(student.dateOfBirth),
		homeClassCode: student.homeClassCode,
		majorName: student.majorName,
		phone: student.phone,
		email: student.email,
		enrollmentId: enrollment?.id ?? null,
		enrollmentStatus: enrollment?.status ?? null,
	};
}

async function parseSource(source: RosterImportSource) {
	if (source.kind === 'xlsx') {
		const parsed = await parseStudentListBuffer(source.buffer);
		return {
			metadata: parsed.metadata,
			inputs: parsed.students.map((row, index) =>
				parsedRowToNormalized(row, parsed.headerRowIndex + 2 + index),
			),
		};
	}
	if (source.kind === 'manual') {
		return {
			metadata: emptyMetadata(),
			inputs: source.students.map((student, index) =>
				normalizeRawStudentInput({
					sourceRow: index + 1,
					orderNo: student.orderNo as number | string | null | undefined,
					studentCode: student.studentCode as string | null | undefined,
					familyName: student.familyName as string | null | undefined,
					givenName: student.givenName as string | null | undefined,
					homeClassCode: student.homeClassCode as string | null | undefined,
					majorName: student.majorName as string | null | undefined,
					dateOfBirth: student.dateOfBirth as string | null | undefined,
					phone: student.phone as string | null | undefined,
					email: student.email as string | null | undefined,
					tutorialCode: student.tutorialCode as string | null | undefined,
					tutorialClassId: student.tutorialClassId as string | null | undefined,
					enrolledFromWeek: student.enrolledFromWeek as number | string | null | undefined,
				}),
			),
		};
	}
	const table = parseDelimitedTable(source.text);
	if (!table.some(isLikelyStudentHeaderRow)) {
		throw new AppError('Không tìm thấy hàng tiêu đề (STT / Mã SV).', 422, 'VALIDATION');
	}
	const parsed = parseStudentListFromRows(table);
	return {
		metadata: parsed.metadata,
		inputs: parsed.students.map((row, index) =>
			parsedRowToNormalized(row, parsed.headerRowIndex + 2 + index),
		),
	};
}

function bindTutorials(
	inputs: ReturnType<typeof normalizeRawStudentInput>[],
	tutorials: TutorialRef[],
) {
	const byCode = new Map(tutorials.map((item) => [normalizeStudentCode(item.code), item.id]));
	const knownTutorialCodes = new Set(byCode.keys());
	const knownTutorialIds = new Set(tutorials.map((item) => item.id));
	return inputs.map((input) => {
		const next = normalizeRawStudentInput(input, { knownTutorialCodes, knownTutorialIds });
		if (next.tutorialCode && !next.tutorialClassId) {
			next.tutorialClassId = byCode.get(next.tutorialCode) ?? null;
		}
		return next;
	});
}

export async function previewRosterImport(options: {
	source: RosterImportSource;
	classId?: string;
}): Promise<RosterImportPreview> {
	const parsed = await parseSource(options.source);
	const teachingClass = options.classId ? await getTeachingClass(options.classId) : null;
	const tutorials: TutorialRef[] = options.classId ? await repo.listTutorials(options.classId) : [];
	const maxWeek = teachingClass?.totalWeeks ?? 40;
	let inputs = markBatchDuplicates(
		enforceRowLimit(parsed.inputs.map((input) => normalizeRawStudentInput(input, { maxWeek }))),
	);
	if (tutorials.length > 0) inputs = bindTutorials(inputs, tutorials);

	let existingClassId: string | null = options.classId ?? null;
	if (!existingClassId && parsed.metadata.courseCode && parsed.metadata.groupNo) {
		const normalizedCourseCode = normalizeCourseCode(parsed.metadata.courseCode);
		const classCode = normalizeClassCode(parsed.metadata.groupNo);
		const term = normalizeTerm(parsed.metadata.term || 'Unknown term');
		const candidates = await repo.prisma.teachingClass.findMany({
			where: {
				OR: [
					{ course: { courseCode: normalizedCourseCode } },
					{ courseCode: parsed.metadata.courseCode },
				],
			},
			select: { id: true, classCode: true, groupNo: true, term: true },
		});
		existingClassId =
			candidates.find((row) => classIdentityMatches(row, { classCode, term }))?.id ?? null;
	}

	const codes = [...new Set(inputs.map((row) => row.studentCode).filter(Boolean))];
	const existingStudents = await repo.findStudentsByNormalizedCodes(codes);
	const byCode = new Map(
		existingStudents.map((student) => [student.studentCodeNormalized, student]),
	);

	const rows: RosterImportPreviewRow[] = inputs.map((input) => {
		const existing = input.studentCode ? byCode.get(input.studentCode) : undefined;
		const snapshot = existing
			? snapshotFromStudent(existing, options.classId ?? existingClassId ?? undefined)
			: null;
		const classified = classifyRosterRow(input, snapshot);
		return {
			key: `${input.sourceRow}:${input.studentCode || 'invalid'}`,
			status: classified.status,
			input,
			existing: snapshot,
			conflicts: classified.conflicts,
			fillBlankFields: classified.fillBlankFields,
			accessMode: classified.accessMode,
			resolution: defaultConflictResolution(classified.conflicts),
		};
	});

	return {
		metadata: parsed.metadata.courseCode || parsed.metadata.groupNo ? parsed.metadata : null,
		existingClassId,
		rows,
		summary: summarizeRosterPreview(rows),
	};
}

function resolvedProfile(
	row: {
		input: NormalizedTeachingStudentInput;
		resolution?: RosterConflictResolution;
	},
	existing: RosterExistingSnapshot | null,
	fillBlankFields: RosterProfileField[],
) {
	if (!existing) {
		return {
			familyName: row.input.familyName,
			givenName: row.input.givenName,
			dateOfBirth: row.input.dateOfBirth,
			homeClassCode: row.input.homeClassCode,
			majorName: row.input.majorName,
			phone: row.input.phone,
			email: row.input.email,
		};
	}
	return applyConflictResolution(row.input, existing, row.resolution ?? {}, fillBlankFields);
}

export async function commitRosterImport(options: {
	classId: string;
	rows: RosterImportCommitRow[];
}): Promise<RosterImportCommitResult> {
	const teachingClass = await getTeachingClass(options.classId);
	const tutorials = await repo.listTutorials(options.classId);
	const defaultTutorialId = tutorials[0]?.id ?? null;
	const normalizedRows = markBatchDuplicates(
		enforceRowLimit(
			bindTutorials(
				options.rows.map((row) =>
					normalizeRawStudentInput(row.input, { maxWeek: teachingClass.totalWeeks }),
				),
				tutorials,
			),
		),
	).map((input, index) => ({
		...options.rows[index]!,
		input,
	}));

	if (normalizedRows.some((row) => Object.keys(row.input.fieldErrors).length > 0)) {
		throw new AppError('Hãy xử lý hết lỗi trước khi lưu.', 422, 'VALIDATION');
	}

	const result: RosterImportCommitResult = {
		classId: options.classId,
		addedCount: 0,
		reactivatedCount: 0,
		filledCount: 0,
		updatedCount: 0,
		skippedCount: 0,
		errorCount: 0,
	};

	await repo.prisma.$transaction(
		async (tx) => {
			for (const [index, row] of normalizedRows.entries()) {
				if (Object.keys(row.input.fieldErrors).length > 0) {
					throw new AppError('Dữ liệu không hợp lệ. Hãy đối chiếu lại.', 422, 'VALIDATION');
				}
				const existing = row.input.studentCode
					? await tx.teachingStudent.findUnique({
							where: { studentCodeNormalized: row.input.studentCode },
							include: {
								enrollments: {
									select: { id: true, classId: true, status: true, tutorialClassId: true },
								},
							},
						})
					: null;
				const snapshot = existing ? snapshotFromStudent(existing, options.classId) : null;
				if (snapshot && row.expectedUpdatedAt && snapshot.updatedAt !== row.expectedUpdatedAt) {
					throw new AppError('Dữ liệu đã thay đổi, hãy đối chiếu lại', 409, 'STALE_PREVIEW');
				}
				const classified = classifyRosterRow(row.input, snapshot);
				if (classified.status === 'conflict') {
					const unresolved = classified.conflicts.filter(
						(conflict) => !row.resolution?.[conflict.field],
					);
					if (unresolved.length > 0) {
						throw new AppError('Hãy xử lý hết xung đột trước khi lưu.', 422, 'VALIDATION');
					}
				}
				if (classified.status === 'exact') {
					result.skippedCount += 1;
					continue;
				}

				const profile = resolvedProfile(row, snapshot, classified.fillBlankFields);
				const usedNew = classified.conflicts.some(
					(conflict) => row.resolution?.[conflict.field] === 'use_new',
				);
				const studentData = {
					studentCode: row.input.studentCode,
					studentCodeNormalized: row.input.studentCode,
					familyName: profile.familyName,
					givenName: profile.givenName,
					dateOfBirth: parseIsoDate(profile.dateOfBirth),
					homeClassCode: profile.homeClassCode,
					majorName: profile.majorName,
					phone: profile.phone,
					email: profile.email,
				};
				const student = existing
					? await tx.teachingStudent.update({
							where: { id: existing.id },
							data: studentData,
						})
					: await tx.teachingStudent.create({ data: studentData });
				if (classified.fillBlankFields.length > 0) result.filledCount += 1;
				if (usedNew) result.updatedCount += 1;

				const classEnrollment = existing?.enrollments.find(
					(item) => item.classId === options.classId,
				);
				const tutorialClassId = row.input.tutorialClassId ?? defaultTutorialId;
				if (
					classEnrollment &&
					tutorialClassId &&
					tutorialClassId !== classEnrollment.tutorialClassId
				)
					await removeEnrollmentGroup(tx, classEnrollment.id);
				if (!classEnrollment) {
					await tx.teachingEnrollment.create({
						data: {
							classId: options.classId,
							studentId: student.id,
							tutorialClassId,
							orderNo: row.input.orderNo ?? index + 1,
							enrolledFromWeek: row.input.enrolledFromWeek ?? 1,
							status: 'ACTIVE',
						},
					});
					result.addedCount += 1;
				} else if (classEnrollment.status === 'WITHDRAWN') {
					await tx.teachingEnrollment.update({
						where: { id: classEnrollment.id },
						data: {
							status: 'ACTIVE',
							tutorialClassId,
							orderNo: row.input.orderNo ?? undefined,
							enrolledFromWeek: row.input.enrolledFromWeek ?? undefined,
						},
					});
					result.reactivatedCount += 1;
				} else if (
					tutorialClassId ||
					row.input.orderNo != null ||
					row.input.enrolledFromWeek != null
				) {
					await tx.teachingEnrollment.update({
						where: { id: classEnrollment.id },
						data: {
							...(tutorialClassId ? { tutorialClassId } : {}),
							...(row.input.orderNo != null ? { orderNo: row.input.orderNo } : {}),
							...(row.input.enrolledFromWeek != null
								? { enrolledFromWeek: row.input.enrolledFromWeek }
								: {}),
						},
					});
				}
			}
		},
		{ timeout: 60_000, maxWait: 10_000, isolationLevel: 'Serializable' },
	);

	return result;
}

export async function setupTeachingClassFromRoster(input: {
	class: TeachingClassSetupInput['class'];
	rows: RosterImportCommitRow[];
}) {
	const preview = await previewRosterImport({
		source: { kind: 'manual', students: input.rows.map((row) => row.input) },
	});
	const unresolved = preview.rows.filter((row, index) => {
		if (row.status === 'invalid') return true;
		if (row.status !== 'conflict') return false;
		return row.conflicts.some((conflict) => !input.rows[index]?.resolution?.[conflict.field]);
	});
	if (unresolved.length > 0) {
		throw new AppError('Hãy xử lý hết lỗi và xung đột trước khi tạo lớp.', 422, 'VALIDATION');
	}
	if (preview.existingClassId) {
		throw new AppError(
			'This class already exists. Open it to add or review students.',
			409,
			'CLASS_EXISTS',
			{ existingClassId: preview.existingClassId },
		);
	}

	const totalWeeks = input.class.totalWeeks ?? 10;
	const course = input.class.courseId
		? await repo.getCourse(input.class.courseId)
		: await ensureTeachingCourse(repo.prisma, {
				courseCode: input.class.courseCode ?? '',
				courseName: input.class.courseName ?? '',
			});
	if (!course) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
	throwIfCourseArchived(course.status);
	const groupNo = normalizeClassCode(input.class.groupNo);
	const term = normalizeTerm(input.class.term);
	const existingIdentity = await repo.findClassByIdentity({
		courseId: course.id,
		classCode: groupNo,
		term,
	});
	if (existingIdentity) {
		throw new AppError('Lớp với mã này đã tồn tại trong học kỳ đã chọn', 409, 'CLASS_EXISTS', {
			existingClassId: existingIdentity.id,
		});
	}
	const classId = await withUniqueConflict(
		'A class with this course code, group and term already exists',
		async () =>
			repo.prisma.$transaction(
				async (tx) => {
					await lockActiveCourse(tx, course.id);
					const teachingClass = await tx.teachingClass.create({
						data: {
							courseId: course.id,
							courseCode: course.courseCode,
							courseName: course.courseName,
							groupNo,
							classCode: groupNo,
							term,
							credits: input.class.credits ?? null,
							lecturerName: input.class.lecturerName ?? '',
							lecturerCode: input.class.lecturerCode ?? '',
							totalWeeks,
						},
					});
					const tutorial = await tx.teachingTutorialClass.create({
						data: {
							classId: teachingClass.id,
							code: DEFAULT_TUTORIAL_CODE,
							name: DEFAULT_TUTORIAL_NAME,
							displayOrder: 0,
						},
					});
					await tx.teachingSession.createMany({
						data: Array.from({ length: totalWeeks }, (_, index) => ({
							classId: teachingClass.id,
							tutorialClassId: tutorial.id,
							weekNumber: index + 1,
						})),
					});
					for (const [index, row] of input.rows.entries()) {
						const normalized = normalizeRawStudentInput(row.input, { maxWeek: totalWeeks });
						if (Object.keys(normalized.fieldErrors).length > 0) {
							throw new AppError('Dữ liệu không hợp lệ. Hãy đối chiếu lại.', 422, 'VALIDATION');
						}
						const existing = await tx.teachingStudent.findUnique({
							where: { studentCodeNormalized: normalized.studentCode },
						});
						if (
							existing &&
							row.expectedUpdatedAt &&
							existing.updatedAt.toISOString() !== row.expectedUpdatedAt
						) {
							throw new AppError('Dữ liệu đã thay đổi, hãy đối chiếu lại', 409, 'STALE_PREVIEW');
						}
						const snapshot = existing
							? snapshotFromStudent({ ...existing, enrollments: [] }, teachingClass.id)
							: null;
						const classified = classifyRosterRow(normalized, snapshot);
						if (classified.status === 'conflict') {
							const unresolvedConflicts = classified.conflicts.filter(
								(conflict) => !row.resolution?.[conflict.field],
							);
							if (unresolvedConflicts.length > 0) {
								throw new AppError('Hãy xử lý hết xung đột trước khi lưu.', 422, 'VALIDATION');
							}
						}
						const profile = resolvedProfile(
							{ ...row, input: normalized },
							snapshot,
							classified.fillBlankFields,
						);
						const studentData = {
							studentCode: normalized.studentCode,
							studentCodeNormalized: normalized.studentCode,
							familyName: profile.familyName,
							givenName: profile.givenName,
							dateOfBirth: parseIsoDate(profile.dateOfBirth),
							homeClassCode: profile.homeClassCode,
							majorName: profile.majorName,
							phone: profile.phone,
							email: profile.email,
						};
						const student = existing
							? await tx.teachingStudent.update({ where: { id: existing.id }, data: studentData })
							: await tx.teachingStudent.create({ data: studentData });
						await tx.teachingEnrollment.create({
							data: {
								classId: teachingClass.id,
								studentId: student.id,
								tutorialClassId: tutorial.id,
								orderNo: normalized.orderNo ?? index + 1,
								enrolledFromWeek: normalized.enrolledFromWeek ?? 1,
							},
						});
					}
					const publishedDecks = await tx.activeRecallDeck.findMany({
						where: { courseId: course.id, status: 'PUBLISHED' },
						select: { id: true, position: true },
					});
					if (publishedDecks.length) {
						await tx.teachingClassRecallDeck.createMany({
							data: publishedDecks.map((deck) => ({
								classId: teachingClass.id,
								deckId: deck.id,
								enabled: true,
								displayOrder: deck.position,
							})),
							skipDuplicates: true,
						});
					}
					return teachingClass.id;
				},
				{ timeout: 60_000, maxWait: 10_000, isolationLevel: 'Serializable' },
			),
	);

	return {
		gradebook: await getGradebook(classId),
		createdStudentCount: input.rows.length,
	};
}

/** @deprecated Prefer previewRosterImport. Kept for Excel class-creation callers during rollout. */
export async function previewStudentListImport(buffer: Buffer) {
	return previewRosterImport({ source: { kind: 'xlsx', buffer } });
}

export async function commitStudentListImport(buffer: Buffer) {
	const preview = await previewRosterImport({ source: { kind: 'xlsx', buffer } });
	if (preview.summary.invalidCount > 0 || preview.summary.conflictCount > 0) {
		throw new AppError('Fix validation errors before importing', 422, 'VALIDATION', {
			rows: `${preview.summary.invalidCount + preview.summary.conflictCount} invalid rows`,
		});
	}
	if (preview.rows.length === 0) {
		throw new AppError('The file contains no students', 422, 'VALIDATION');
	}
	return setupTeachingClassFromRoster({
		class: {
			courseCode: preview.metadata?.courseCode || '',
			courseName: preview.metadata?.courseName || preview.metadata?.courseCode || '',
			groupNo: preview.metadata?.groupNo || '',
			term: preview.metadata?.term || 'Unknown term',
			credits: preview.metadata?.credits,
			lecturerName: preview.metadata?.lecturerName,
			lecturerCode: preview.metadata?.lecturerCode,
		},
		rows: preview.rows.map((row) => ({
			key: row.key,
			input: row.input,
			expectedUpdatedAt: row.existing?.updatedAt ?? null,
			resolution: row.resolution,
		})),
	});
}

export async function importStudentListIntoClass(classId: string, buffer: Buffer) {
	const preview = await previewRosterImport({ source: { kind: 'xlsx', buffer }, classId });
	if (preview.summary.invalidCount > 0) {
		throw new AppError('Fix validation errors before importing', 422, 'VALIDATION');
	}
	if (preview.summary.conflictCount > 0) {
		throw new AppError(
			'Hãy đối chiếu dữ liệu trùng trước khi lưu.',
			409,
			'STUDENT_PROFILE_CONFLICT',
		);
	}
	return commitRosterImport({
		classId,
		rows: preview.rows.map((row) => ({
			key: row.key,
			input: row.input,
			expectedUpdatedAt: row.existing?.updatedAt ?? null,
			resolution: row.resolution,
		})),
	});
}

export type StudentListPreview = RosterImportPreview;
export type { RosterConflictResolution, RosterImportCommitRow, RosterImportPreview };

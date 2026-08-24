import crypto from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	getLearningExperienceSession,
	loginToLearningExperience,
	saveLearningExperienceChoice,
	searchLearningExperienceStudents,
} from './learningExperienceService';

const mocks = vi.hoisted(() => ({
	classFindFirst: vi.fn(),
	enrollmentFindFirst: vi.fn(),
	enrollmentFindMany: vi.fn(),
	enrollmentFindUnique: vi.fn(),
	enrollmentUpdateMany: vi.fn(),
	cookieGet: vi.fn(),
	cookieSet: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: {
		teachingClass: { findFirst: mocks.classFindFirst },
		teachingEnrollment: {
			findFirst: mocks.enrollmentFindFirst,
			findMany: mocks.enrollmentFindMany,
			findUnique: mocks.enrollmentFindUnique,
			updateMany: mocks.enrollmentUpdateMany,
		},
	},
}));

describe('searchLearningExperienceStudents', () => {
	it('searches the real code on the server but only returns its masked form', async () => {
		mocks.classFindFirst.mockResolvedValue({ id: 'class-1' });
		mocks.enrollmentFindMany.mockResolvedValue([
			{
				id: 'enrollment-1',
				student: {
					studentCode: '2406090045',
					familyName: 'Nguyễn',
					givenName: 'Minh Anh',
					dateOfBirth: new Date('2006-05-29T00:00:00.000Z'),
				},
			},
		]);

		await expect(searchLearningExperienceStudents('hrm-01', '0900')).resolves.toEqual([
			{
				enrollmentId: 'enrollment-1',
				studentCode: '********45',
				fullName: 'Nguyễn Minh Anh',
				hasDateOfBirth: true,
			},
		]);
		expect(mocks.enrollmentFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					student: { studentCode: { contains: '0900', mode: 'insensitive' } },
				}),
			}),
		);
	});
});

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({ get: mocks.cookieGet, set: mocks.cookieSet })),
}));

function enrollment(
	dateOfBirth: Date | null,
	overrides: {
		learningExperience?: 'CHALLENGE' | 'SUPPORT' | null;
		learningExperienceChangeCount?: number;
	} = {},
) {
	return {
		id: 'enrollment-1',
		learningExperience: overrides.learningExperience ?? null,
		learningExperienceSelectedAt: overrides.learningExperience
			? new Date('2026-08-23T00:00:00.000Z')
			: null,
		learningExperienceChangeCount: overrides.learningExperienceChangeCount ?? 0,
		student: {
			studentCode: '2406090045',
			familyName: 'Nguyễn',
			givenName: 'Minh Anh',
			dateOfBirth,
		},
	};
}

function signedCookie() {
	return {
		classId: 'class-1',
		enrollmentId: 'enrollment-1',
		exp: Math.floor(Date.now() / 1000) + 60,
	};
}

function encodeViewer(payload: ReturnType<typeof signedCookie>) {
	const signingSecret =
		process.env.AUTH_SECRET?.trim() ||
		process.env.NEXTAUTH_SECRET?.trim() ||
		process.env.ADMIN_SECRET?.trim() ||
		'development-learning-experience-secret';
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = crypto
		.createHmac('sha256', signingSecret)
		.update(body)
		.digest('base64url');
	return `${body}.${signature}`;
}

describe('loginToLearningExperience', () => {
	beforeEach(() => {
		mocks.classFindFirst.mockReset().mockResolvedValue({ id: 'class-1' });
		mocks.enrollmentFindFirst.mockReset();
		mocks.cookieGet.mockReset();
		mocks.cookieSet.mockReset();
	});

	it('fails closed when the roster birth date is missing', async () => {
		mocks.enrollmentFindFirst.mockResolvedValue(enrollment(null));

		await expect(
			loginToLearningExperience('hrm-01', {
				enrollmentId: 'enrollment-1',
				password: '00000000',
			}),
		).rejects.toMatchObject({
			status: 403,
			code: 'LEARNING_EXPERIENCE_DOB_REQUIRED',
		});
		expect(mocks.cookieSet).not.toHaveBeenCalled();
	});

	it('invalidates an existing signed viewer cookie when the birth date is missing', async () => {
		mocks.cookieGet.mockReturnValue({ value: encodeViewer(signedCookie()) });
		mocks.enrollmentFindFirst.mockResolvedValue(enrollment(null));

		await expect(getLearningExperienceSession('hrm-01')).resolves.toEqual({
			authenticated: false,
		});
	});

	it('requires the exact UTC-safe ddmmyyyy password', async () => {
		mocks.enrollmentFindFirst.mockResolvedValue(enrollment(new Date('2006-05-29T00:00:00.000Z')));

		await expect(
			loginToLearningExperience('hrm-01', {
				enrollmentId: 'enrollment-1',
				password: '28052006',
			}),
		).rejects.toMatchObject({ status: 401, code: 'INVALID_STUDENT_CREDENTIALS' });
		expect(mocks.cookieSet).not.toHaveBeenCalled();
	});

	it('creates a signed viewer session for the correct birth date', async () => {
		mocks.enrollmentFindFirst.mockResolvedValue(enrollment(new Date('2006-05-29T00:00:00.000Z')));

		const result = await loginToLearningExperience('hrm-01', {
			enrollmentId: 'enrollment-1',
			password: '29052006',
		});

		expect(result).toMatchObject({
			authenticated: true,
			student: { studentCode: '2406090045', fullName: 'Nguyễn Minh Anh' },
			changesRemaining: 1,
			locked: false,
		});
		expect(mocks.enrollmentFindFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id: 'enrollment-1',
					classId: 'class-1',
					status: 'ACTIVE',
				},
			}),
		);
		expect(mocks.cookieSet).toHaveBeenCalledOnce();
	});
});

describe('saveLearningExperienceChoice', () => {
	beforeEach(() => {
		mocks.classFindFirst.mockReset().mockResolvedValue({ id: 'class-1' });
		mocks.enrollmentFindFirst.mockReset();
		mocks.enrollmentFindUnique.mockReset();
		mocks.enrollmentUpdateMany.mockReset();
		mocks.cookieGet.mockReset().mockReturnValue({ value: encodeViewer(signedCookie()) });
		mocks.cookieSet.mockReset();
	});

	it('saves the first choice without consuming the change quota', async () => {
		const current = enrollment(new Date('2006-05-29T00:00:00.000Z'));
		const saved = {
			...current,
			learningExperience: 'CHALLENGE' as const,
			learningExperienceSelectedAt: new Date(),
		};
		mocks.enrollmentFindFirst.mockResolvedValue(current);
		mocks.enrollmentUpdateMany.mockResolvedValue({ count: 1 });
		mocks.enrollmentFindUnique.mockResolvedValue(saved);

		const result = await saveLearningExperienceChoice('hrm-01', { choice: 'CHALLENGE' });

		expect(mocks.enrollmentUpdateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id: 'enrollment-1',
					learningExperience: null,
					learningExperienceChangeCount: 0,
				},
				data: expect.objectContaining({
					learningExperience: 'CHALLENGE',
					learningExperienceChangeCount: 0,
				}),
			}),
		);
		expect(result).toMatchObject({
			choice: 'CHALLENGE',
			changesRemaining: 1,
			locked: false,
		});
	});

	it('treats a matching choice as a no-op', async () => {
		mocks.enrollmentFindFirst.mockResolvedValue(
			enrollment(new Date('2006-05-29T00:00:00.000Z'), { learningExperience: 'SUPPORT' }),
		);

		const result = await saveLearningExperienceChoice('hrm-01', { choice: 'SUPPORT' });

		expect(mocks.enrollmentUpdateMany).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			choice: 'SUPPORT',
			changesRemaining: 1,
			locked: false,
		});
	});

	it('allows one change and then locks the session', async () => {
		const current = enrollment(new Date('2006-05-29T00:00:00.000Z'), {
			learningExperience: 'CHALLENGE',
			learningExperienceChangeCount: 0,
		});
		const saved = {
			...current,
			learningExperience: 'SUPPORT' as const,
			learningExperienceChangeCount: 1,
			learningExperienceSelectedAt: new Date(),
		};
		mocks.enrollmentFindFirst.mockResolvedValue(current);
		mocks.enrollmentUpdateMany.mockResolvedValue({ count: 1 });
		mocks.enrollmentFindUnique.mockResolvedValue(saved);

		const result = await saveLearningExperienceChoice('hrm-01', { choice: 'SUPPORT' });

		expect(mocks.enrollmentUpdateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id: 'enrollment-1',
					learningExperience: 'CHALLENGE',
					learningExperienceChangeCount: 0,
				},
				data: expect.objectContaining({
					learningExperience: 'SUPPORT',
					learningExperienceChangeCount: 1,
				}),
			}),
		);
		expect(result).toMatchObject({
			choice: 'SUPPORT',
			changesRemaining: 0,
			locked: true,
		});
	});

	it('rejects a concurrent write instead of silently overwriting the first choice', async () => {
		mocks.enrollmentFindFirst.mockResolvedValue(
			enrollment(new Date('2006-05-29T00:00:00.000Z')),
		);
		mocks.enrollmentUpdateMany.mockResolvedValue({ count: 0 });

		await expect(
			saveLearningExperienceChoice('hrm-01', { choice: 'CHALLENGE' }),
		).rejects.toMatchObject({
			status: 409,
			code: 'LEARNING_EXPERIENCE_CONFLICT',
		});
		expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled();
	});

	it('rejects a second change after the quota is used', async () => {
		mocks.enrollmentFindFirst.mockResolvedValue(
			enrollment(new Date('2006-05-29T00:00:00.000Z'), {
				learningExperience: 'SUPPORT',
				learningExperienceChangeCount: 1,
			}),
		);

		await expect(
			saveLearningExperienceChoice('hrm-01', { choice: 'CHALLENGE' }),
		).rejects.toMatchObject({
			status: 409,
			code: 'LEARNING_EXPERIENCE_LOCKED',
		});
		expect(mocks.enrollmentUpdateMany).not.toHaveBeenCalled();
	});
});

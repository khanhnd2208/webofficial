import crypto from 'node:crypto';

import { cookies } from 'next/headers';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { maskStudentCode } from '../domain/privacy';
import type { LearningExperienceChoiceInput, LearningExperienceLoginInput } from '../schemas';
import type { LearningExperienceSession } from '../types';

const COOKIE_PREFIX = 'teaching-learning-experience-';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

type ViewerToken = { classId: string; enrollmentId: string; exp: number };

function secret(): string | null {
	const configured =
		process.env.AUTH_SECRET?.trim() ||
		process.env.NEXTAUTH_SECRET?.trim() ||
		process.env.ADMIN_SECRET?.trim();
	if (configured) return configured;
	return process.env.NODE_ENV === 'production' ? null : 'development-learning-experience-secret';
}

function cookieName(slug: string) {
	return `${COOKIE_PREFIX}${slug.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function encode(payload: ViewerToken) {
	const signingSecret = secret();
	if (!signingSecret) {
		throw new AppError(
			'Tính năng Learning Experience đang tạm khóa vì thiếu cấu hình bảo vệ.',
			503,
			'LEARNING_EXPERIENCE_AUTH_UNAVAILABLE',
		);
	}
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = crypto.createHmac('sha256', signingSecret).update(body).digest('base64url');
	return `${body}.${signature}`;
}

function decode(value: string | undefined): ViewerToken | null {
	if (!value) return null;
	const [body, signature] = value.split('.');
	if (!body || !signature) return null;
	const signingSecret = secret();
	if (!signingSecret) return null;
	const expected = crypto.createHmac('sha256', signingSecret).update(body).digest('base64url');
	if (
		signature.length !== expected.length ||
		!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
	) {
		return null;
	}
	try {
		const parsed = JSON.parse(
			Buffer.from(body, 'base64url').toString('utf8'),
		) as Partial<ViewerToken>;
		if (
			!parsed.classId ||
			!parsed.enrollmentId ||
			!parsed.exp ||
			parsed.exp < Math.floor(Date.now() / 1000)
		) {
			return null;
		}
		return parsed as ViewerToken;
	} catch {
		return null;
	}
}

function passwordFromDate(date: Date | null): string | null {
	if (!date) return null;
	const day = String(date.getUTCDate()).padStart(2, '0');
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	return `${day}${month}${date.getUTCFullYear()}`;
}

function safeEqual(left: string, right: string) {
	if (left.length !== right.length) return false;
	return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

const LEARNING_EXPERIENCE_CHANGE_LIMIT = 1;

function sessionSelect() {
	return {
		id: true,
		learningExperience: true,
		learningExperienceSelectedAt: true,
		learningExperienceChangeCount: true,
		student: {
			select: { studentCode: true, familyName: true, givenName: true, dateOfBirth: true },
		},
	} as const;
}

function toSession(enrollment: {
	id: string;
	learningExperience: 'CHALLENGE' | 'SUPPORT' | null;
	learningExperienceSelectedAt: Date | null;
	learningExperienceChangeCount: number;
		student: {
			studentCode: string;
			familyName: string;
			givenName: string;
			dateOfBirth: Date | null;
		};
}): LearningExperienceSession {
	const locked = enrollment.learningExperienceChangeCount >= LEARNING_EXPERIENCE_CHANGE_LIMIT;
	return {
		authenticated: true,
		student: {
			enrollmentId: enrollment.id,
			studentCode: enrollment.student.studentCode,
			fullName: `${enrollment.student.familyName} ${enrollment.student.givenName}`.trim(),
		},
		choice: enrollment.learningExperience,
		selectedAt: enrollment.learningExperienceSelectedAt?.toISOString() ?? null,
		changesRemaining: locked ? 0 : 1,
		locked,
	};
}

async function publicClass(slug: string) {
	const teachingClass = await prisma.teachingClass.findFirst({
		where: { publicSlug: slug, attendanceVisible: true, status: 'ACTIVE' },
		select: { id: true },
	});
	if (!teachingClass) throw new AppError('Không tìm thấy lớp.', 404, 'NOT_FOUND');
	return teachingClass;
}

export async function searchLearningExperienceStudents(slug: string, query: string) {
	const teachingClass = await publicClass(slug);
	const normalizedQuery = query.trim();
	if (!/^\d{1,40}$/.test(normalizedQuery)) return [];

	const enrollments = await prisma.teachingEnrollment.findMany({
		where: {
			classId: teachingClass.id,
			status: 'ACTIVE',
			student: { studentCode: { contains: normalizedQuery, mode: 'insensitive' } },
		},
		orderBy: [{ orderNo: 'asc' }, { createdAt: 'asc' }],
		take: 8,
		select: {
			id: true,
			student: {
				select: {
					studentCode: true,
					familyName: true,
					givenName: true,
					dateOfBirth: true,
				},
			},
		},
	});

	return enrollments.map((enrollment) => ({
		enrollmentId: enrollment.id,
		studentCode: maskStudentCode(enrollment.student.studentCode),
		fullName: `${enrollment.student.familyName} ${enrollment.student.givenName}`.trim(),
		hasDateOfBirth: Boolean(enrollment.student.dateOfBirth),
	}));
}

async function setViewerCookie(slug: string, classId: string, enrollmentId: string) {
	const store = await cookies();
	store.set(
		cookieName(slug),
		encode({
			classId,
			enrollmentId,
			exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
		}),
		{
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: COOKIE_MAX_AGE,
			path: '/',
		},
	);
}

async function viewerEnrollment(slug: string) {
	const teachingClass = await publicClass(slug);
	const token = decode((await cookies()).get(cookieName(slug))?.value);
	if (!token || token.classId !== teachingClass.id) return null;
	const enrollment = await prisma.teachingEnrollment.findFirst({
		where: { id: token.enrollmentId, classId: teachingClass.id, status: 'ACTIVE' },
		select: sessionSelect(),
	});
	return enrollment?.student.dateOfBirth ? enrollment : null;
}

function identityRequired(): AppError {
	return new AppError(
		'Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.',
		401,
		'IDENTITY_REQUIRED',
	);
}

/** Resolves the signed viewer identity for per-student mutation throttling. */
export async function getLearningExperienceViewerEnrollmentId(slug: string): Promise<string> {
	const enrollment = await viewerEnrollment(slug);
	if (!enrollment) throw identityRequired();
	return enrollment.id;
}

export async function getLearningExperienceSession(
	slug: string,
): Promise<LearningExperienceSession> {
	const enrollment = await viewerEnrollment(slug);
	return enrollment ? toSession(enrollment) : { authenticated: false };
}

export async function loginToLearningExperience(
	slug: string,
	input: LearningExperienceLoginInput,
): Promise<LearningExperienceSession> {
	const teachingClass = await publicClass(slug);
	const enrollment = await prisma.teachingEnrollment.findFirst({
		where: {
			id: input.enrollmentId,
			classId: teachingClass.id,
			status: 'ACTIVE',
		},
		select: {
			...sessionSelect(),
			student: {
				select: {
					studentCode: true,
					familyName: true,
					givenName: true,
					dateOfBirth: true,
				},
			},
		},
	});
	if (!enrollment) {
		throw new AppError(
			'Mã sinh viên hoặc mật khẩu không đúng.',
			401,
			'INVALID_STUDENT_CREDENTIALS',
		);
	}
	const expectedPassword = passwordFromDate(enrollment.student.dateOfBirth);
	if (!expectedPassword) {
		throw new AppError(
			'Hồ sơ chưa có ngày sinh để xác thực. Vui lòng liên hệ giảng viên cập nhật roster.',
			403,
			'LEARNING_EXPERIENCE_DOB_REQUIRED',
		);
	}
	if (!safeEqual(expectedPassword, input.password)) {
		throw new AppError(
			'Mật khẩu ngày sinh chưa đúng. Hãy nhập đủ 8 số theo ddmmyyyy.',
			401,
			'INVALID_STUDENT_CREDENTIALS',
		);
	}
	await setViewerCookie(slug, teachingClass.id, enrollment.id);
	return toSession(enrollment);
}

export async function saveLearningExperienceChoice(
	slug: string,
	input: LearningExperienceChoiceInput,
): Promise<LearningExperienceSession> {
	const enrollment = await viewerEnrollment(slug);
	if (!enrollment) throw identityRequired();
	if (enrollment.learningExperience === input.choice) {
		return toSession(enrollment);
	}
	if (enrollment.learningExperienceChangeCount >= LEARNING_EXPERIENCE_CHANGE_LIMIT) {
		throw new AppError(
			'Bạn đã dùng hết lượt đổi. Nhắn giảng viên nếu cần hỗ trợ.',
			409,
			'LEARNING_EXPERIENCE_LOCKED',
		);
	}

	const nextCount =
		enrollment.learningExperience == null
			? enrollment.learningExperienceChangeCount
			: enrollment.learningExperienceChangeCount + 1;
	const updatedCount = await prisma.teachingEnrollment.updateMany({
		where: {
			id: enrollment.id,
			learningExperienceChangeCount: enrollment.learningExperienceChangeCount,
			learningExperience: enrollment.learningExperience,
		},
		data: {
			learningExperience: input.choice,
			learningExperienceSelectedAt: new Date(),
			learningExperienceChangeCount: nextCount,
		},
	});
	if (updatedCount.count === 0) {
		throw new AppError(
			'Lựa chọn vừa được cập nhật ở một phiên khác. Vui lòng tải lại trang.',
			409,
			'LEARNING_EXPERIENCE_CONFLICT',
		);
	}

	const updated = await prisma.teachingEnrollment.findUnique({
		where: { id: enrollment.id },
		select: sessionSelect(),
	});
	if (!updated) throw identityRequired();
	return toSession(updated);
}

export async function logoutFromLearningExperience(slug: string) {
	const store = await cookies();
	store.set(cookieName(slug), '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
	});
}

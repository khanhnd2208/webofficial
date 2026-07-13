import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { type NextRequest, NextResponse } from 'next/server';

import * as courseRepo from '@/features/courses/repositories/courseRepository';
import { enrollmentService } from '@/features/enrollments';
import { AppError, withAuth } from '@/lib/apiUtils';

function resolveAttachmentPath(objectKey: string): string {
	const trimmed = objectKey.trim();
	if (trimmed.startsWith('/uploads/')) {
		return path.join(process.cwd(), 'public', trimmed.slice(1));
	}
	if (trimmed.startsWith('uploads/')) {
		return path.join(process.cwd(), 'public', trimmed);
	}
	if (trimmed.startsWith('/')) {
		return path.join(process.cwd(), 'public', trimmed.slice(1));
	}
	return path.join(process.cwd(), 'public', 'uploads', trimmed);
}

export const GET = withAuth(async (_request: NextRequest, user, context) => {
	const { id, attachmentId } = await context!.params;
	const lesson = await courseRepo.findLessonById(String(id));
	if (!lesson || lesson.status !== 'PUBLISHED' || lesson.module.course.status !== 'PUBLISHED') {
		throw new AppError('Không tìm thấy bài học', 404);
	}

	const allowed = await enrollmentService.hasActiveEnrollment(lesson.module.courseId, user.id);
	if (!allowed) {
		throw new AppError('Bạn chưa được ghi danh vào khóa học này', 403);
	}

	const attachment = lesson.attachments.find((item) => item.id === String(attachmentId));
	if (!attachment) {
		throw new AppError('Không tìm thấy tệp đính kèm', 404);
	}

	const filePath = resolveAttachmentPath(attachment.objectKey);
	if (!existsSync(filePath)) {
		throw new AppError('Không tìm thấy tệp đính kèm', 404);
	}

	const buffer = await readFile(filePath);
	const encodedName = encodeURIComponent(attachment.fileName);

	return new NextResponse(buffer, {
		status: 200,
		headers: {
			'Content-Type': attachment.mimeType || 'application/octet-stream',
			'Content-Disposition': `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
			'Content-Length': String(buffer.byteLength),
			'Cache-Control': 'private, no-store',
		},
	});
});

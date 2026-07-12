import { describe, expect, it } from 'vitest';

import { createCourseSchema, enrollSchema, reorderSchema } from '@/features/courses/schemas';
import { parseSchema } from '@/shared/validation/parse';
import { AppError } from '@/lib/appError';

describe('course schemas', () => {
	it('accepts valid create course payload', () => {
		const data = parseSchema(createCourseSchema, { title: 'Khóa NestJS' });
		expect(data.title).toBe('Khóa NestJS');
	});

	it('rejects empty title', () => {
		expect(() => parseSchema(createCourseSchema, { title: '  ' })).toThrow(AppError);
	});

	it('validates enroll payload', () => {
		const data = parseSchema(enrollSchema, { courseId: 'c1', userId: 'u1' });
		expect(data.courseId).toBe('c1');
	});

	it('validates reorder ids', () => {
		const data = parseSchema(reorderSchema, { orderedIds: ['a', 'b'] });
		expect(data.orderedIds).toHaveLength(2);
	});
});

import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

describe('generated Prisma client', () => {
	it('includes MyClassVocabAssignment', () => {
		expect(Prisma.ModelName.MyClassVocabAssignment).toBe('MyClassVocabAssignment');
	});

	it('includes TeachingClass', () => {
		expect(Prisma.ModelName.TeachingClass).toBe('TeachingClass');
	});
});

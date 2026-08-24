import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CourseVocabHub from './CourseVocabHub';
import type { MyClassVocabSetCard } from '@/features/my-class';

const set = (overrides: Partial<MyClassVocabSetCard>): MyClassVocabSetCard => ({
	assignmentId: 'a1',
	vocabSetId: 's1',
	title: 'HR terms',
	wordCount: 12,
	position: 0,
	scope: 'course',
	lessonId: null,
	lessonSlug: null,
	lessonTitle: null,
	isArchived: false,
	guessWhoReady: true,
	...overrides,
});

describe('CourseVocabHub', () => {
	it('groups course and lesson sets', () => {
		render(
			<CourseVocabHub
				courseSlug="hrm"
				sets={[
					set({ assignmentId: 'c1', title: 'Bộ toàn khóa' }),
					set({
						assignmentId: 'l1',
						vocabSetId: 's2',
						title: 'Bài 1',
						scope: 'lesson',
						lessonId: 'lesson-1',
						lessonSlug: 'bai-1',
						lessonTitle: 'Giới thiệu',
					}),
				]}
			/>,
		);
		expect(screen.getByText('Toàn khóa')).toBeVisible();
		expect(screen.getByText('Giới thiệu')).toBeVisible();
		expect(screen.getByRole('link', { name: /Bài 1/ })).toHaveAttribute('href', '/my-space/my-class/hrm/vocab/s2');
	});
});

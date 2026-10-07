import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { LearnCurriculumLesson } from '@/features/learn/progress';

import LearnCurriculum from './LearnCurriculum';

const lessons: LearnCurriculumLesson[] = [
	{
		id: 'lesson-a',
		title: 'Bài A',
		description: '',
		index: 0,
		completedCount: 0,
		requiredCount: 1,
		minutes: 10,
		sections: [
			{
				id: 'a1',
				title: 'Mục A1',
				type: 'READING',
				minutes: 10,
				lessonId: 'lesson-a',
				lessonTitle: 'Bài A',
				lessonIndex: 0,
				sectionIndex: 0,
				completed: false,
				hasNote: false,
			},
		],
	},
	{
		id: 'lesson-b',
		title: 'Bài B',
		description: '',
		index: 1,
		completedCount: 0,
		requiredCount: 1,
		minutes: 8,
		sections: [
			{
				id: 'b1',
				title: 'Mục B1',
				type: 'READING',
				minutes: 8,
				lessonId: 'lesson-b',
				lessonTitle: 'Bài B',
				lessonIndex: 1,
				sectionIndex: 0,
				completed: false,
				hasNote: false,
			},
		],
	},
];

describe('LearnCurriculum', () => {
	it('opens the lesson that contains the section the learner just moved to', () => {
		const { rerender } = render(
			<LearnCurriculum
				courseSlug="demo"
				lessons={lessons}
				openLessonId="lesson-a"
				currentId="a1"
				compact
			/>,
		);

		expect(screen.getByRole('link', { name: /Mục A1/ })).toBeVisible();
		expect(screen.queryByRole('link', { name: /Mục B1/ })).not.toBeInTheDocument();

		rerender(
			<LearnCurriculum
				courseSlug="demo"
				lessons={lessons}
				openLessonId="lesson-b"
				currentId="b1"
				compact
			/>,
		);

		expect(screen.getByRole('link', { name: /Mục B1/ })).toBeVisible();
	});
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TestEntryCard from './TestEntryCard';

describe('My Class learning chrome', () => {
	it('renders the named test with question count', () => {
		render(
			<TestEntryCard
				courseSlug="hrm"
				test={{
					slug: 'quiz-1',
					title: 'Kiểm tra tuyển dụng',
					description: 'Ôn lại bài học',
					questionCount: 12,
					scope: 'LESSON',
				}}
			/>,
		);
		const link = screen.getByRole('link', { name: 'Kiểm tra tuyển dụng, 12 câu' });
		expect(link).toHaveAttribute('href', '/my-space/my-class/hrm/tests/quiz-1');
		expect(screen.getByText('Kiểm tra tuyển dụng')).toBeVisible();
		expect(screen.getByText('12 câu')).toBeVisible();
		expect(screen.getByText(/Làm bài/)).toBeVisible();
	});

	it('shows the score after the learner has taken the test', () => {
		render(
			<TestEntryCard
				courseSlug="hrm"
				test={{
					slug: 'section-check',
					title: 'Kiểm tra nền tảng',
					description: '',
					questionCount: 3,
					scope: 'SECTION',
				}}
				score={{ score: 2, total: 3 }}
			/>,
		);

		expect(screen.getByRole('link', { name: 'Kiểm tra nền tảng, 3 câu · 2/3' })).toBeVisible();
		expect(screen.getByText('3 câu · 2/3')).toBeVisible();
		expect(screen.getByText(/Xem lại/)).toBeVisible();
	});

	it('marks unpublished tests so admin outline does not look like the learner list', () => {
		render(
			<TestEntryCard
				courseSlug="hrm"
				density="compact"
				test={{
					slug: 'progress-test',
					title: 'Progress Test',
					description: '',
					questionCount: 3,
					scope: 'LESSON',
					authoring: { status: 'DRAFT', updatedAt: '2026-08-16T00:00:00.000Z', hasDraft: true },
				}}
			/>,
		);
		expect(screen.getByRole('link', { name: 'Progress Test, 3 câu, bản nháp. Làm bài' })).toHaveAttribute(
			'data-draft',
			'true',
		);
		expect(screen.getByText('Nháp')).toBeVisible();
	});
});

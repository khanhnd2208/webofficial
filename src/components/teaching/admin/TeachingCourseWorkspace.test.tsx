import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TeachingPopoverRoot } from '@/components/teaching/TeachingPopover';
import type { ActiveRecallDeckListItem } from '@/features/active-recall';
import type { TeachingCourseListItem } from '@/features/teaching/types';

import { TeachingCourseWorkspace } from './TeachingCourseWorkspace';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function course(overrides: Partial<TeachingCourseListItem> = {}): TeachingCourseListItem {
	return {
		id: 'course-1',
		courseCode: 'HRM101',
		courseName: 'Human Resource Management',
		status: 'ACTIVE',
		createdAt: '2026-09-01T00:00:00.000Z',
		updatedAt: '2026-09-01T00:00:00.000Z',
		classCount: 0,
		activeClassCount: 0,
		tutorialCount: 0,
		deckCount: 1,
		publishedDeckCount: 0,
		activeDeckCount: 1,
		canDelete: false,
		canArchive: true,
		archiveBlockers: {},
		deleteBlockers: { decks: 1 },
		classes: [],
		...overrides,
	};
}

function deck(overrides: Partial<ActiveRecallDeckListItem> = {}): ActiveRecallDeckListItem {
	return {
		id: 'deck-1',
		slug: 'lesson-1',
		title: 'Lesson 1',
		courseId: 'course-1',
		courseCode: 'HRM101',
		courseName: 'Human Resource Management',
		subject: 'HRM',
		lessonLabel: 'Week 1',
		description: 'Should stay off the compact list',
		status: 'DRAFT',
		position: 0,
		cardCount: 8,
		classLinkCount: 0,
		updatedAt: '2026-09-01T00:00:00.000Z',
		publishedAt: null,
		...overrides,
	};
}

describe('TeachingCourseWorkspace', () => {
	it('shows compact recall rows and keeps the menu outside the open link', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingCourseWorkspace course={course()} decks={[deck()]} tab="recall" />
			</TeachingPopoverRoot>,
		);
		expect(screen.getByText('Lesson 1')).toBeInTheDocument();
		expect(screen.getByText('8 thẻ · Bản nháp')).toBeInTheDocument();
		expect(screen.queryByText('Week 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Should stay off the compact list')).not.toBeInTheDocument();
		expect(screen.queryByText('lesson-1')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Thao tác bộ thẻ Lesson 1' }));
		expect(screen.getByRole('menuitem', { name: 'Sửa nhanh' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Xóa vĩnh viễn' })).toBeEnabled();
	});

	it('requires a three-second confirmation before deleting a populated deck', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingCourseWorkspace
					course={course()}
					decks={[deck({ classLinkCount: 2 })]}
					tab="recall"
				/>
			</TeachingPopoverRoot>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Thao tác bộ thẻ Lesson 1' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Xóa vĩnh viễn' }));

		expect(
			screen.getByText(
				'Xóa vĩnh viễn “Lesson 1” cùng 8 thẻ và gỡ bộ thẻ khỏi 2 lớp? Thao tác này không thể hoàn tác.',
			),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Xóa vĩnh viễn (3 giây)' })).toBeDisabled();
	});

	it('hides create actions when the course is archived', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingCourseWorkspace
					course={course({ status: 'ARCHIVED', canArchive: true })}
					decks={[deck({ status: 'ARCHIVED' })]}
					tab="recall"
				/>
			</TeachingPopoverRoot>,
		);
		expect(screen.queryByRole('link', { name: 'Tạo bộ thẻ' })).not.toBeInTheDocument();
	});

	it('shows numbered deck titles in natural ascending order', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingCourseWorkspace
					course={course({ deckCount: 3 })}
					decks={[
						deck({ id: 'deck-10', title: 'HRM - Lecture 10' }),
						deck({ id: 'deck-2', title: 'HRM - Lecture 2' }),
						deck({ id: 'deck-1', title: 'HRM - Lecture 1' }),
					]}
					tab="recall"
				/>
			</TeachingPopoverRoot>,
		);

		expect(
			screen
				.getAllByRole('link', { name: /HRM - Lecture/ })
				.map((link) => link.querySelector('p')?.textContent),
		).toEqual(['HRM - Lecture 1', 'HRM - Lecture 2', 'HRM - Lecture 10']);
	});
});

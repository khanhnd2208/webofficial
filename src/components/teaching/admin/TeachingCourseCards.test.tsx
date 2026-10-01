import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TeachingPopoverRoot } from '@/components/teaching/TeachingPopover';
import type { TeachingCourseListItem } from '@/features/teaching/types';

import { TeachingCourseCards } from './TeachingCourseCards';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function course(overrides: Partial<TeachingCourseListItem> = {}): TeachingCourseListItem {
	return {
		id: 'course-1',
		courseCode: '61MGT3HRM',
		courseName: 'Quản trị nhân sự',
		status: 'ACTIVE',
		createdAt: '2026-09-01T00:00:00.000Z',
		updatedAt: '2026-09-01T00:00:00.000Z',
		classCount: 1,
		activeClassCount: 1,
		tutorialCount: 1,
		deckCount: 2,
		publishedDeckCount: 1,
		activeDeckCount: 2,
		canDelete: false,
		canArchive: false,
		archiveBlockers: { activeClasses: 1 },
		deleteBlockers: { classes: 1, decks: 2 },
		classes: [],
		...overrides,
	};
}

describe('TeachingCourseCards', () => {
	it('shows compact course identity and keeps the menu outside the open link', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingCourseCards courses={[course()]} />
			</TeachingPopoverRoot>,
		);
		expect(screen.getByText('61MGT3HRM')).toBeInTheDocument();
		expect(screen.getByText('Quản trị nhân sự')).toBeInTheDocument();
		expect(screen.getByText('1')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.queryByText('Mở môn')).not.toBeInTheDocument();
		expect(screen.queryByText('tut')).not.toBeInTheDocument();

		const card = screen.getByTestId('teaching-course-card-course-1');
		expect(card.tagName).toBe('A');
		expect(screen.getByTestId('teaching-quick-menu')).not.toBe(card);
		fireEvent.click(screen.getByTestId('teaching-quick-menu'));
		expect(screen.getByRole('menuitem', { name: 'Sửa' })).toBeInTheDocument();
	});

	it('defaults to active courses and can show archived ones', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingCourseCards
					courses={[
						course(),
						course({
							id: 'course-2',
							courseCode: 'OB101',
							courseName: 'Hành vi tổ chức',
							status: 'ARCHIVED',
							activeClassCount: 0,
							canArchive: true,
							archiveBlockers: {},
						}),
					]}
				/>
			</TeachingPopoverRoot>,
		);
		expect(screen.getByText('61MGT3HRM')).toBeInTheDocument();
		expect(screen.queryByText('OB101')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ 1' }));
		expect(screen.getByText('OB101')).toBeInTheDocument();
		expect(screen.queryByText('61MGT3HRM')).not.toBeInTheDocument();
	});

	it('puts active classes first and collapses courses with no class being taught or deck', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingCourseCards
					courses={[
						course({
							id: 'empty',
							courseCode: 'EMPTY',
							courseName: 'Môn trống',
							classCount: 0,
							activeClassCount: 0,
							deckCount: 0,
							updatedAt: '2026-09-20T00:00:00.000Z',
						}),
						course({
							id: 'quiet',
							courseCode: 'QUIET',
							courseName: 'Chưa mở lớp',
							classCount: 1,
							activeClassCount: 0,
							updatedAt: '2026-09-20T00:00:00.000Z',
						}),
						course({
							id: 'past',
							courseCode: 'PAST',
							courseName: 'Chỉ còn lớp đã lưu trữ',
							classCount: 2,
							activeClassCount: 0,
							deckCount: 0,
							updatedAt: '2026-09-10T00:00:00.000Z',
						}),
						course({
							id: 'busy',
							courseCode: 'BUSY',
							courseName: 'Đang có lớp',
							updatedAt: '2026-09-01T00:00:00.000Z',
						}),
					]}
				/>
			</TeachingPopoverRoot>,
		);
		const links = screen.getAllByTestId(/teaching-course-card-/);
		expect(links.map((link) => link.getAttribute('data-testid'))).toEqual([
			'teaching-course-card-busy',
			'teaching-course-card-quiet',
			'teaching-course-card-empty',
			'teaching-course-card-past',
		]);
		// A course whose classes are all archived shows "0 lớp", so it belongs with the unused ones.
		expect(screen.getByText('Môn chưa có lớp đang dạy (2)')).toBeInTheDocument();
	});
});

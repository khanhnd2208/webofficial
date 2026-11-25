import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import RecallCourseIndex, { type RecallIndexGroup } from './RecallCourseIndex';

const groups: RecallIndexGroup[] = [
	{
		id: 'hrm',
		title: 'Human Resource Management',
		decks: [
			{
				id: 'd1',
				href: '/my-space/active-recall/hrm-1',
				title: 'HRM · Lesson 1 — Introduction to HRM',
				lessonLabel: 'Lesson 1',
				description: '',
				cardIds: ['a', 'b'],
			},
		],
	},
	{
		id: 'itm',
		title: 'IT Management',
		decks: [
			{
				id: 'd2',
				href: '/my-space/active-recall/itm-1',
				title: 'Bài 1: Strategy',
				lessonLabel: '',
				description: 'Why IT matters',
				cardIds: ['c'],
			},
		],
	},
];

describe('RecallCourseIndex', () => {
	beforeEach(() => localStorage.clear());

	it('lists each course as its own lesson section without a mixed test', () => {
		render(<RecallCourseIndex kicker="Ôn tập" title="Active Recall" groups={groups} />);
		const hrm = screen.getByRole('region', { name: 'Human Resource Management' });
		expect(within(hrm).getByRole('link', { name: /Bài 1:\s*Introduction to HRM/ })).toHaveAttribute(
			'href',
			'/my-space/active-recall/hrm-1',
		);
		expect(screen.getByRole('region', { name: 'IT Management' })).toBeInTheDocument();
		expect(screen.getByText(/môn/).textContent).toMatch(/2\s*môn · 2\s*bài · 3\s*thẻ/);
		expect(screen.queryByRole('link', { name: /Test yourself/ })).not.toBeInTheDocument();
	});

	it('offers to resume the deck studied most recently', () => {
		localStorage.setItem(
			'active-recall:d2',
			JSON.stringify({ currentId: 'c', known: [], studiedAt: Date.now() }),
		);
		render(
			<RecallCourseIndex
				title="IT Management"
				groups={[groups[1]]}
				testHref="/active-recall/x/test"
			/>,
		);
		expect(screen.getByRole('link', { name: /Tiếp tục ôn/ })).toHaveAttribute(
			'href',
			'/my-space/active-recall/itm-1',
		);
		expect(screen.getByRole('link', { name: /Test yourself/ })).toHaveAttribute(
			'href',
			'/active-recall/x/test',
		);
	});

	it('says so when nothing is published', () => {
		render(<RecallCourseIndex title="Active Recall" groups={[]} />);
		expect(screen.getByText('Chưa có bộ thẻ nào được xuất bản.')).toBeInTheDocument();
	});
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from './api';
import { ClassRecallWorkspace } from './ClassRecallWorkspace';

vi.mock('./api', () => ({ teachingApi: vi.fn() }));

const apiMock = vi.mocked(teachingApi);
const assignments = [
	{
		id: 'link-1',
		deckId: 'deck-1',
		slug: 'lesson-1',
		title: 'Lesson 1',
		lessonLabel: 'Lesson 1',
		status: 'PUBLISHED' as const,
		cardCount: 10,
		enabled: true,
		displayOrder: 0,
	},
	{
		id: 'link-2',
		deckId: 'deck-2',
		slug: 'lesson-2',
		title: 'Lesson 2',
		lessonLabel: 'Lesson 2',
		status: 'PUBLISHED' as const,
		cardCount: 12,
		enabled: true,
		displayOrder: 1,
	},
];

describe('ClassRecallWorkspace', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		apiMock.mockResolvedValue(assignments);
	});

	it('saves toggles and the reordered display positions', async () => {
		render(
			<ClassRecallWorkspace classId="class-1" courseId="course-1" initial={assignments} />,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Đưa Lesson 2 lên' }));
		fireEvent.click(screen.getByRole('checkbox', { name: /Lesson 1/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

		await waitFor(() =>
			expect(apiMock).toHaveBeenCalledWith('/api/admin/teaching/classes/class-1/recall', {
				method: 'PUT',
				body: JSON.stringify({
					assignments: [
						{ deckId: 'deck-2', enabled: true, displayOrder: 0 },
						{ deckId: 'deck-1', enabled: false, displayOrder: 1 },
					],
				}),
			}),
		);
	});
});

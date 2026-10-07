import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LearnStudioSection } from '@/features/learn/types';

import RevisionDialog from './RevisionDialog';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin/client', async () => {
	const actual = await vi.importActual<typeof import('@/lib/admin/client')>('@/lib/admin/client');
	return { ...actual, adminFetch };
});

const section: LearnStudioSection = {
	id: 's1',
	lessonId: 'l1',
	type: 'READING',
	title: 'Mục 1',
	durationMinutes: null,
	summary: '',
	keyTakeaways: [],
	markdown: 'Nội dung mới',
	discussion: null,
	estimatedMinutes: 1,
	updatedAt: '2026-10-05T10:00:00.000Z',
};

const revision = {
	id: 'r1',
	title: 'Mục 1',
	reason: 'autosave',
	createdAt: '2026-10-05T09:00:00.000Z',
};

describe('RevisionDialog', () => {
	beforeEach(() => adminFetch.mockReset());

	it('shows the diff of a version and restores it after saving pending edits', async () => {
		adminFetch.mockImplementation(async (url: string, init?: RequestInit) => {
			if (String(url).endsWith('/revisions')) return [revision];
			if (init?.method === 'POST') return { ...section, markdown: 'Nội dung cũ' };
			return {
				...revision,
				summary: '',
				markdown: 'Nội dung cũ',
				keyTakeaways: [],
				discussion: null,
			};
		});
		const flush = vi.fn(async () => ({ ok: true }));
		const onRestored = vi.fn();
		render(
			<RevisionDialog
				section={section}
				flush={flush}
				onClose={() => undefined}
				onRestored={onRestored}
			/>,
		);
		await waitFor(() => expect(screen.getByText('Tự lưu')).toBeInTheDocument());
		await waitFor(() => expect(screen.getByText(/cũ/)).toBeInTheDocument());

		fireEvent.click(screen.getByRole('button', { name: 'Khôi phục bản này' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Khôi phục' }));
		await waitFor(() => expect(onRestored).toHaveBeenCalled());
		expect(flush).toHaveBeenCalled();
		expect(adminFetch).toHaveBeenCalledWith('/api/admin/learn/sections/s1/revisions/r1', {
			method: 'POST',
		});
	});

	it('explains when there is no version yet', async () => {
		adminFetch.mockResolvedValue([]);
		render(
			<RevisionDialog
				section={section}
				flush={async () => ({ ok: true })}
				onClose={() => undefined}
				onRestored={() => undefined}
			/>,
		);
		expect(await screen.findByText(/Chưa có phiên bản nào/)).toBeInTheDocument();
		expect(screen.queryByText('Đang tải…')).not.toBeInTheDocument();
	});
});

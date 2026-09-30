import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CreateMessagePage from './page';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: navigation.push }),
}));

vi.mock('next/dynamic', () => ({
	default: () =>
		(({ content, onChange }: { content: string; onChange: (value: string) => void }) => (
			<textarea
				aria-label="Nội dung lời nhắn"
				value={content}
				onChange={(event) => onChange(event.target.value)}
			/>
		)) as ComponentType,
}));

vi.mock('@/components/messages/MusicTrackSelect', () => ({
	default: () => <div data-testid="music-select" />,
}));

vi.mock('@/components/forms/ThumbnailUpload', () => ({
	default: () => <div data-testid="thumbnail-upload" />,
}));

vi.mock('@/lib/admin/client', () => ({ adminFetch: vi.fn() }));

const DRAFT_KEY = 'message-draft-create-v3';

function storedDraft(overrides: Record<string, unknown> = {}) {
	return {
		title: 'Lời nhắn riêng',
		recipientName: 'Người nhận',
		displayFont: 'serif',
		content: '<p>Nội dung đã lưu</p>',
		coverImageUrl: '',
		musicTrack: '',
		usePassword: true,
		password: '87654321',
		expiresAt: '',
		isPublished: true,
		savedAt: Date.now(),
		...overrides,
	};
}

describe('CreateMessagePage draft privacy', () => {
	beforeEach(() => {
		localStorage.clear();
		navigation.push.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not restore a password left by an older draft format', async () => {
		localStorage.setItem(DRAFT_KEY, JSON.stringify(storedDraft()));
		render(<CreateMessagePage />);

		await waitFor(() => expect(screen.getByText(/Đã khôi phục bản nháp/)).toBeVisible());
		expect(screen.getByPlaceholderText('12345678')).toHaveValue('');
	});

	it('never writes the message password into the browser draft', async () => {
		vi.useFakeTimers();
		render(<CreateMessagePage />);

		fireEvent.change(screen.getByPlaceholderText('Gửi đến người thương...'), {
			target: { value: 'Lời nhắn an toàn' },
		});
		fireEvent.click(screen.getByRole('checkbox', { name: 'Bảo vệ bằng mã 8 chữ số' }));
		fireEvent.change(screen.getByPlaceholderText('12345678'), {
			target: { value: '12345678' },
		});

		act(() => vi.advanceTimersByTime(5_100));
		const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') as Record<string, unknown>;
		expect(draft).not.toHaveProperty('password');
		expect(draft.usePassword).toBe(true);
	});
});

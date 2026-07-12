import { describe, it, expect, beforeEach } from 'vitest';

import { createMessage, unlockMessage, getPublicMessage } from '@/services/messageService';
import { AppError } from '@/lib/appError';

const CREATOR = 'creator-user-001';

function baseInput(overrides: Record<string, unknown> = {}) {
	return {
		title: 'Happy Birthday',
		recipientName: 'Lan',
		content: 'Wishing you joy!',
		isPublished: true,
		...overrides,
	};
}

describe('messageService', () => {
	beforeEach(async () => {
		const Message = (await import('@/models/Message')).default;
		await Message.deleteMany({});
	});

	it('creates a message without password', async () => {
		const msg = await createMessage(CREATOR, baseInput());
		expect(msg.slug).toHaveLength(8);
		expect(msg.hasPassword).toBe(false);
		expect(msg.isPublished).toBe(true);
	});

	it('creates a message with 8-digit password', async () => {
		const msg = await createMessage(
			CREATOR,
			baseInput({ title: 'Secret', content: 'Hidden content', password: '12345678' }),
		);
		expect(msg.hasPassword).toBe(true);
	});

	it('rejects invalid password format', async () => {
		await expect(
			createMessage(CREATOR, baseInput({ title: 'Bad', content: 'x', password: '1234' })),
		).rejects.toThrow(AppError);
	});

	it('unlockMessage grants access with correct password', async () => {
		const created = await createMessage(
			CREATOR,
			baseInput({ title: 'Locked', content: 'Secret note', password: '87654321' }),
		);

		const unlocked = await unlockMessage(created.slug, '87654321');
		expect(unlocked.content).toBe('Secret note');
	});

	it('unlockMessage rejects wrong password', async () => {
		const created = await createMessage(
			CREATOR,
			baseInput({ title: 'Locked', content: 'Secret note', password: '87654321' }),
		);

		await expect(unlockMessage(created.slug, '11111111')).rejects.toThrow(AppError);
	});

	it('getPublicMessage hides content when password protected', async () => {
		const created = await createMessage(
			CREATOR,
			baseInput({ title: 'Locked', content: 'Secret note', password: '87654321' }),
		);

		const pub = await getPublicMessage(created.slug);
		expect(pub.hasPassword).toBe(true);
		expect(pub.content).toBeUndefined();
	});
});

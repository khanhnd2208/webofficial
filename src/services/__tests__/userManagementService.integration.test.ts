import mongoose from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';

import User from '@/models/User';
import { getAdminUserList, setUserRole } from '@/services/userManagementService';

describe('userManagementService', () => {
	const userId = new mongoose.Types.ObjectId();

	beforeEach(async () => {
		await User.deleteMany({});
		await User.create({
			_id: userId,
			name: 'Test User',
			email: 'user@test.com',
			role: 'student',
		});
	});

	it('lists users with pagination', async () => {
		const result = await getAdminUserList({ page: 1, pageSize: 10 });
		expect(result.users.length).toBeGreaterThanOrEqual(1);
		expect(result.total).toBeGreaterThanOrEqual(1);
	});

	it('updates user role', async () => {
		const ok = await setUserRole(String(userId), 'admin');
		expect(ok).toBe(true);
		const updated = await User.findById(userId).lean();
		expect(updated?.role).toBe('admin');
	});
});

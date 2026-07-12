import type { ApiUser } from '@/lib/apiAuth';

export function createApiUser(overrides: Partial<ApiUser> = {}): ApiUser {
	return {
		id: 'user-test-001',
		email: 'student@test.com',
		name: 'Test Student',
		role: 'student',
		...overrides,
	};
}

export function createAdminUser(overrides: Partial<ApiUser> = {}): ApiUser {
	return createApiUser({
		id: 'admin-test-001',
		email: 'admin@test.com',
		name: 'Test Admin',
		role: 'admin',
		...overrides,
	});
}

export function createSessionUser(user: ApiUser) {
	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			image: user.image,
		},
		expires: new Date(Date.now() + 86400_000).toISOString(),
	};
}

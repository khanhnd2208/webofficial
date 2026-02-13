import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			role: 'admin' | 'student';
		} & DefaultSession['user'];
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		role?: 'admin' | 'student';
	}
}

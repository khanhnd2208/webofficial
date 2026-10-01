import type { DefaultSession } from 'next-auth';
import type { UserRole } from './user';

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			role: UserRole;
		} & DefaultSession['user'];
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		role?: UserRole;
		/** Seconds since epoch of the Google sign-in; caps the session length. */
		signedInAt?: number;
	}
}

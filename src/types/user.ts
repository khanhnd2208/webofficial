export type UserRole = 'student' | 'admin';

export interface UserDTO {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	image?: string;
	createdAt: string;
	updatedAt: string;
}

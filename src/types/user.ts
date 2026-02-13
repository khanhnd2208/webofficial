export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserDTO {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	image?: string;
	createdAt: string;
	updatedAt: string;
}

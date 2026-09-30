export interface UserProfileDTO {
	id: string;
	userId: string;
	email: string;
	name: string;
	image?: string;
	dateOfBirth: string | null;
	university: string;
	major: string;
	bio: string;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface UpdateUserProfileInput {
	dateOfBirth?: string | null;
	university?: string;
	major?: string;
	bio?: string;
}

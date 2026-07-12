import dbConnect from '@/lib/dbConnect';
import UserProfile, { type IUserProfile } from '@/models/UserProfile';
import type { UpdateUserProfileInput, UserProfileDTO } from '@/types/userProfile';

type ProfileLean = IUserProfile & { _id: unknown };

interface ProfileIdentity {
	userId: string;
	email: string;
	name: string;
	image?: string;
}

function toISO(value?: Date | string | null): string | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeText(value: string | undefined, maxLength: number): string {
	if (!value) return '';
	return value.trim().slice(0, maxLength);
}

function validateDateOfBirth(value: string | null | undefined): Date | null {
	if (value == null || value === '') return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) throw new Error('Ngày sinh không hợp lệ.');

	const now = new Date();
	if (parsed.getTime() > now.getTime()) throw new Error('Ngày sinh không thể ở tương lai.');

	const minYear = 1900;
	if (parsed.getUTCFullYear() < minYear) throw new Error('Ngày sinh quá xa trong quá khứ.');

	return parsed;
}

function toDTO(doc: ProfileLean): UserProfileDTO {
	return {
		id: String(doc._id),
		userId: doc.userId,
		email: doc.email,
		name: doc.name,
		image: doc.image,
		dateOfBirth: toISO(doc.dateOfBirth),
		university: doc.university?.trim() ?? '',
		major: doc.major?.trim() ?? '',
		bio: doc.bio?.trim() ?? '',
		createdAt: toISO(doc.createdAt),
		updatedAt: toISO(doc.updatedAt),
	};
}

export async function ensureUserProfile(identity: ProfileIdentity): Promise<UserProfileDTO> {
	await dbConnect();

	const safeName = identity.name?.trim() || identity.email.split('@')[0] || 'Người dùng';

	// $setOnInsert: fields only written on NEW document creation (no overlap with $set)
	// $set: fields always synced from Google on every login (email, name, image)
	// The two operators MUST NOT share any field keys — MongoDB throws ConflictingUpdateOperators otherwise.
	const profile = await UserProfile.findOneAndUpdate(
		{ userId: identity.userId },
		{
			$setOnInsert: {
				userId: identity.userId,
				dateOfBirth: null,
				university: '',
				major: '',
				bio: '',
			},
			$set: {
				email: identity.email,
				name: safeName,
				image: identity.image ?? null,
			},
		},
		{ returnDocument: 'after', upsert: true }
	).lean<ProfileLean>();

	if (!profile) throw new Error('Không thể tạo hồ sơ người dùng.');
	return toDTO(profile);
}

export async function getMyProfile(identity: ProfileIdentity): Promise<UserProfileDTO> {
	return ensureUserProfile(identity);
}

export async function updateMyProfile(identity: ProfileIdentity, input: UpdateUserProfileInput): Promise<UserProfileDTO> {
	await dbConnect();

	const profileUpdate: Partial<IUserProfile> = {
		university: normalizeText(input.university, 120),
		major: normalizeText(input.major, 120),
		bio: normalizeText(input.bio, 600),
		dateOfBirth: validateDateOfBirth(input.dateOfBirth),
	};

	const profile = await UserProfile.findOneAndUpdate(
		{ userId: identity.userId },
		{
			$setOnInsert: {
				userId: identity.userId,
			},
			$set: {
				email: identity.email,
				name: identity.name?.trim() || identity.email.split('@')[0] || 'Người dùng',
				image: identity.image ?? null,
				...profileUpdate,
			},
		},
		{ returnDocument: 'after', upsert: true }
	).lean<ProfileLean>();

	if (!profile) throw new Error('Không thể cập nhật hồ sơ người dùng.');
	return toDTO(profile);
}
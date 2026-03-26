import mongoose, { Schema, type Model } from 'mongoose';

export interface IUserProfile {
	userId: string;
	email: string;
	name: string;
	image?: string;
	dateOfBirth?: Date | null;
	university?: string;
	major?: string;
	bio?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
	{
		userId: { type: String, required: true, unique: true, index: true, trim: true },
		email: { type: String, required: true, lowercase: true, trim: true, index: true },
		name: { type: String, required: true, trim: true, maxlength: 120 },
		image: { type: String },
		dateOfBirth: { type: Date, default: null },
		university: { type: String, default: '', trim: true, maxlength: 120 },
		major: { type: String, default: '', trim: true, maxlength: 120 },
		bio: { type: String, default: '', trim: true, maxlength: 600 },
	},
	{ timestamps: true }
);

const UserProfile =
	(mongoose.models.UserProfile as Model<IUserProfile>) ??
	mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;
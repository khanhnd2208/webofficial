import mongoose, { Schema, type Model } from 'mongoose';

import type { UserRole } from '@/types/user';

export interface IUser {
	name: string;
	email: string;
	role: UserRole;
	image?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
		role: { type: String, enum: ['student', 'admin'], default: 'student', required: true },
		image: { type: String },
	},
	{ timestamps: true }
);

const User =
	(mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>('User', UserSchema);

export default User;

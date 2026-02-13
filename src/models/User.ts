import mongoose, { Schema, type Model } from 'mongoose';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface IUser {
	name: string;
	email: string;
	role: UserRole;
	image?: string;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
		role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student', required: true },
		image: { type: String },
	},
	{ timestamps: true }
);

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;

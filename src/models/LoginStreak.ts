import mongoose, { Schema, type Model } from 'mongoose';

export interface ILoginStreak {
	userId: mongoose.Types.ObjectId;
	/** ISO date strings "YYYY-MM-DD" of each login day */
	loginDays: string[];
	/** Current consecutive-day streak count */
	currentStreak: number;
	/** Longest streak ever */
	longestStreak: number;
	/** Last login date as "YYYY-MM-DD" */
	lastLoginDate: string;
	createdAt: Date;
	updatedAt: Date;
}

const LoginStreakSchema = new Schema<ILoginStreak>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		loginDays: {
			type: [String],
			default: [],
			validate: {
				validator: (v: string[]) => v.length <= 90,
				message: 'loginDays cannot exceed 90 entries',
			},
		},
		currentStreak: { type: Number, default: 0, min: 0 },
		longestStreak: { type: Number, default: 0, min: 0 },
		lastLoginDate: { type: String, default: '' },
	},
	{ timestamps: true },
);

const LoginStreak =
	(mongoose.models.LoginStreak as Model<ILoginStreak>) ??
	mongoose.model<ILoginStreak>('LoginStreak', LoginStreakSchema);

export default LoginStreak;

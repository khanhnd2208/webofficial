import mongoose, { Schema, type Model } from 'mongoose';

export interface ICourse {
	name: string;
	description?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const CourseSchema = new Schema<ICourse>(
	{
		name: { type: String, required: true, unique: true, lowercase: true, trim: true },
		description: { type: String, default: '', trim: true },
	},
	{ timestamps: true }
);

const Course = (mongoose.models.Course as Model<ICourse>) || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;

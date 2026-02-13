import mongoose, { Schema, type Model } from 'mongoose';

export interface IGrade {
	studentId: mongoose.Types.ObjectId;
	course: string;
	score: number;
	note?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const GradeSchema = new Schema<IGrade>(
	{
		studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		course: { type: String, required: true, trim: true },
		score: { type: Number, required: true, min: 0, max: 100 },
		note: { type: String },
	},
	{ timestamps: true }
);

const Grade = (mongoose.models.Grade as Model<IGrade>) || mongoose.model<IGrade>('Grade', GradeSchema);

export default Grade;

import mongoose, { type InferSchemaType } from 'mongoose';

const CourseUnitSchema = new mongoose.Schema(
	{
		courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
		unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
		order: { type: Number, required: true, default: 0 },
	},
	{ timestamps: true }
);

CourseUnitSchema.index({ courseId: 1, unitId: 1 }, { unique: true });
CourseUnitSchema.index({ courseId: 1, order: 1 });

export type CourseUnitDocument = InferSchemaType<typeof CourseUnitSchema> & {
	_id: mongoose.Types.ObjectId;
};

export default mongoose.models.CourseUnit || mongoose.model('CourseUnit', CourseUnitSchema);

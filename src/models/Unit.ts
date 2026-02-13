import mongoose, { type InferSchemaType } from 'mongoose';

const UnitSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
	},
	{ timestamps: true }
);

UnitSchema.index({ name: 1 });

export type UnitDocument = InferSchemaType<typeof UnitSchema> & {
	_id: mongoose.Types.ObjectId;
};

export default mongoose.models.Unit || mongoose.model('Unit', UnitSchema);

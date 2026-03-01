import mongoose, { type InferSchemaType } from 'mongoose';

const VocabularyCollectionSchema = new mongoose.Schema(
	{
		name: { type: String, default: '', trim: true },
		itemCount: { type: Number, default: 0, min: 0 },
	},
	{ timestamps: true }
);

VocabularyCollectionSchema.index({ name: 1 });

export type VocabularyCollectionDocument = InferSchemaType<typeof VocabularyCollectionSchema> & {
	_id: mongoose.Types.ObjectId;
};

export default mongoose.models.VocabularyCollection ||
	mongoose.model('VocabularyCollection', VocabularyCollectionSchema);

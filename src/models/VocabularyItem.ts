import mongoose, { type InferSchemaType } from 'mongoose';

const VocabularyItemSchema = new mongoose.Schema(
	{
		collectionId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'VocabularyCollection',
			required: true,
			index: true,
		},
		word: { type: String, required: true, trim: true },
		partOfSpeech: { type: String, required: true, trim: true, default: '' },
		meaningVi: { type: String, required: true, trim: true },
		meaningEn: { type: String, required: true, trim: true },
	},
	{ timestamps: true }
);

VocabularyItemSchema.index({ collectionId: 1, word: 1 }, { unique: true });

export type VocabularyItemDocument = InferSchemaType<typeof VocabularyItemSchema> & {
	_id: mongoose.Types.ObjectId;
};

export default mongoose.models.VocabularyItem || mongoose.model('VocabularyItem', VocabularyItemSchema);

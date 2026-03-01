import mongoose, { type InferSchemaType } from 'mongoose';

const LessonSchema = new mongoose.Schema(
	{
		unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
		title: { type: String, required: true, trim: true },
		content: { type: String, default: '' },
		vocabCollectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'VocabularyCollection', required: false, index: true },
		vocabularyCount: { type: Number, required: true, default: 0, min: 0 },
	},
	{ timestamps: true }
);

export type LessonDocument = InferSchemaType<typeof LessonSchema> & {
	_id: mongoose.Types.ObjectId;
};

export default mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);


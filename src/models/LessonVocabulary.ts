import mongoose, { type InferSchemaType } from 'mongoose';

const LessonVocabularySchema = new mongoose.Schema(
	{
		lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
		word: { type: String, required: true, trim: true },
		partOfSpeech: { type: String, required: true, trim: true, default: '' },
		meaningVi: { type: String, required: true, trim: true },
		meaningEn: { type: String, required: true, trim: true },
	},
	{ timestamps: true }
);

LessonVocabularySchema.index({ lessonId: 1, word: 1 }, { unique: true });

export type LessonVocabularyDocument = InferSchemaType<typeof LessonVocabularySchema> & {
	_id: mongoose.Types.ObjectId;
};

export default mongoose.models.LessonVocabulary ||
	mongoose.model('LessonVocabulary', LessonVocabularySchema);

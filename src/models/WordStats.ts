import mongoose, { Schema, type Model } from 'mongoose';

export interface IPracticeEntry {
	mode: 'flashcards' | 'mcq' | 'fill-blank' | 'matching';
	correct: boolean;
	timestamp: Date;
}

export interface IWordStats {
	userId: mongoose.Types.ObjectId;
	word: string;
	correctCount: number;
	wrongCount: number;
	lastPracticed: Date;
	history: IPracticeEntry[];
	createdAt: Date;
	updatedAt: Date;
}

const PracticeEntrySchema = new Schema<IPracticeEntry>(
	{
		mode: { type: String, required: true, enum: ['flashcards', 'mcq', 'fill-blank', 'matching'] },
		correct: { type: Boolean, required: true },
		timestamp: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const WordStatsSchema = new Schema<IWordStats>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		word: { type: String, required: true, trim: true },
		correctCount: { type: Number, default: 0, min: 0 },
		wrongCount: { type: Number, default: 0, min: 0 },
		lastPracticed: { type: Date, default: Date.now },
		history: {
			type: [PracticeEntrySchema],
			default: [],
			validate: {
				validator: (v: unknown[]) => v.length <= 500,
				message: 'Practice history cannot exceed 500 entries',
			},
		},
	},
	{ timestamps: true }
);

// Compound unique index: one stats doc per user+word
WordStatsSchema.index({ userId: 1, word: 1 }, { unique: true });
WordStatsSchema.index({ userId: 1, lastPracticed: -1 });

const WordStats =
	(mongoose.models.WordStats as Model<IWordStats>) ??
	mongoose.model<IWordStats>('WordStats', WordStatsSchema);

export default WordStats;

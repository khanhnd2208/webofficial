import mongoose, { Schema, type Model } from 'mongoose';

export interface IVocabTerm {
	word: string;
	definition: string;
	partOfSpeech?: string;
	example?: string;
}

export interface IVocabSet {
	title: string;
	description?: string;
	ownerId: mongoose.Types.ObjectId;
	ownerName: string;
	terms: IVocabTerm[];
	termCount: number;
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const VocabTermSchema = new Schema<IVocabTerm>(
	{
		word: { type: String, required: true, trim: true },
		definition: { type: String, required: true, trim: true },
		partOfSpeech: { type: String, trim: true, default: '' },
		example: { type: String, trim: true, default: '' },
	},
	{ _id: false }
);

const VocabSetSchema = new Schema<IVocabSet>(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, trim: true, default: '' },
		ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		ownerName: { type: String, required: true, trim: true },
		terms: {
			type: [VocabTermSchema],
			default: [],
			validate: {
				validator: (v: unknown[]) => v.length <= 2000,
				message: 'A vocabulary set cannot exceed 2000 terms',
			},
		},
		termCount: { type: Number, default: 0, min: 0 },
		isPublic: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

VocabSetSchema.index({ ownerId: 1, updatedAt: -1 });
VocabSetSchema.index({ isPublic: 1, updatedAt: -1 });
VocabSetSchema.index({ title: 'text', description: 'text' });

VocabSetSchema.pre('save', function () {
	this.termCount = this.terms.length;
});

const VocabSet = (mongoose.models.VocabSet as Model<IVocabSet>) || mongoose.model<IVocabSet>('VocabSet', VocabSetSchema);
export default VocabSet;

import mongoose, { Schema, type Model } from 'mongoose';

import {
	INQUIRY_STATUSES,
	INQUIRY_TYPES,
	type InquiryEmailStatus,
	type InquiryStatus,
	type InquiryType,
} from '@/features/inquiries/constants';

export {
	INQUIRY_STATUSES,
	INQUIRY_TYPES,
	type InquiryEmailStatus,
	type InquiryStatus,
	type InquiryType,
} from '@/features/inquiries/constants';

export interface IInquiryStatusHistoryEntry {
	status: InquiryStatus;
	at: Date;
	note?: string;
}

export interface IInquiry {
	name: string;
	email: string;
	submittedByUserId?: string;
	submitterType?: 'account' | 'guest';
	inquiryType: InquiryType;
	roleOrStage?: string;
	organization?: string;
	orgSize?: string;
	industry?: string;
	context: string;
	problem?: string;
	consequence?: string;
	tried?: string;
	desiredOutcome?: string;
	preferredFormat?: string;
	timeframe?: string;
	budgetOptional?: string;
	urgency?: string;
	sourcePage?: string;
	sourceCourseSlug?: string;
	campaignParams?: Record<string, string>;
	agreedScope: boolean;
	agreedPrivacy: boolean;
	status: InquiryStatus;
	internalNotes?: string;
	statusHistory: IInquiryStatusHistoryEntry[];
	adminEmailStatus?: InquiryEmailStatus;
	adminEmailError?: string;
	senderEmailStatus?: InquiryEmailStatus;
	senderEmailError?: string;
	/** Legacy compatibility alias for the admin notification status. */
	emailStatus: InquiryEmailStatus;
	/** Legacy compatibility alias for the admin notification error. */
	emailError?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const StatusHistorySchema = new Schema<IInquiryStatusHistoryEntry>(
	{
		status: { type: String, required: true, enum: INQUIRY_STATUSES },
		at: { type: Date, required: true, default: Date.now },
		note: { type: String, trim: true },
	},
	{ _id: false },
);

const InquirySchema = new Schema<IInquiry>(
	{
		name: { type: String, required: true, trim: true, index: true },
		email: { type: String, required: true, trim: true, lowercase: true, index: true },
		submittedByUserId: { type: String, trim: true, index: true },
		submitterType: { type: String, enum: ['account', 'guest'], index: true },
		inquiryType: { type: String, required: true, enum: INQUIRY_TYPES, index: true },
		roleOrStage: { type: String, trim: true },
		organization: { type: String, trim: true },
		orgSize: { type: String, trim: true },
		industry: { type: String, trim: true },
		context: { type: String, required: true, trim: true },
		problem: { type: String, trim: true },
		consequence: { type: String, trim: true },
		tried: { type: String, trim: true },
		desiredOutcome: { type: String, trim: true },
		preferredFormat: { type: String, trim: true },
		timeframe: { type: String, trim: true },
		budgetOptional: { type: String, trim: true },
		urgency: { type: String, trim: true },
		sourcePage: { type: String, trim: true },
		sourceCourseSlug: { type: String, trim: true },
		campaignParams: { type: Map, of: String },
		agreedScope: { type: Boolean, required: true },
		agreedPrivacy: { type: Boolean, required: true },
		status: { type: String, required: true, enum: INQUIRY_STATUSES, default: 'NEW', index: true },
		internalNotes: { type: String, trim: true },
		statusHistory: { type: [StatusHistorySchema], default: [] },
		adminEmailStatus: {
			type: String,
			enum: ['pending', 'sent', 'failed'],
			default: 'pending',
		},
		adminEmailError: { type: String },
		senderEmailStatus: {
			type: String,
			enum: ['pending', 'sent', 'failed'],
			default: 'pending',
		},
		senderEmailError: { type: String },
		emailStatus: {
			type: String,
			required: true,
			enum: ['pending', 'sent', 'failed'],
			default: 'pending',
		},
		emailError: { type: String },
	},
	{ timestamps: true },
);

InquirySchema.index({ createdAt: -1 });
InquirySchema.index({ status: 1, createdAt: -1 });

const Inquiry =
	(mongoose.models.Inquiry as Model<IInquiry>) ?? mongoose.model<IInquiry>('Inquiry', InquirySchema);

export default Inquiry;

import mongoose, { Schema, type Model } from 'mongoose';

/** TTL-backed rate limit hits — stores HMAC of client IP, never raw IP. */
export interface IInquiryRateLimit {
	ipHmac: string;
	createdAt: Date;
}

const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

const InquiryRateLimitSchema = new Schema<IInquiryRateLimit>(
	{
		ipHmac: { type: String, required: true, index: true },
		createdAt: { type: Date, default: Date.now, expires: RATE_LIMIT_WINDOW_SECONDS },
	},
	{ timestamps: false },
);

InquiryRateLimitSchema.index({ ipHmac: 1, createdAt: -1 });

const InquiryRateLimit =
	(mongoose.models.InquiryRateLimit as Model<IInquiryRateLimit>) ??
	mongoose.model<IInquiryRateLimit>('InquiryRateLimit', InquiryRateLimitSchema);

export default InquiryRateLimit;

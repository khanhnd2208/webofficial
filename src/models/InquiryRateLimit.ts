import mongoose, { Schema, type Model } from 'mongoose';

/**
 * One atomic counter per fixed rate-limit window.
 * `_id` is an HMAC bucket key; a raw IP address is never persisted.
 *
 * Older per-hit records may remain in the collection until their existing TTL
 * expires. They are ignored by the bucket-based limiter, so no migration is
 * required.
 */
export interface IInquiryRateLimit {
	_id: string;
	count: number;
	windowStart: Date;
	expiresAt: Date;
}

const InquiryRateLimitSchema = new Schema<IInquiryRateLimit>(
	{
		_id: { type: String, required: true },
		count: { type: Number, required: true, min: 0, default: 0 },
		windowStart: { type: Date, required: true },
		expiresAt: { type: Date, required: true },
	},
	{ timestamps: false },
);

InquiryRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const InquiryRateLimit =
	(mongoose.models.InquiryRateLimit as Model<IInquiryRateLimit>) ??
	mongoose.model<IInquiryRateLimit>('InquiryRateLimit', InquiryRateLimitSchema);

export default InquiryRateLimit;

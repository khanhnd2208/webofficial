import { z } from 'zod';

const rating = z.number().int().min(1).max(10);

export const feedbackSubmissionSchema = z
	.object({
		overall: rating,
		usefulness: rating,
		clarity: rating,
		comment: z.string().trim().max(5000),
	})
	.strict();

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;

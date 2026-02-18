import { unstable_cache } from 'next/cache';

import dbConnect from '@/lib/dbConnect';
import FeedbackPage, { type IFeedbackPage } from '@/models/FeedbackPage';

export interface FeedbackPageDTO {
	id: string;
	title: string;
	slug: string;
	content: string;
	isPublished: boolean;
	createdAt: string;
	updatedAt: string;
}

type FeedbackLean = {
	_id: unknown;
	title: string;
	slug: string;
	content: string;
	isPublished: boolean;
	createdAt?: Date;
	updatedAt?: Date;
};

function toDTO(doc: FeedbackLean): FeedbackPageDTO {
	return {
		id: String(doc._id),
		title: doc.title,
		slug: doc.slug,
		content: doc.content,
		isPublished: doc.isPublished,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
	};
}

/**
 * Get the single feedback page (create if not exists).
 * There's only ever one feedback page in the system.
 */
async function getFeedbackPageRaw(): Promise<FeedbackPageDTO> {
	await dbConnect();

	let doc = (await FeedbackPage.findOne().lean()) as unknown as FeedbackLean | null;

	if (!doc) {
		// Auto-create default feedback page
		const created = await FeedbackPage.create({
			title: 'Phản hồi',
			slug: 'feedback',
			content: '<p>Trang phản hồi đang được cập nhật.</p>',
			isPublished: true,
		});
		doc = created.toObject() as unknown as FeedbackLean;
	}

	return toDTO(doc);
}

export const getFeedbackPage = unstable_cache(
	async () => getFeedbackPageRaw(),
	['feedback-page'],
	{ revalidate: 60 }
);

/** Get feedback page for admin (always fresh, no cache) */
export async function getFeedbackPageAdmin(): Promise<FeedbackPageDTO> {
	await dbConnect();

	let doc = (await FeedbackPage.findOne().lean()) as unknown as FeedbackLean | null;

	if (!doc) {
		const created = await FeedbackPage.create({
			title: 'Phản hồi',
			slug: 'feedback',
			content: '<p>Trang phản hồi đang được cập nhật.</p>',
			isPublished: true,
		});
		doc = created.toObject() as unknown as FeedbackLean;
	}

	return toDTO(doc);
}

/** Update the feedback page content */
export async function updateFeedbackPage(input: {
	title?: string;
	content?: string;
	isPublished?: boolean;
}): Promise<FeedbackPageDTO> {
	await dbConnect();

	const update: Partial<IFeedbackPage> = {};
	if (input.title != null) update.title = String(input.title).trim();
	if (input.content != null) update.content = input.content;
	if (input.isPublished != null) update.isPublished = Boolean(input.isPublished);

	const updated = (await FeedbackPage.findOneAndUpdate(
		{},
		update,
		{ returnDocument: 'after', upsert: true, runValidators: true }
	).lean()) as unknown as FeedbackLean;

	return toDTO(updated);
}

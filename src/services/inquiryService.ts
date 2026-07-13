import dbConnect from '@/lib/dbConnect';
import { AppError } from '@/lib/appError';
import { sendInquiryEmails } from '@/lib/inquiryEmail';
import type { CreateInquiryInput, ListInquiriesQuery, UpdateInquiryInput } from '@/features/inquiries/schemas';
import Inquiry, {
	type IInquiry,
	type InquiryEmailStatus,
	type InquiryStatus,
} from '@/models/Inquiry';

type InquiryLean = IInquiry & {
	_id: unknown;
	createdAt?: Date;
	updatedAt?: Date;
};

export interface InquiryDTO {
	id: string;
	name: string;
	email: string;
	inquiryType: IInquiry['inquiryType'];
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
	statusHistory: { status: InquiryStatus; at: string; note?: string }[];
	emailStatus: InquiryEmailStatus;
	emailError?: string;
	createdAt: string;
	updatedAt: string;
}

export interface InquiryListItemDTO {
	id: string;
	name: string;
	email: string;
	inquiryType: IInquiry['inquiryType'];
	context: string;
	status: InquiryStatus;
	emailStatus: InquiryEmailStatus;
	sourcePage?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ListInquiriesResult {
	items: InquiryListItemDTO[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

function mapCampaignParams(raw?: Map<string, string> | Record<string, string>): Record<string, string> | undefined {
	if (!raw) return undefined;
	if (raw instanceof Map) {
		const out: Record<string, string> = {};
		for (const [key, value] of raw.entries()) out[key] = value;
		return Object.keys(out).length > 0 ? out : undefined;
	}
	return Object.keys(raw).length > 0 ? raw : undefined;
}

function toDTO(doc: InquiryLean): InquiryDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		id: String(doc._id),
		name: doc.name,
		email: doc.email,
		inquiryType: doc.inquiryType,
		roleOrStage: doc.roleOrStage,
		organization: doc.organization,
		orgSize: doc.orgSize,
		industry: doc.industry,
		context: doc.context,
		problem: doc.problem,
		consequence: doc.consequence,
		tried: doc.tried,
		desiredOutcome: doc.desiredOutcome,
		preferredFormat: doc.preferredFormat,
		timeframe: doc.timeframe,
		budgetOptional: doc.budgetOptional,
		urgency: doc.urgency,
		sourcePage: doc.sourcePage,
		sourceCourseSlug: doc.sourceCourseSlug,
		campaignParams: mapCampaignParams(doc.campaignParams as Map<string, string> | undefined),
		agreedScope: doc.agreedScope,
		agreedPrivacy: doc.agreedPrivacy,
		status: doc.status,
		internalNotes: doc.internalNotes,
		statusHistory: (doc.statusHistory ?? []).map((entry) => ({
			status: entry.status,
			at: new Date(entry.at).toISOString(),
			note: entry.note,
		})),
		emailStatus: doc.emailStatus,
		emailError: doc.emailError,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

function toListItemDTO(doc: InquiryLean): InquiryListItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		id: String(doc._id),
		name: doc.name,
		email: doc.email,
		inquiryType: doc.inquiryType,
		context: doc.context,
		status: doc.status,
		emailStatus: doc.emailStatus,
		sourcePage: doc.sourcePage,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

async function applyEmailResult(
	id: string,
	result: Awaited<ReturnType<typeof sendInquiryEmails>>,
): Promise<void> {
	await Inquiry.findByIdAndUpdate(id, {
		emailStatus: result.emailStatus,
		emailError: result.ok ? undefined : result.emailError,
	});
}

export async function createInquiry(input: CreateInquiryInput): Promise<InquiryDTO> {
	await dbConnect();

	const now = new Date();
	const created = await Inquiry.create({
		name: input.name,
		email: input.email,
		inquiryType: input.inquiryType,
		roleOrStage: input.roleOrStage,
		organization: input.organization,
		orgSize: input.orgSize,
		industry: input.industry,
		context: input.context,
		problem: input.problem,
		consequence: input.consequence,
		tried: input.tried,
		desiredOutcome: input.desiredOutcome,
		preferredFormat: input.preferredFormat,
		timeframe: input.timeframe,
		budgetOptional: input.budgetOptional,
		urgency: input.urgency,
		sourcePage: input.sourcePage,
		sourceCourseSlug: input.sourceCourseSlug,
		campaignParams: input.campaignParams,
		agreedScope: input.agreedScope,
		agreedPrivacy: input.agreedPrivacy,
		status: 'NEW',
		statusHistory: [{ status: 'NEW', at: now }],
		emailStatus: 'pending',
	});

	const emailResult = await sendInquiryEmails(created.toObject() as InquiryLean);
	await applyEmailResult(String(created._id), emailResult);

	const refreshed = (await Inquiry.findById(created._id).lean()) as InquiryLean | null;
	if (!refreshed) throw new AppError('Failed to create inquiry', 500);
	return toDTO(refreshed);
}

export async function listInquiries(query: ListInquiriesQuery): Promise<ListInquiriesResult> {
	const page = Math.max(1, Math.floor(query.page));
	const limit = Math.min(50, Math.max(1, Math.floor(query.limit)));

	await dbConnect();

	const filter: Record<string, unknown> = {};
	if (query.status) filter.status = query.status;
	if (query.inquiryType) filter.inquiryType = query.inquiryType;

	if (query.search) {
		const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		filter.$or = [
			{ name: { $regex: escaped, $options: 'i' } },
			{ email: { $regex: escaped, $options: 'i' } },
			{ context: { $regex: escaped, $options: 'i' } },
			{ organization: { $regex: escaped, $options: 'i' } },
		];
	}

	if (query.dateFrom || query.dateTo) {
		const dateFilter: Record<string, Date> = {};
		if (query.dateFrom) dateFilter.$gte = new Date(query.dateFrom);
		if (query.dateTo) {
			const to = new Date(query.dateTo);
			to.setHours(23, 59, 59, 999);
			dateFilter.$lte = to;
		}
		filter.createdAt = dateFilter;
	}

	const [total, items] = await Promise.all([
		Inquiry.countDocuments(filter),
		Inquiry.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
	]);

	return {
		items: (items as unknown as InquiryLean[]).map(toListItemDTO),
		page,
		limit,
		total,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	};
}

export async function getInquiry(id: string): Promise<InquiryDTO | null> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) return null;

	await dbConnect();
	const found = (await Inquiry.findById(cleaned).lean()) as InquiryLean | null;
	if (!found) return null;
	return toDTO(found);
}

export async function updateInquiry(id: string, input: UpdateInquiryInput): Promise<InquiryDTO> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) throw new AppError('Missing id', 400);

	await dbConnect();

	const existing = (await Inquiry.findById(cleaned).lean()) as InquiryLean | null;
	if (!existing) throw new AppError('Not found', 404);

	const update: Record<string, unknown> = {};

	if (input.internalNotes !== undefined) {
		update.internalNotes = input.internalNotes;
	}

	if (input.status && input.status !== existing.status) {
		update.status = input.status;
		const history = [...(existing.statusHistory ?? [])];
		history.push({
			status: input.status,
			at: new Date(),
			note: input.statusNote,
		});
		update.statusHistory = history;
	} else if (input.statusNote && input.status) {
		const history = [...(existing.statusHistory ?? [])];
		const last = history[history.length - 1];
		if (last && last.status === input.status) {
			last.note = input.statusNote;
			update.statusHistory = history;
		}
	}

	const updated = (await Inquiry.findByIdAndUpdate(cleaned, update, {
		returnDocument: 'after',
		runValidators: true,
	}).lean()) as InquiryLean | null;

	if (!updated) throw new AppError('Not found', 404);

	if (input.retryNotification) {
		return retryNotification(cleaned);
	}

	return toDTO(updated);
}

export async function deleteInquiry(id: string): Promise<void> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) throw new AppError('Missing id', 400);

	await dbConnect();
	const deleted = await Inquiry.findByIdAndDelete(cleaned);
	if (!deleted) throw new AppError('Not found', 404);
}

export async function retryNotification(id: string): Promise<InquiryDTO> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) throw new AppError('Missing id', 400);

	await dbConnect();
	const existing = (await Inquiry.findById(cleaned).lean()) as InquiryLean | null;
	if (!existing) throw new AppError('Not found', 404);

	const emailResult = await sendInquiryEmails(existing);
	await applyEmailResult(cleaned, emailResult);

	const refreshed = (await Inquiry.findById(cleaned).lean()) as InquiryLean | null;
	if (!refreshed) throw new AppError('Not found', 404);
	return toDTO(refreshed);
}

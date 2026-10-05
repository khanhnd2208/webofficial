import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import { AppError } from '@/lib/appError';
import { failedNotificationFilter } from '@/services/inquiryFilters';
import { sendInquiryAdminNotification, sendInquiryEmails } from '@/lib/inquiryEmail';
import type {
	CreateInquiryInput,
	ListInquiriesQuery,
	UpdateInquiryInput,
} from '@/features/inquiries/schemas';
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

export interface InquirySubmitter {
	submitterType: 'account' | 'guest';
	submittedByUserId?: string;
}

export interface InquiryDTO {
	id: string;
	name: string;
	email: string;
	submittedByUserId?: string;
	submitterType?: 'account' | 'guest';
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
	adminEmailStatus: InquiryEmailStatus;
	adminEmailError?: string;
	senderEmailStatus: InquiryEmailStatus;
	senderEmailError?: string;
	emailStatus: InquiryEmailStatus;
	emailError?: string;
	createdAt: string;
	updatedAt: string;
}

export interface InquiryListItemDTO {
	id: string;
	name: string;
	email: string;
	submitterType?: 'account' | 'guest';
	inquiryType: IInquiry['inquiryType'];
	organization?: string;
	context: string;
	status: InquiryStatus;
	adminEmailStatus: InquiryEmailStatus;
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

function mapCampaignParams(
	raw?: Map<string, string> | Record<string, string>,
): Record<string, string> | undefined {
	if (!raw) return undefined;
	if (raw instanceof Map) {
		const out: Record<string, string> = {};
		for (const [key, value] of raw.entries()) out[key] = value;
		return Object.keys(out).length > 0 ? out : undefined;
	}
	return Object.keys(raw).length > 0 ? raw : undefined;
}

function resolveEmailDelivery(doc: InquiryLean) {
	const legacyStatus = doc.emailStatus ?? 'pending';
	const legacyError = doc.emailError;
	return {
		adminEmailStatus: doc.adminEmailStatus ?? legacyStatus,
		adminEmailError: doc.adminEmailError ?? legacyError,
		// The legacy aggregate cannot prove that a sender confirmation was sent;
		// keep it pending until the dedicated field exists.
		senderEmailStatus: doc.senderEmailStatus ?? 'pending',
		senderEmailError: doc.senderEmailError,
		emailStatus: doc.emailStatus ?? doc.adminEmailStatus ?? 'pending',
		emailError: doc.emailError ?? doc.adminEmailError,
	};
}

function toDTO(doc: InquiryLean): InquiryDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	const delivery = resolveEmailDelivery(doc);
	return {
		id: String(doc._id),
		name: doc.name,
		email: doc.email,
		submittedByUserId: doc.submittedByUserId,
		submitterType: doc.submitterType,
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
		adminEmailStatus: delivery.adminEmailStatus,
		adminEmailError: delivery.adminEmailError,
		senderEmailStatus: delivery.senderEmailStatus,
		senderEmailError: delivery.senderEmailError,
		emailStatus: delivery.emailStatus,
		emailError: delivery.emailError,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

function toListItemDTO(doc: InquiryLean): InquiryListItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	const delivery = resolveEmailDelivery(doc);
	return {
		id: String(doc._id),
		name: doc.name,
		email: doc.email,
		submitterType: doc.submitterType,
		inquiryType: doc.inquiryType,
		organization: doc.organization,
		context: doc.context,
		status: doc.status,
		adminEmailStatus: delivery.adminEmailStatus,
		emailStatus: delivery.emailStatus,
		sourcePage: doc.sourcePage,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

async function applyEmailResult(
	id: string,
	result: Awaited<ReturnType<typeof sendInquiryEmails>>,
): Promise<void> {
	const set: Record<string, unknown> = {
		adminEmailStatus: result.adminEmailStatus,
		senderEmailStatus: result.senderEmailStatus,
		emailStatus: result.adminEmailStatus,
	};
	const unset: Record<string, 1> = {};

	if (result.adminEmailError) {
		set.adminEmailError = result.adminEmailError;
		set.emailError = result.adminEmailError;
	} else {
		unset.adminEmailError = 1;
		unset.emailError = 1;
	}
	if (result.senderEmailError) set.senderEmailError = result.senderEmailError;
	else unset.senderEmailError = 1;

	await Inquiry.findByIdAndUpdate(id, {
		$set: set,
		...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
	});
}

export async function createInquiry(
	input: CreateInquiryInput,
	submitter: InquirySubmitter = { submitterType: 'guest' },
): Promise<InquiryDTO> {
	await dbConnect();

	const now = new Date();
	const created = await Inquiry.create({
		name: input.name,
		email: input.email,
		submittedByUserId: submitter.submittedByUserId,
		submitterType: submitter.submitterType,
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
		adminEmailStatus: 'pending',
		senderEmailStatus: 'pending',
		emailStatus: 'pending',
	});

	const emailResult = await sendInquiryEmails(created.toObject() as InquiryLean);
	await applyEmailResult(String(created._id), emailResult);

	const refreshed = (await Inquiry.findById(created._id).lean()) as InquiryLean | null;
	if (!refreshed) throw new AppError('Failed to create inquiry', 500);
	return toDTO(refreshed);
}

type InquiryListOptions = ListInquiriesQuery & { failedNotification?: boolean };

function inquiryMatch(query: Partial<InquiryListOptions>): Record<string, unknown> {
	const filter: Record<string, unknown> = {};
	const clauses: Record<string, unknown>[] = [];
	if (query.status) filter.status = query.status;
	if (query.inquiryType) filter.inquiryType = query.inquiryType;
	if (query.search) {
		const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		clauses.push({
			$or: [
				{ name: { $regex: escaped, $options: 'i' } },
				{ email: { $regex: escaped, $options: 'i' } },
				{ context: { $regex: escaped, $options: 'i' } },
				{ organization: { $regex: escaped, $options: 'i' } },
			],
		});
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
	if (query.failedNotification) clauses.push(failedNotificationFilter());
	if (clauses.length === 1) Object.assign(filter, clauses[0]);
	else if (clauses.length > 1) filter.$and = clauses;
	return filter;
}

export async function countInquiriesByStatus(query: {
	search?: string;
	inquiryType?: IInquiry['inquiryType'];
	failedNotification?: boolean;
}): Promise<{ all: number; byStatus: Record<InquiryStatus, number> }> {
	await dbConnect();
	const rows = await Inquiry.aggregate<{ _id: InquiryStatus; count: number }>([
		{
			$match: inquiryMatch({
				search: query.search,
				inquiryType: query.inquiryType,
				failedNotification: query.failedNotification,
			}),
		},
		{ $group: { _id: '$status', count: { $sum: 1 } } },
	]);
	const byStatus = {
		NEW: 0,
		REVIEWING: 0,
		NEED_MORE_INFO: 0,
		QUALIFIED: 0,
		CALL_SCHEDULED: 0,
		PROPOSAL_SENT: 0,
		WON: 0,
		CLOSED: 0,
	};
	let all = 0;
	for (const row of rows) {
		all += row.count;
		if (row._id in byStatus) byStatus[row._id] = row.count;
	}
	return { all, byStatus };
}

export async function getAdjacentInquiryIds(
	id: string,
	query: {
		status?: InquiryStatus;
		inquiryType?: IInquiry['inquiryType'];
		search?: string;
		failedNotification?: boolean;
	},
): Promise<{ previousId: string | null; nextId: string | null }> {
	const cleaned = String(id ?? '').trim();
	if (!mongoose.Types.ObjectId.isValid(cleaned)) return { previousId: null, nextId: null };
	await dbConnect();
	const current = await Inquiry.findById(cleaned).select({ createdAt: 1 }).lean();
	if (!current?.createdAt) return { previousId: null, nextId: null };
	const match = inquiryMatch(query);
	const createdAt = current.createdAt;
	const objectId = new mongoose.Types.ObjectId(cleaned);
	const [previous, next] = await Promise.all([
		Inquiry.findOne({
			$and: [
				match,
				{ $or: [{ createdAt: { $gt: createdAt } }, { createdAt, _id: { $gt: objectId } }] },
			],
		})
			.sort({ createdAt: 1, _id: 1 })
			.select({ _id: 1 })
			.lean(),
		Inquiry.findOne({
			$and: [
				match,
				{ $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: objectId } }] },
			],
		})
			.sort({ createdAt: -1, _id: -1 })
			.select({ _id: 1 })
			.lean(),
	]);
	return {
		previousId: previous ? String(previous._id) : null,
		nextId: next ? String(next._id) : null,
	};
}

export async function listInquiries(query: InquiryListOptions): Promise<ListInquiriesResult> {
	const page = Math.max(1, Math.floor(query.page));
	const limit = Math.min(50, Math.max(1, Math.floor(query.limit)));

	await dbConnect();
	const filter = inquiryMatch(query);

	const [total, items] = await Promise.all([
		Inquiry.countDocuments(filter),
		Inquiry.find(filter)
			.sort({ createdAt: -1, _id: -1 })
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

	const adminResult = await sendInquiryAdminNotification(existing);
	const set: Record<string, unknown> = {
		adminEmailStatus: adminResult.status,
		emailStatus: adminResult.status,
	};
	const unset: Record<string, 1> = {};
	if (adminResult.error) {
		set.adminEmailError = adminResult.error;
		set.emailError = adminResult.error;
	} else {
		unset.adminEmailError = 1;
		unset.emailError = 1;
	}
	await Inquiry.findByIdAndUpdate(cleaned, {
		$set: set,
		...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
	});

	const refreshed = (await Inquiry.findById(cleaned).lean()) as InquiryLean | null;
	if (!refreshed) throw new AppError('Not found', 404);
	return toDTO(refreshed);
}

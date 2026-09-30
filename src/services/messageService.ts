import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

import dbConnect from '@/lib/dbConnect';
import { AppError } from '@/lib/appError';
import { DEFAULT_DISPLAY_FONT } from '@/constants/message';
import Message from '@/models/Message';
import type {
	CreateMessageInput,
	MessageDetailDTO,
	MessageListItemDTO,
	PublicMessageDTO,
	UpdateMessageInput,
} from '@/types/message';

const generateSlug = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	8,
);

type MessageLean = {
	slug: string;
	title: string;
	recipientName?: string;
	displayFont?: string;
	content: string;
	coverImageUrl?: string;
	musicTrack?: string;
	passwordHash?: string;
	createdBy: string;
	isPublished: boolean;
	viewCount: number;
	expiresAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
};

const PASSWORD_REGEX = /^\d{8}$/;

function isExpired(doc: MessageLean): boolean {
	if (!doc.expiresAt) return false;
	return new Date(doc.expiresAt) < new Date();
}

function toListItemDTO(doc: MessageLean): MessageListItemDTO {
	return {
		slug: doc.slug,
		title: doc.title,
		recipientName: doc.recipientName?.trim() || 'bạn',
		displayFont: doc.displayFont ?? DEFAULT_DISPLAY_FONT,
		coverImageUrl: doc.coverImageUrl ?? undefined,
		musicTrack: doc.musicTrack ?? undefined,
		isPublished: Boolean(doc.isPublished),
		hasPassword: Boolean(doc.passwordHash),
		viewCount: doc.viewCount ?? 0,
		expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : undefined,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date(0).toISOString(),
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date(0).toISOString(),
	};
}

function toDetailDTO(doc: MessageLean): MessageDetailDTO {
	return {
		...toListItemDTO(doc),
		content: doc.content,
	};
}

function toPublicDTO(doc: MessageLean, includeContent: boolean): PublicMessageDTO {
	const expired = isExpired(doc);
	return {
		slug: doc.slug,
		title: doc.title,
		recipientName: doc.recipientName?.trim() || 'bạn',
		displayFont: doc.displayFont ?? DEFAULT_DISPLAY_FONT,
		content: includeContent && !expired ? doc.content : undefined,
		coverImageUrl: doc.coverImageUrl ?? undefined,
		musicTrack: includeContent && !expired ? (doc.musicTrack ?? undefined) : undefined,
		hasPassword: Boolean(doc.passwordHash),
		isExpired: expired,
		isPublished: Boolean(doc.isPublished),
		viewCount: doc.viewCount ?? 0,
	};
}

async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

function validatePassword(password: string | undefined): void {
	if (password == null || password === '') return;
	if (!PASSWORD_REGEX.test(password)) {
		throw new AppError('Mật khẩu phải gồm đúng 8 chữ số', 400);
	}
}

async function generateUniqueSlug(): Promise<string> {
	for (let attempt = 0; attempt < 10; attempt++) {
		const slug = generateSlug();
		const existing = await Message.findOne({ slug }).select('_id').lean();
		if (!existing) return slug;
	}
	throw new AppError('Không thể tạo slug, vui lòng thử lại', 500);
}

async function getMessageDocBySlug(slug: string): Promise<MessageLean | null> {
	await dbConnect();
	const doc = await Message.findOne({ slug }).lean<MessageLean>();
	return doc ?? null;
}

function assertOwner(doc: MessageLean, userId: string): void {
	if (doc.createdBy !== userId) {
		throw new AppError('Forbidden', 403);
	}
}

function assertAccessible(doc: MessageLean): void {
	if (!doc.isPublished) {
		throw new AppError('Lời nhắn chưa được xuất bản', 404);
	}
	if (isExpired(doc)) {
		throw new AppError('Lời nhắn đã hết hạn', 410);
	}
}

export async function getMessagesByUser(userId: string): Promise<MessageListItemDTO[]> {
	await dbConnect();
	const docs = await Message.find({ createdBy: userId })
		.sort({ createdAt: -1 })
		.lean<MessageLean[]>();
	return docs.map(toListItemDTO);
}

export async function getMessageBySlugForOwner(
	slug: string,
	userId: string,
): Promise<MessageDetailDTO> {
	const doc = await getMessageDocBySlug(slug);
	if (!doc) throw new AppError('Không tìm thấy lời nhắn', 404);
	assertOwner(doc, userId);
	return toDetailDTO(doc);
}

export async function createMessage(
	userId: string,
	input: CreateMessageInput,
): Promise<MessageDetailDTO> {
	if (!input.title.trim()) throw new AppError('Tiêu đề là bắt buộc', 400);
	if (!input.recipientName.trim()) throw new AppError('Tên người nhận là bắt buộc', 400);
	if (!input.content.trim()) throw new AppError('Nội dung là bắt buộc', 400);
	validatePassword(input.password);

	await dbConnect();
	const slug = await generateUniqueSlug();

	const passwordHash = input.password ? await hashPassword(input.password) : undefined;
	const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

	const created = await Message.create({
		slug,
		title: input.title.trim(),
		recipientName: input.recipientName.trim(),
		displayFont: input.displayFont || DEFAULT_DISPLAY_FONT,
		content: input.content,
		coverImageUrl: input.coverImageUrl || undefined,
		musicTrack: input.musicTrack || undefined,
		passwordHash,
		createdBy: userId,
		isPublished: Boolean(input.isPublished),
		expiresAt,
	});

	return toDetailDTO(created.toObject() as MessageLean);
}

export async function updateMessage(
	slug: string,
	userId: string,
	input: UpdateMessageInput,
): Promise<MessageDetailDTO> {
	const doc = await getMessageDocBySlug(slug);
	if (!doc) throw new AppError('Không tìm thấy lời nhắn', 404);
	assertOwner(doc, userId);

	if (input.password !== undefined && input.password !== null && input.password !== '') {
		validatePassword(input.password);
	}

	const update: Record<string, unknown> = {};

	if (input.title !== undefined) {
		if (!input.title.trim()) throw new AppError('Tiêu đề là bắt buộc', 400);
		update.title = input.title.trim();
	}
	if (input.recipientName !== undefined) {
		if (!input.recipientName.trim()) throw new AppError('Tên người nhận là bắt buộc', 400);
		update.recipientName = input.recipientName.trim();
	}
	if (input.displayFont !== undefined) {
		update.displayFont = input.displayFont || DEFAULT_DISPLAY_FONT;
	}
	if (input.content !== undefined) {
		if (!input.content.trim()) throw new AppError('Nội dung là bắt buộc', 400);
		update.content = input.content;
	}
	if (input.coverImageUrl !== undefined) {
		update.coverImageUrl = input.coverImageUrl || undefined;
	}
	if (input.musicTrack !== undefined) {
		update.musicTrack = input.musicTrack || undefined;
	}
	if (input.isPublished !== undefined) {
		update.isPublished = Boolean(input.isPublished);
	}
	if (input.expiresAt !== undefined) {
		update.expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;
	}
	if (input.password !== undefined) {
		if (input.password === null || input.password === '') {
			update.passwordHash = undefined;
		} else {
			update.passwordHash = await hashPassword(input.password);
		}
	}

	await dbConnect();
	const updated = await Message.findOneAndUpdate({ slug, createdBy: userId }, update, {
		new: true,
	}).lean<MessageLean>();

	if (!updated) throw new AppError('Không tìm thấy lời nhắn', 404);
	return toDetailDTO(updated);
}

export async function deleteMessage(slug: string, userId: string): Promise<void> {
	await dbConnect();
	const result = await Message.deleteOne({ slug, createdBy: userId });
	if (result.deletedCount === 0) throw new AppError('Không tìm thấy lời nhắn', 404);
}

export async function getPublicMessage(slug: string): Promise<PublicMessageDTO> {
	const doc = await getMessageDocBySlug(slug);
	if (!doc) throw new AppError('Không tìm thấy lời nhắn', 404);
	assertAccessible(doc);

	const includeContent = !doc.passwordHash;
	if (includeContent) {
		await incrementViewCount(slug);
	}

	return toPublicDTO(doc, includeContent);
}

export async function unlockMessage(slug: string, password: string): Promise<PublicMessageDTO> {
	if (!PASSWORD_REGEX.test(password)) {
		throw new AppError('Mật khẩu phải gồm đúng 8 chữ số', 400);
	}

	const doc = await getMessageDocBySlug(slug);
	if (!doc) throw new AppError('Không tìm thấy lời nhắn', 404);
	assertAccessible(doc);

	if (!doc.passwordHash) {
		return toPublicDTO(doc, true);
	}

	const valid = await verifyPassword(password, doc.passwordHash);
	if (!valid) throw new AppError('Mật khẩu không đúng', 401);

	await incrementViewCount(slug);
	const refreshed = await getMessageDocBySlug(slug);
	if (!refreshed) throw new AppError('Không tìm thấy lời nhắn', 404);

	return toPublicDTO(refreshed, true);
}

async function incrementViewCount(slug: string): Promise<void> {
	await dbConnect();
	await Message.updateOne({ slug }, { $inc: { viewCount: 1 } });
}

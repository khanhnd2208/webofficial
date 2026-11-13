import { z } from 'zod';

import { PRIZE_TIERS } from './domain/drawPool';

const stock = z
	.number({ message: 'Số lượng phải là số' })
	.int('Số lượng phải là số nguyên')
	.min(0, 'Số lượng không được âm')
	.max(10_000, 'Số lượng quá lớn');

const prizeName = z.string().trim().min(1, 'Cần tên quà').max(80, 'Tên quà tối đa 80 ký tự');

const imagePath = z
	.string()
	.trim()
	.max(300)
	.regex(/^\/fmt2026\/[\w./-]+$/, 'Ảnh phải nằm trong /fmt2026/')
	.nullable();

export const unlockSchema = z.object({
	pin: z.string().trim().min(4, 'PIN gồm 4–12 chữ số').max(12, 'PIN gồm 4–12 chữ số'),
});

export const prizeCreateSchema = z.object({
	name: prizeName,
	remaining: stock,
	tier: z.enum(PRIZE_TIERS),
	imagePath: imagePath.optional(),
});

export const prizeUpdateSchema = z
	.object({
		name: prizeName,
		remaining: stock,
		tier: z.enum(PRIZE_TIERS),
		imagePath,
		sortOrder: z.number().int().min(0).max(1000),
		isActive: z.boolean(),
	})
	.partial()
	.refine((value) => Object.keys(value).length > 0, 'Không có gì để cập nhật');

export const settingsUpdateSchema = z
	.object({
		totalSpins: z.number().int().min(0).max(100_000),
		isOpen: z.boolean(),
		pin: z
			.string()
			.trim()
			.regex(/^\d{4,12}$/, 'PIN gồm 4–12 chữ số'),
	})
	.partial()
	.refine((value) => Object.keys(value).length > 0, 'Không có gì để cập nhật');

export type PrizeCreateInput = z.infer<typeof prizeCreateSchema>;
export type PrizeUpdateInput = z.infer<typeof prizeUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

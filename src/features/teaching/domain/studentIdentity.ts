import type { LearningExperienceAccessMode } from '../types';

export const ROSTER_IMPORT_MAX_ROWS = 500;

export function normalizeUnicode(value: string): string {
	return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function normalizeStudentCode(value: string): string {
	return normalizeUnicode(value).toUpperCase();
}

export function normalizePersonName(value: string): string {
	return normalizeUnicode(value);
}

export function normalizeEmail(value: string): string {
	return normalizeUnicode(value).toLowerCase();
}

export function normalizePhone(value: string): string {
	return normalizeUnicode(value);
}

export function accessModeFromDateOfBirth(
	dateOfBirth: string | Date | null | undefined,
): LearningExperienceAccessMode {
	return dateOfBirth ? 'DOB_PASSWORD' : 'OPEN';
}

export function passwordFromDateOfBirth(date: Date | string | null | undefined): string | null {
	if (!date) return null;
	const parsed = typeof date === 'string' ? parseIsoDateOnly(date) : date;
	if (!parsed) return null;
	const day = String(parsed.getUTCDate()).padStart(2, '0');
	const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
	return `${day}${month}${parsed.getUTCFullYear()}`;
}

export function parseIsoDateOnly(value: string | null | undefined): Date | null {
	if (!value) return null;
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;
	return utcCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function utcCalendarDate(year: number, month: number, day: number): Date | null {
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		return null;
	}
	return date;
}

export function toIsoDateOnly(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export type ParsedCalendarDate = { iso: string | null; error?: string };

export function parseCalendarDate(value: string): ParsedCalendarDate {
	const text = normalizeUnicode(value);
	if (!text) return { iso: null };

	const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (isoMatch) {
		return calendarFromParts(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
	}

	const dmyMatch = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
	if (dmyMatch) {
		return calendarFromParts(Number(dmyMatch[3]), Number(dmyMatch[2]), Number(dmyMatch[1]));
	}

	const compact = text.replace(/[/\-.\s]/g, '');
	if (/^\d{8}$/.test(compact)) {
		return calendarFromParts(
			Number(compact.slice(4, 8)),
			Number(compact.slice(2, 4)),
			Number(compact.slice(0, 2)),
		);
	}

	return { iso: null, error: 'Ngày không đúng định dạng dd/MM/yyyy' };
}

export function parseDateOfBirth(value: string, now = new Date()): ParsedCalendarDate {
	const parsed = parseCalendarDate(value);
	if (parsed.error || !parsed.iso) return parsed;
	const date = parseIsoDateOnly(parsed.iso);
	if (!date) return { iso: null, error: 'Ngày sinh không hợp lệ' };
	if (date.getTime() > startOfUtcDay(now).getTime()) {
		return { iso: null, error: 'Ngày sinh không được ở tương lai' };
	}
	return parsed;
}

function calendarFromParts(year: number, month: number, day: number): ParsedCalendarDate {
	const date = utcCalendarDate(year, month, day);
	if (!date) return { iso: null, error: 'Ngày không tồn tại trong lịch' };
	return { iso: toIsoDateOnly(date) };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
	if (!value) return null;
	if (value.length > 200 || !EMAIL_PATTERN.test(value)) return 'Email không hợp lệ';
	return null;
}

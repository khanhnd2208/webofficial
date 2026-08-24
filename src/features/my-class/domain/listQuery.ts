import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/config/constants';

export const ADMIN_TABLE_PAGE_SIZES = [20, 50] as const;
export const ADMIN_TABLE_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
export const ADMIN_TABLE_MAX_PAGE_SIZE = MAX_PAGE_SIZE;

export type SortDir = 'asc' | 'desc';

export type ListPage<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type ListQuery = {
	q?: string;
	page: number;
	pageSize: number;
	sortBy: string;
	sortDir: SortDir;
};

export type SearchLike = URLSearchParams | Record<string, string | string[] | undefined | null>;

function firstValue(value: string | string[] | undefined | null): string | undefined {
	if (Array.isArray(value)) return value[0];
	return value ?? undefined;
}

export function readSearchValue(search: SearchLike, key: string): string | undefined {
	if (search instanceof URLSearchParams) return search.get(key) ?? undefined;
	return firstValue(search[key]);
}

export function parsePositiveInt(value: string | undefined, fallback: number, max?: number): number {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) return fallback;
	return max ? Math.min(parsed, max) : parsed;
}

export function parsePageSize(value: string | undefined): number {
	return parsePositiveInt(value, ADMIN_TABLE_DEFAULT_PAGE_SIZE, ADMIN_TABLE_MAX_PAGE_SIZE);
}

export function parseSortDir(value: string | undefined, fallback: SortDir = 'desc'): SortDir {
	return value === 'asc' || value === 'desc' ? value : fallback;
}

export function parseOptionalSortDir(value?: string | null): SortDir | undefined {
	return value === 'asc' || value === 'desc' ? value : undefined;
}

export function parseSortBy<T extends string>(
	value: string | undefined,
	allowed: readonly T[] | undefined,
	fallback: T,
): T {
	if (!allowed?.length) return fallback;
	return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseListQuery<T extends string>(
	search: SearchLike,
	options: {
		sortFields: readonly T[];
		defaultSortBy: T;
		defaultSortDir?: SortDir;
	},
): ListQuery {
	return {
		q: readSearchValue(search, 'q')?.trim() || undefined,
		page: parsePositiveInt(readSearchValue(search, 'page'), 1),
		pageSize: parsePageSize(readSearchValue(search, 'pageSize')),
		sortBy: parseSortBy(readSearchValue(search, 'sortBy'), options.sortFields, options.defaultSortBy),
		sortDir: parseSortDir(readSearchValue(search, 'sortDir'), options.defaultSortDir ?? 'desc'),
	};
}

export function listSkip(page: number, pageSize: number): number {
	return (Math.max(page, 1) - 1) * pageSize;
}

export function toListPage<T>(items: T[], total: number, page: number, pageSize: number): ListPage<T> {
	const safePageSize = Math.max(pageSize, 1);
	const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / safePageSize));
	const safePage = Math.min(Math.max(page, 1), totalPages);
	return {
		items,
		total: Math.max(total, 0),
		page: safePage,
		pageSize: safePageSize,
		totalPages,
	};
}

export function unwrapItems<T>(value: T[] | ListPage<T> | null | undefined): T[] {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	return Array.isArray(value.items) ? value.items : [];
}

export function ensureListPage<T>(
	value: T[] | ListPage<T> | null | undefined,
	page = 1,
	pageSize = ADMIN_TABLE_DEFAULT_PAGE_SIZE,
): ListPage<T> {
	if (value && !Array.isArray(value) && Array.isArray(value.items)) {
		return toListPage(value.items, value.total ?? value.items.length, value.page ?? page, value.pageSize ?? pageSize);
	}
	const items = Array.isArray(value) ? value : [];
	return toListPage(items, items.length, page, pageSize);
}

export function studioTableHref(
	pathname: string,
	current: Record<string, string | undefined | null>,
	patch: Record<string, string | undefined | null> = {},
): string {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries({ ...current, ...patch })) {
		if (value == null || value === '') continue;
		if (key === 'page' && value === '1') continue;
		if (key === 'pageSize' && Number(value) === ADMIN_TABLE_DEFAULT_PAGE_SIZE) continue;
		params.set(key, value);
	}
	const query = params.toString();
	return query ? `${pathname}?${query}` : pathname;
}

export function parsePublishStatus(
	value?: string | null,
): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined {
	return value === 'DRAFT' || value === 'PUBLISHED' || value === 'ARCHIVED' ? value : undefined;
}

export function parseCourseLevel(
	value?: string | null,
): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined {
	return value === 'BEGINNER' || value === 'INTERMEDIATE' || value === 'ADVANCED' ? value : undefined;
}

export function parseQuestionStatus(value?: string | null): 'ACTIVE' | 'ARCHIVED' | undefined {
	return value === 'ACTIVE' || value === 'ARCHIVED' ? value : undefined;
}

export function parseOptionalBoolean(value?: string | null): boolean | undefined {
	if (value === 'true' || value === '1') return true;
	if (value === 'false' || value === '0') return false;
	return undefined;
}

export function currentTableParams(search: SearchLike, keys: readonly string[]): Record<string, string | undefined> {
	const next: Record<string, string | undefined> = {};
	for (const key of keys) {
		const value = readSearchValue(search, key)?.trim();
		if (value) next[key] = value;
	}
	return next;
}

import type { MyClassQuestionStatus, MyClassQuestionType } from '../types';

export type BankSort = 'updatedAt' | 'difficulty' | 'usage';
export type BankTagMode = 'AND' | 'OR';

export type BankFilter = {
	q?: string;
	types?: MyClassQuestionType[];
	bloom?: number[];
	subjectId?: string;
	topicId?: string;
	includeDescendants?: boolean;
	tags?: string[];
	tagMode?: BankTagMode;
	knowledgeUnitIds?: string[];
	courseId?: string;
	status?: MyClassQuestionStatus;
	usedInTestId?: string;
	excludeTestId?: string;
	unusedOnly?: boolean;
	sort?: BankSort;
	cursor?: { updatedAt: string; id: string };
	take?: number;
};

export function normalizeBankFilter(input: BankFilter): BankFilter {
	const types = [...new Set(input.types ?? [])];
	const bloom = [...new Set((input.bloom ?? []).filter((item) => item >= 1 && item <= 6))].sort();
	const tags = [...new Set((input.tags ?? []).map((item) => item.trim()).filter(Boolean))];
	const knowledgeUnitIds = [...new Set((input.knowledgeUnitIds ?? []).filter(Boolean))];
	const take = Math.min(Math.max(input.take ?? 50, 1), 200);
	return {
		q: input.q?.trim() || undefined,
		types: types.length ? types : undefined,
		bloom: bloom.length ? bloom : undefined,
		subjectId: input.subjectId || undefined,
		topicId: input.topicId || undefined,
		includeDescendants: input.includeDescendants ?? Boolean(input.topicId),
		tags: tags.length ? tags : undefined,
		tagMode: input.tagMode === 'OR' ? 'OR' : 'AND',
		knowledgeUnitIds: knowledgeUnitIds.length ? knowledgeUnitIds : undefined,
		courseId: input.courseId || undefined,
		status: input.status,
		usedInTestId: input.usedInTestId || undefined,
		excludeTestId: input.excludeTestId || undefined,
		unusedOnly: Boolean(input.unusedOnly),
		sort: input.sort ?? 'updatedAt',
		cursor: input.cursor,
		take,
	};
}

export function splitCsvParam(value?: string | null): string[] {
	if (!value) return [];
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

export function bankFilterFromSearch(search: URLSearchParams): BankFilter {
	const bloom = splitCsvParam(search.get('bloom') ?? search.get('difficulty'))
		.map(Number)
		.filter((item) => Number.isInteger(item));
	const types = splitCsvParam(search.get('type') ?? search.get('types')) as MyClassQuestionType[];
	const cursorUpdatedAt = search.get('cursorUpdatedAt');
	const cursorId = search.get('cursorId');
	const takeRaw = search.get('take');
	const statusParam = search.get('status');
	const sortParam = search.get('sort');
	return normalizeBankFilter({
		q: search.get('q') ?? undefined,
		types: types.length ? types : undefined,
		bloom: bloom.length ? bloom : undefined,
		subjectId: search.get('subjectId') ?? undefined,
		topicId: search.get('topicId') ?? undefined,
		includeDescendants: search.get('includeDescendants') !== '0',
		tags: splitCsvParam(search.get('tags')),
		tagMode: search.get('tagMode') === 'OR' ? 'OR' : 'AND',
		knowledgeUnitIds: splitCsvParam(
			search.get('knowledgeUnitIds') || search.get('knowledgeUnitId'),
		),
		courseId: search.get('courseId') ?? undefined,
		status: statusParam === 'ARCHIVED' || statusParam === 'ACTIVE' ? statusParam : undefined,
		usedInTestId: search.get('usedInTestId') ?? undefined,
		excludeTestId: search.get('excludeTestId') ?? undefined,
		unusedOnly: search.get('unusedOnly') === '1' || search.get('unusedOnly') === 'true',
		sort: sortParam === 'difficulty' || sortParam === 'usage' ? sortParam : 'updatedAt',
		cursor: cursorUpdatedAt && cursorId ? { updatedAt: cursorUpdatedAt, id: cursorId } : undefined,
		take: takeRaw ? Number(takeRaw) : undefined,
	});
}

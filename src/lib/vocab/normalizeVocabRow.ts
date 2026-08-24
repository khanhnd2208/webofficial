import type { CreateWordInput } from '@/types/vocab';

import { canonicalVocabHeader } from './vocabHeaders';

export type NormalizedVocabRow = CreateWordInput & { _missing: string[] };

function parseHints(val: string | undefined): string[] {
	return val
		? val
				.split('||')
				.map((s) => s.trim())
				.filter(Boolean)
		: [];
}

function cell(row: Record<string, string>, key: string): string {
	return String(row[key] ?? '').trim();
}

/** Canonicalize raw CSV/XLSX keys, keeping the first non-empty value per header. */
export function canonicalizeVocabRow(raw: Record<string, string>): Record<string, string> {
	const normalized: Record<string, string> = {};
	for (const [key, value] of Object.entries(raw)) {
		const canon = canonicalVocabHeader(key);
		const next = String(value ?? '');
		if (!normalized[canon]?.trim()) normalized[canon] = next;
	}
	return normalized;
}

/**
 * Shared word-row contract for My Class CSV and the standalone store upload.
 * Required: term + at least one of meaning_vi / meaning_en / definition.
 * `definition` and `ndk_explanation` remain accepted aliases.
 */
export function mapCanonicalVocabRow(r: Record<string, string>): NormalizedVocabRow {
	const term = cell(r, 'term');
	const meaningEn = cell(r, 'meaning_en');
	const meaningVi = cell(r, 'meaning_vi');
	const definition = meaningVi || meaningEn;
	const missing: string[] = [];
	if (!term) missing.push('term');
	if (!meaningVi && !meaningEn) missing.push('meaning_vi/meaning_en');
	return {
		term,
		pronunciation: cell(r, 'pronunciation'),
		partOfSpeech: cell(r, 'part_of_speech'),
		meaningEn,
		meaningVi,
		definition,
		ndkExplanation: cell(r, 'explanation') || null,
		example: cell(r, 'example'),
		hintsHard: parseHints(r.hints_hard),
		hintsMedium: parseHints(r.hints_medium),
		hintsEasy: parseHints(r.hints_easy),
		_missing: missing,
	};
}

export function normalizeVocabRow(raw: Record<string, string>): NormalizedVocabRow {
	return mapCanonicalVocabRow(canonicalizeVocabRow(raw));
}

export function isBlankVocabRow(word: Pick<CreateWordInput, 'term' | 'meaningEn' | 'meaningVi' | 'definition'>): boolean {
	return !word.term && !word.meaningEn && !word.meaningVi && !word.definition;
}

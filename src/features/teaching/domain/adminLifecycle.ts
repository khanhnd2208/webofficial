import { AppError } from '@/lib/appError';

import type { TeachingDependencyCounts } from '../types';

export function normalizeClassCode(value: string) {
	return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function normalizeTerm(value: string) {
	return value.trim().replace(/\s+/g, ' ');
}

export function classIdentityMatches(
	row: { classCode: string; groupNo: string; term: string },
	input: { classCode: string; term: string },
) {
	const classCode = normalizeClassCode(input.classCode);
	const term = normalizeTerm(input.term);
	if (normalizeTerm(row.term) !== term) return false;
	return (
		normalizeClassCode(row.classCode) === classCode || normalizeClassCode(row.groupNo) === classCode
	);
}

export function collectTermSuggestions(terms: Iterable<string>) {
	const seen = new Map<string, string>();
	for (const term of terms) {
		const normalized = normalizeTerm(term);
		if (!normalized) continue;
		const key = normalized.toLowerCase();
		if (!seen.has(key)) seen.set(key, normalized);
	}
	return [...seen.values()].sort((left, right) => left.localeCompare(right, 'vi'));
}

export function dependencyConflict(message: string, counts: TeachingDependencyCounts) {
	const fields: Record<string, string> = {};
	for (const [key, value] of Object.entries(counts)) {
		if (typeof value === 'number' && value > 0) fields[key] = String(value);
	}
	return new AppError(message, 409, 'HAS_DEPENDENCIES', fields, counts);
}

export function summarizeCourseArchiveBlockers(counts: {
	activeClassCount: number;
	activeDeckCount: number;
}) {
	const blockers: TeachingDependencyCounts = {};
	if (counts.activeClassCount > 0) blockers.activeClasses = counts.activeClassCount;
	if (counts.activeDeckCount > 0) blockers.activeDecks = counts.activeDeckCount;
	return blockers;
}

export function summarizeCourseDeleteBlockers(counts: { classCount: number; deckCount: number }) {
	const blockers: TeachingDependencyCounts = {};
	if (counts.classCount > 0) blockers.classes = counts.classCount;
	if (counts.deckCount > 0) blockers.decks = counts.deckCount;
	return blockers;
}

export type ClassUserContentSnapshot = {
	enrollmentCount: number;
	attendanceCount: number;
	participationCount: number;
	configuredGroupCount: number;
	noteCount: number;
	publicLinkCount: number;
	customizedSessionCount: number;
	studentPageCount: number;
	sharingCount: number;
};

export function hasAuthoredStudentPage(row: {
	publicTitle?: string | null;
	publicSummary?: string | null;
	publicDescription?: string | null;
	publicAnnouncement?: string | null;
	classRules?: string | null;
}) {
	return Boolean(
		row.publicTitle?.trim() ||
		row.publicSummary?.trim() ||
		row.publicDescription?.trim() ||
		row.publicAnnouncement?.trim() ||
		row.classRules?.trim(),
	);
}

export function isClassShared(row: { attendanceVisible?: boolean; publicSlug?: string | null }) {
	return Boolean(row.attendanceVisible || row.publicSlug);
}

export function isCustomizedSession(session: {
	heldOn: Date | string | null;
	topic: string;
	method: string;
	isCancelled: boolean;
	attendanceTakenAt: Date | string | null;
	participationTakenAt: Date | string | null;
}) {
	return Boolean(
		session.heldOn ||
		session.topic.trim() ||
		session.method !== 'ROLL_CALL' ||
		session.isCancelled ||
		session.attendanceTakenAt ||
		session.participationTakenAt,
	);
}

export function summarizeClassDeleteBlockers(snapshot: ClassUserContentSnapshot) {
	const blockers: TeachingDependencyCounts = {};
	if (snapshot.enrollmentCount > 0) blockers.students = snapshot.enrollmentCount;
	if (snapshot.attendanceCount > 0) blockers.attendance = snapshot.attendanceCount;
	if (snapshot.participationCount > 0) blockers.participation = snapshot.participationCount;
	if (snapshot.configuredGroupCount > 0) blockers.groups = snapshot.configuredGroupCount;
	if (snapshot.noteCount > 0) blockers.notes = snapshot.noteCount;
	if (snapshot.publicLinkCount > 0) blockers.publicLinks = snapshot.publicLinkCount;
	if (snapshot.customizedSessionCount > 0)
		blockers.customizedSessions = snapshot.customizedSessionCount;
	if (snapshot.studentPageCount > 0) blockers.studentPage = snapshot.studentPageCount;
	if (snapshot.sharingCount > 0) blockers.sharing = snapshot.sharingCount;
	return blockers;
}

export function isEmptyClassScaffold(snapshot: ClassUserContentSnapshot) {
	return Object.keys(summarizeClassDeleteBlockers(snapshot)).length === 0;
}

export function summarizeDeckDeleteBlockers(counts: { cardCount: number; classLinkCount: number }) {
	const blockers: TeachingDependencyCounts = {};
	if (counts.cardCount > 0) blockers.cards = counts.cardCount;
	if (counts.classLinkCount > 0) blockers.classLinks = counts.classLinkCount;
	return blockers;
}

export function canDeleteDeck(counts: { cardCount: number; classLinkCount: number }) {
	return Object.keys(summarizeDeckDeleteBlockers(counts)).length === 0;
}

export function formatDependencySummary(counts: TeachingDependencyCounts) {
	const parts: string[] = [];
	if (counts.activeClasses) parts.push(`${counts.activeClasses} lớp đang dạy`);
	if (counts.classes) parts.push(`${counts.classes} lớp`);
	if (counts.activeDecks) parts.push(`${counts.activeDecks} bộ thẻ đang dùng`);
	if (counts.decks) parts.push(`${counts.decks} bộ thẻ`);
	if (counts.classLinks) parts.push(`${counts.classLinks} lớp đang gắn bộ thẻ`);
	if (counts.students) parts.push(`${counts.students} học viên`);
	if (counts.attendance) parts.push(`${counts.attendance} điểm danh`);
	if (counts.participation) parts.push(`${counts.participation} điểm CP`);
	if (counts.groups) parts.push(`${counts.groups} nhóm`);
	if (counts.notes) parts.push(`${counts.notes} ghi chú`);
	if (counts.publicLinks) parts.push(`${counts.publicLinks} tài nguyên công khai`);
	if (counts.customizedSessions) parts.push(`${counts.customizedSessions} buổi đã tùy chỉnh`);
	if (counts.studentPage) parts.push('nội dung trang sinh viên');
	if (counts.sharing) parts.push('đang chia sẻ');
	if (counts.cards) parts.push(`${counts.cards} thẻ`);
	return parts.join(', ');
}

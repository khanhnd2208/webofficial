const PREFIX = 'my-class:admin-draft:';
const DISMISS_PREFIX = 'my-class:admin-draft-dismissed:';

export type DraftComparable = {
	title: string;
	summary: string;
	slug?: string;
	foundationHtml?: string;
	academicHtml?: string;
	expertHtml?: string;
};

export function normalizeDraftHtml(value: string | undefined | null): string {
	if (!value) return '';
	let html = value
		.replace(/\u00a0/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/<(strong|b)(\s[^>]*)?>/gi, '<strong>')
		.replace(/<\/(strong|b)>/gi, '</strong>')
		.replace(/<(em|i)(\s[^>]*)?>/gi, '<em>')
		.replace(/<\/(em|i)>/gi, '</em>')
		.replace(/\s+(?:class|style|target|rel|dir)="[^"]*"/gi, '')
		.replace(/<(p|h[1-6]|li|ul|ol|td|th|div|span)(\s+)>/gi, '<$1>');
	for (let i = 0; i < 3; i += 1) {
		const next = html
			.replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/gi, '<li>$1</li>')
			.replace(/<(td|th)>\s*<p>([\s\S]*?)<\/p>\s*<\/\1>/gi, '<$1>$2</$1>')
			.replace(/<span>([\s\S]*?)<\/span>/gi, '$1');
		if (next === html) break;
		html = next;
	}
	return html
		.replace(/<p>(?:\s|<br\s*\/?>)*<\/p>/gi, '')
		.replace(/<br\s*\/?>/gi, '')
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.trim();
}

export function workspaceFieldsEqual(
	left: DraftComparable,
	right: DraftComparable,
	options?: { compareSlug?: boolean },
): boolean {
	if (left.title.trim() !== right.title.trim()) return false;
	if (left.summary.trim() !== right.summary.trim()) return false;
	if (options?.compareSlug && (left.slug ?? '') !== (right.slug ?? '')) return false;
	return (
		normalizeDraftHtml(left.foundationHtml) === normalizeDraftHtml(right.foundationHtml) &&
		normalizeDraftHtml(left.academicHtml) === normalizeDraftHtml(right.academicHtml) &&
		normalizeDraftHtml(left.expertHtml) === normalizeDraftHtml(right.expertHtml)
	);
}

export function workspaceDraftDiffers(
	draft: DraftComparable,
	current: DraftComparable,
	options?: { compareSlug?: boolean },
): boolean {
	return !workspaceFieldsEqual(draft, current, options);
}

function dismissKey(
	draft: Pick<WorkspaceDraftPayload, 'courseId' | 'nodeType' | 'nodeId' | 'savedAt'>,
) {
	return `${DISMISS_PREFIX}${draft.courseId}:${draft.nodeType}:${draft.nodeId}:${draft.savedAt}`;
}

export function dismissWorkspaceDraft(draft: WorkspaceDraftPayload) {
	try {
		sessionStorage.setItem(dismissKey(draft), '1');
	} catch {
		/* private mode */
	}
}

export function isWorkspaceDraftDismissed(draft: WorkspaceDraftPayload): boolean {
	try {
		return sessionStorage.getItem(dismissKey(draft)) === '1';
	} catch {
		return false;
	}
}

export type WorkspaceDraftPayload = {
	courseId: string;
	nodeType: 'lesson' | 'section' | 'unit';
	nodeId: string;
	title: string;
	slug?: string;
	summary: string;
	foundationHtml?: string;
	academicHtml?: string;
	expertHtml?: string;
	baseUpdatedAt: string;
	savedAt: number;
};

const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function workspaceDraftKey(
	courseId: string,
	nodeType: WorkspaceDraftPayload['nodeType'],
	nodeId: string,
) {
	return `${PREFIX}${courseId}:${nodeType}:${nodeId}`;
}

export function readWorkspaceDraft(
	courseId: string,
	nodeType: WorkspaceDraftPayload['nodeType'],
	nodeId: string,
): WorkspaceDraftPayload | null {
	try {
		const raw = localStorage.getItem(workspaceDraftKey(courseId, nodeType, nodeId));
		if (!raw) return null;
		const draft = JSON.parse(raw) as WorkspaceDraftPayload;
		if (!draft.savedAt || Date.now() - draft.savedAt > MAX_AGE) {
			localStorage.removeItem(workspaceDraftKey(courseId, nodeType, nodeId));
			return null;
		}
		return draft;
	} catch {
		return null;
	}
}

export function writeWorkspaceDraft(draft: Omit<WorkspaceDraftPayload, 'savedAt'>) {
	try {
		localStorage.setItem(
			workspaceDraftKey(draft.courseId, draft.nodeType, draft.nodeId),
			JSON.stringify({ ...draft, savedAt: Date.now() }),
		);
	} catch {
		/* private mode */
	}
}

export function clearWorkspaceDraft(
	courseId: string,
	nodeType: WorkspaceDraftPayload['nodeType'],
	nodeId: string,
) {
	try {
		localStorage.removeItem(workspaceDraftKey(courseId, nodeType, nodeId));
	} catch {
		/* private mode */
	}
}

export type UnitDraftPayload = {
	title: string;
	slug: string;
	summary: string;
	foundationHtml: string;
	academicHtml: string;
	expertHtml: string;
	savedAt: number;
};

export function readUnitDraft(unitId: string): UnitDraftPayload | null {
	try {
		const raw = localStorage.getItem(`${PREFIX}${unitId}`);
		if (!raw) return null;
		return JSON.parse(raw) as UnitDraftPayload;
	} catch {
		return null;
	}
}

export function writeUnitDraft(unitId: string, payload: Omit<UnitDraftPayload, 'savedAt'>) {
	try {
		localStorage.setItem(`${PREFIX}${unitId}`, JSON.stringify({ ...payload, savedAt: Date.now() }));
	} catch {
		/* private mode */
	}
}

export function clearUnitDraft(unitId: string) {
	try {
		localStorage.removeItem(`${PREFIX}${unitId}`);
	} catch {
		/* private mode */
	}
}

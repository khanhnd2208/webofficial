import type { ReadingLevel } from './readingLevel';

/** Reserved path segments under /my-space/my-class/[courseSlug]/ — cannot be lesson slugs. */
export const RESERVED_LESSON_SLUGS = new Set([
	'tests',
	'vocab',
	'progress',
	'lessons',
	'knowledge',
	'content',
	'overview',
]);

export type WorkspaceQuery = {
	lesson?: string | null;
	section?: string | null;
	/** Section slug (preferred over cuid). */
	s?: string | null;
	unit?: string | null;
	level?: ReadingLevel | null;
	view?: 'content' | 'vocab' | null;
	edit?: boolean | null;
};

function applyWorkspaceParams(
	params: URLSearchParams,
	opts: { sectionSlug?: string | null; level?: ReadingLevel | null; edit?: boolean | null },
) {
	if (opts.sectionSlug) params.set('s', opts.sectionSlug);
	if (opts.level) params.set('level', opts.level);
	if (opts.edit) params.set('edit', '1');
}

/** Clean path-based reader URL. Section only as ?s= when ambiguous. */
export function courseUnitPath(
	courseSlug: string,
	lessonSlug: string,
	unitSlug: string,
	opts: { sectionSlug?: string | null; level?: ReadingLevel | null; edit?: boolean | null } = {},
): string {
	const base = `/my-space/my-class/${courseSlug}/${lessonSlug}/${unitSlug}`;
	const params = new URLSearchParams();
	applyWorkspaceParams(params, opts);
	const qs = params.toString();
	return qs ? `${base}?${qs}` : base;
}

export function courseWorkspacePath(courseSlug: string, query: WorkspaceQuery = {}): string {
	if (query.lesson && query.unit) {
		return courseUnitPath(courseSlug, query.lesson, query.unit, {
			sectionSlug: query.s ?? null,
			level: query.level,
			edit: query.edit,
		});
	}
	const params = new URLSearchParams();
	if (query.lesson) params.set('lesson', query.lesson);
	if (query.s) params.set('s', query.s);
	else if (query.section) params.set('section', query.section);
	if (query.unit) params.set('unit', query.unit);
	if (query.level) params.set('level', query.level);
	if (query.view && query.view !== 'content') params.set('view', query.view);
	if (query.edit) params.set('edit', '1');
	const qs = params.toString();
	return qs ? `/my-space/my-class/${courseSlug}?${qs}` : `/my-space/my-class/${courseSlug}`;
}

export function withEditFlag(href: string, edit: boolean): string {
	if (!edit) return href;
	const [path, search = ''] = href.split('?');
	const params = new URLSearchParams(search);
	params.set('edit', '1');
	const qs = params.toString();
	return qs ? `${path}?${qs}` : (path ?? href);
}

export function courseHomePath(courseSlug: string): string {
	return `/my-space/my-class/${courseSlug}`;
}

export function courseLessonPath(courseSlug: string, lessonSlug: string): string {
	return `/my-space/my-class/${courseSlug}?lesson=${encodeURIComponent(lessonSlug)}`;
}

export function myClassHomePath(): string {
	return '/my-space/my-class';
}

export function isReservedLessonSlug(slug: string): boolean {
	return RESERVED_LESSON_SLUGS.has(slug.toLowerCase());
}

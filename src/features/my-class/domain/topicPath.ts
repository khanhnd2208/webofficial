import { slugify } from '@/utils/slugify';

export function topicSlugFromName(name: string): string {
	return slugify(name) || 'topic';
}

export function joinTopicPath(parentPath: string | null | undefined, slug: string): string {
	const clean = slug.replace(/^\/+|\/+$/g, '');
	if (!parentPath) return clean;
	return `${parentPath.replace(/^\/+|\/+$/g, '')}/${clean}`;
}

export function topicDepthFromPath(path: string): number {
	if (!path) return 0;
	return path.split('/').filter(Boolean).length - 1;
}

export function descendantPathPrefix(path: string): string {
	return `${path.replace(/\/+$/g, '')}/`;
}

export function isTopicPathMatch(
	candidate: string,
	ancestorPath: string,
	includeDescendants: boolean,
): boolean {
	if (candidate === ancestorPath) return true;
	if (!includeDescendants) return false;
	return candidate.startsWith(descendantPathPrefix(ancestorPath));
}

export function rewriteDescendantPaths(
	oldPath: string,
	newPath: string,
	rows: Array<{ id: string; path: string }>,
): Array<{ id: string; path: string; depth: number }> {
	const prefix = descendantPathPrefix(oldPath);
	return rows
		.filter((row) => row.path === oldPath || row.path.startsWith(prefix))
		.map((row) => {
			const nextPath =
				row.path === oldPath ? newPath : `${newPath}${row.path.slice(oldPath.length)}`;
			return { id: row.id, path: nextPath, depth: topicDepthFromPath(nextPath) };
		});
}

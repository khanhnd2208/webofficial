/** Single local-queue identity. Never concatenate course/unit slugs by hand. */
export function progressQueueKey(courseId: string, knowledgeUnitId: string): string {
	return `${courseId}:${knowledgeUnitId}`;
}

/** @deprecated Old UI key — kept only so tests can reproduce the v1 mismatch. */
export function legacyUiDoneKey(courseSlug: string, unitSlug: string): string {
	return `my-class:done:${courseSlug}:${unitSlug}`;
}

/** @deprecated Old resolver key — kept only so tests can reproduce the v1 mismatch. */
export function legacyResolverKey(courseSlug: string, unitSlug: string): string {
	return `${courseSlug}:${unitSlug}`;
}

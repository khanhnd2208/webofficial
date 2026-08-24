import type { MyClassPublishStatus, MyClassTestListItem, MyClassTestScope } from '../types';

export function combinedPublishStatus(
	testStatus?: string | null,
	placementStatus?: string | null,
): MyClassPublishStatus {
	if (testStatus === 'ARCHIVED' || placementStatus === 'ARCHIVED') return 'ARCHIVED';
	if (testStatus === 'PUBLISHED' && (placementStatus ?? 'PUBLISHED') === 'PUBLISHED') {
		return 'PUBLISHED';
	}
	return 'DRAFT';
}

export function isLearnerVisibleTest(test: MyClassTestListItem): boolean {
	return !test.authoring || test.authoring.status === 'PUBLISHED';
}

export function testsForOutline(
	tests: MyClassTestListItem[],
	scope: MyClassTestScope,
	options: { includeUnpublished?: boolean } = {},
): MyClassTestListItem[] {
	return tests
		.filter((test) => test.scope === scope)
		.filter((test) => options.includeUnpublished || isLearnerVisibleTest(test))
		.slice()
		.sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
}

export function unpublishedOutlineTests(
	tests: MyClassTestListItem[],
	scope: MyClassTestScope,
): MyClassTestListItem[] {
	return testsForOutline(tests, scope, { includeUnpublished: true }).filter(
		(test) => !isLearnerVisibleTest(test),
	);
}

export function outlineTestKey(test: MyClassTestListItem): string {
	return test.placementId ?? `${test.scope}:${test.id ?? test.slug}`;
}

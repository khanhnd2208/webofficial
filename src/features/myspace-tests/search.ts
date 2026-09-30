/** Accent-insensitive, case-insensitive fold for catalogue search. */
export function foldSearchText(value: string): string {
	return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi');
}

export function matchesSearchQuery(
	query: string,
	...fields: Array<string | null | undefined>
): boolean {
	const needle = foldSearchText(query.trim());
	if (!needle) return true;
	return fields.some((field) => field != null && foldSearchText(field).includes(needle));
}

export function testMatchesSearch(
	query: string,
	test: {
		title: string;
		subject: string;
		topics: string[];
		description?: string;
	},
): boolean {
	const needle = foldSearchText(query.trim());
	if (!needle) return true;
	if (matchesSearchQuery(needle, test.title, test.subject, test.description)) return true;
	return test.topics.some((topic) => matchesSearchQuery(needle, topic));
}

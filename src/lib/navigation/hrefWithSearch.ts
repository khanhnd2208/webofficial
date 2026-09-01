export function hrefWithSearch(
	pathname: string,
	searchParams?: Record<string, string | string[] | undefined>,
): string {
	if (!searchParams) return pathname;
	const sp = new URLSearchParams();
	for (const [key, value] of Object.entries(searchParams)) {
		if (typeof value === 'string' && value) sp.set(key, value);
		else if (Array.isArray(value)) {
			for (const item of value) {
				if (item) sp.append(key, item);
			}
		}
	}
	const query = sp.toString();
	return query ? `${pathname}?${query}` : pathname;
}

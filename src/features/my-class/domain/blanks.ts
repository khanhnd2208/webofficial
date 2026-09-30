const TOKEN = /\[\[([^\]]+)\]\]/g;

export function extractBlankIds(stem: string): string[] {
	const ids: string[] = [];
	const seen = new Set<string>();
	for (const match of stem.matchAll(TOKEN)) {
		const id = (match[1] ?? '').trim();
		if (!id || seen.has(id)) continue;
		seen.add(id);
		ids.push(id);
	}
	return ids;
}

export function nextBlankId(existing: string[]): string {
	const used = new Set(existing);
	let n = 1;
	while (used.has(String(n))) n += 1;
	return String(n);
}

export function insertBlankToken(stem: string, id: string, at?: number): string {
	const token = `[[${id}]]`;
	if (at == null || at < 0 || at > stem.length)
		return `${stem}${stem && !stem.endsWith(' ') ? ' ' : ''}${token}`;
	return `${stem.slice(0, at)}${token}${stem.slice(at)}`;
}

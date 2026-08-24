function foldHeader(value: string): string {
	return value
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'd')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function canonicalVocabHeader(raw: string): string {
	const folded = foldHeader(raw);
	const compact = folded.replace(/\s+/g, '');
	if (['term', 'word', 'tu'].includes(folded) || compact === 'tu') return 'term';
	if (
		['pronunciation', 'phonetic', 'ipa', 'phien am', 'phienam'].includes(folded) ||
		compact === 'phienam'
	) {
		return 'pronunciation';
	}
	if (
		['part of speech', 'partofspeech', 'pos', 'loai tu', 'loaitu', 'tu loai', 'tuloai'].includes(
			folded,
		) ||
		compact === 'loaitu' ||
		compact === 'tuloai'
	) {
		return 'part_of_speech';
	}
	if (
		['meaning en', 'meaningen', 'english meaning', 'nghia tieng anh', 'nghiatienganh'].includes(
			folded,
		) ||
		compact === 'nghiatienganh'
	) {
		return 'meaning_en';
	}
	if (
		[
			'meaning vi',
			'meaningvi',
			'definition',
			'nghia tieng viet',
			'nghiatiengviet',
			'nghia',
			'nghia tv',
		].includes(folded) ||
		compact === 'nghiatiengviet'
	) {
		return 'meaning_vi';
	}
	if (
		['explanation', 'ndk explanation', 'ndkexplanation', 'giai thich', 'giaithich'].includes(
			folded,
		) ||
		compact === 'giaithich'
	) {
		return 'explanation';
	}
	if (['example', 'vi du', 'vidu'].includes(folded) || compact === 'vidu') return 'example';
	if (['hints hard', 'hintshard', 'goi y kho', 'goiykho'].includes(folded) || compact === 'goiykho') {
		return 'hints_hard';
	}
	if (
		['hints medium', 'hintsmedium', 'goi y trung binh', 'goiytrungbinh'].includes(folded) ||
		compact === 'goiytrungbinh'
	) {
		return 'hints_medium';
	}
	if (['hints easy', 'hintseasy', 'goi y de', 'goiyde'].includes(folded) || compact === 'goiyde') {
		return 'hints_easy';
	}
	return folded.replace(/\s+/g, '_');
}

export function detectDelimiter(csv: string): ',' | ';' | '\t' {
	const firstLine = csv.split(/\r?\n/).find((line) => line.trim()) ?? '';
	let inQuotes = false;
	const counts = { ',': 0, ';': 0, '\t': 0 };
	for (const char of firstLine) {
		if (char === '"') {
			inQuotes = !inQuotes;
			continue;
		}
		if (!inQuotes && (char === ',' || char === ';' || char === '\t')) counts[char] += 1;
	}
	if (counts['\t'] === 0 && counts[';'] === 0 && counts[','] === 0) return ',';
	if (counts['\t'] >= counts[';'] && counts['\t'] >= counts[',']) return '\t';
	if (counts[';'] > counts[',']) return ';';
	return ',';
}

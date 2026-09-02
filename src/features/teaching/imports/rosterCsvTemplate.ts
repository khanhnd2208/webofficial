export const ROSTER_CSV_HEADERS = [
	'STT',
	'Mã SV',
	'Họ lót',
	'Tên',
	'Mã lớp',
	'Tên ngành',
	'Ngày sinh',
	'Điện thoại',
	'Email',
	'Mã tutorial',
	'Học từ tuần',
] as const;

export const ROSTER_CSV_SAMPLE_ROWS = [
	[
		'1',
		'2406090045',
		'Chu Khải Linh',
		'Anh',
		'2D-24',
		'Quản trị Dịch vụ Du lịch và lữ hành',
		'29/05/2006',
		'0901234567',
		'anh@example.com',
		'T01',
		'1',
	],
	[
		'2',
		'2306090003',
		'Đàm Lê',
		'Anh',
		'3D-23',
		'Quản trị Dịch vụ Du lịch và lữ hành',
		'',
		'0987654321',
		'anh2@example.com',
		'',
		'1',
	],
] as const;

function csvEscape(value: string): string {
	if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
	return value;
}

export function rosterCsvTemplateBody(): string {
	const lines = [
		ROSTER_CSV_HEADERS.join(','),
		...ROSTER_CSV_SAMPLE_ROWS.map((row) => row.map((cell) => csvEscape(cell)).join(',')),
	];
	return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function rosterPasteSample(): string {
	return [ROSTER_CSV_HEADERS.join('\t'), ...ROSTER_CSV_SAMPLE_ROWS.map((row) => row.join('\t'))].join(
		'\n',
	);
}

export const ROSTER_CSV_FILENAME = 'mau-danh-sach-sinh-vien.csv';

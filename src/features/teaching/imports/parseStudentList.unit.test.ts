import { describe, expect, it } from 'vitest';

import { parseStudentListFromRows } from './parseStudentList';

function sampleRows(): unknown[][] {
	return [
		['Trường Đại học Hà Nội', '', '', '', '', '', 'Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam'],
		['Quản lý kế hoạch giảng dạy', '', '', '', '', '', 'Độc lập - Tự do - Hạnh phúc'],
		['', '', '', '', '', '', ''],
		['', '', '', 'BẢNG KẾT QUẢ ĐIỂM DANH HỌC PHẦN', '', '', ''],
		['', '', '', 'HỌC KỲ 1 - NĂM HỌC 2026 - 2027', '', '', ''],
		['', '', '', '', '', '', ''],
		['', 'Học phần', 'Quản trị nhân sự', '', 'Mã học phần', '61MGT3HRM', ''],
		['', 'Tên giảng viên', 'Nguyễn Duy Khánh', '', 'Mã giảng viên', 'GVQTKD23090', ''],
		['', 'Số tín chỉ', '3', '', 'Nhóm tổ', '39', ''],
		['', '', '', '', '', '', ''],
		['STT', 'Mã SV', 'Họ lót', 'Tên', 'Mã lớp', 'Tên lớp', 'Ngày sinh', 'Điện thoại', 'Email'],
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
		],
		[
			'2',
			'2306090003',
			'Đàm Lê',
			'Anh',
			'3D-23',
			'Quản trị Dịch vụ Du lịch và lữ hành',
			'23/08/2005',
			'0987654321',
			'anh2@example.com',
		],
	];
}

describe('parseStudentList', () => {
	it('extracts class metadata and locates the STT header without a hardcoded row index', () => {
		const parsed = parseStudentListFromRows(sampleRows());
		expect(parsed.headerRowIndex).toBe(10);
		expect(parsed.metadata).toMatchObject({
			courseName: 'Quản trị nhân sự',
			courseCode: '61MGT3HRM',
			lecturerName: 'Nguyễn Duy Khánh',
			lecturerCode: 'GVQTKD23090',
			credits: 3,
			groupNo: '39',
			term: 'HỌC KỲ 1 - NĂM HỌC 2026 - 2027',
		});
		expect(parsed.students).toHaveLength(2);
		expect(parsed.students[0]).toMatchObject({
			orderNo: 1,
			studentCode: '2406090045',
			familyName: 'Chu Khải Linh',
			givenName: 'Anh',
			homeClassCode: '2D-24',
			majorName: 'Quản trị Dịch vụ Du lịch và lữ hành',
			dateOfBirth: '2006-05-29',
			phone: '0901234567',
			email: 'anh@example.com',
			ok: true,
		});
	});

	it('parses an in-memory 137-row worksheet matching the HANU export layout', () => {
		const rows = sampleRows();
		const majors = ['Quản trị Kinh doanh', 'Kế toán', 'Marketing - tiếng Anh'];
		for (let i = 3; i <= 137; i += 1) {
			rows.push([
				String(i),
				`240400${String(i).padStart(4, '0')}`,
				`Họ ${i}`,
				`Tên ${i}`,
				`${(i % 3) + 1}K-24`,
				majors[i % majors.length],
				`${String((i % 27) + 1).padStart(2, '0')}/0${(i % 9) + 1}/2006`,
			]);
		}
		const parsed = parseStudentListFromRows(rows);
		expect(parsed.students).toHaveLength(137);
		expect(parsed.students.every((row) => row.ok)).toBe(true);
		expect(parsed.students.at(-1)?.studentCode).toBe('2404000137');
	});

	it('flags duplicate student codes and invalid dates', () => {
		const rows = sampleRows();
		rows.push(['3', '2406090045', 'Trùng', 'Mã', '1K-24', 'Quản trị Kinh doanh', '31/02/2006']);
		const parsed = parseStudentListFromRows(rows);
		expect(parsed.students[2]?.ok).toBe(false);
		expect(parsed.students[2]?.errors.join(' ')).toMatch(/Duplicate student code/);
		expect(parsed.students[2]?.errors.join(' ')).toMatch(/tồn tại|calendar date/i);
	});

	it('treats student codes that differ only by case or spaces as duplicates', () => {
		const rows = sampleRows();
		rows.push(['3', ' 2406090045 ', 'Trùng', 'Mã', '1K-24', 'Quản trị Kinh doanh', '01/01/2006']);
		const parsed = parseStudentListFromRows(rows);
		expect(parsed.students[2]?.ok).toBe(false);
		expect(parsed.students[2]?.studentCode).toBe('2406090045');
	});
});

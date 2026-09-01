'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StudioButton, StudioField, StudioInput } from '@/components/myclass/admin/studio';
import { teachingApi } from '@/components/teaching/admin/api';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { routes } from '@/config/routes';
import type { StudentListPreview } from '@/features/teaching/services/importService';
import type { TeachingClassSetupResult } from '@/features/teaching/types';

type StudentDraft = Omit<StudentListPreview['students'][number], 'ok' | 'errors'>;

function emptyStudentDraft(): StudentDraft {
	return {
		orderNo: 0,
		studentCode: '',
		familyName: '',
		givenName: '',
		homeClassCode: '',
		majorName: '',
		dateOfBirth: null,
		phone: null,
		email: null,
	};
}

export function NewTeachingClassWorkspace() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [step, setStep] = useState(1);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [fileName, setFileName] = useState('');
	const [preview, setPreview] = useState<StudentListPreview | null>(null);
	const [form, setForm] = useState({
		courseCode: '',
		courseName: '',
		groupNo: '',
		term: '',
		credits: '',
		lecturerName: '',
		lecturerCode: '',
		totalWeeks: '10',
	});
	const [students, setStudents] = useState<StudentDraft[]>([]);
	const [student, setStudent] = useState<StudentDraft>(emptyStudentDraft);

	function patchForm(key: keyof typeof form, value: string) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	async function previewFile(file: File | null) {
		if (!file) return;
		setBusy(true);
		setError('');
		setFileName(file.name);
		try {
			const body = new FormData();
			body.append('file', file);
			const next = await teachingApi<StudentListPreview>('/api/admin/teaching/import?mode=preview', {
				method: 'POST',
				body,
			});
			setPreview(next);
			setStudents(
				next.students
					.filter((row) => row.ok)
					.map(({ ok: _ok, errors: _errors, ...row }) => row),
			);
			setForm((current) => ({
				...current,
				courseCode: current.courseCode || next.metadata.courseCode,
				courseName: current.courseName || next.metadata.courseName,
				groupNo: current.groupNo || next.metadata.groupNo,
				term: current.term || next.metadata.term,
				credits: current.credits || (next.metadata.credits == null ? '' : String(next.metadata.credits)),
				lecturerName: current.lecturerName || next.metadata.lecturerName,
				lecturerCode: current.lecturerCode || next.metadata.lecturerCode,
			}));
			setStep(2);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không đọc được file Excel');
		} finally {
			setBusy(false);
		}
	}

	function addStudent(event: React.FormEvent) {
		event.preventDefault();
		if (!student.studentCode.trim() || !student.familyName.trim() || !student.givenName.trim()) {
			setError('Mã sinh viên, họ và tên là bắt buộc.');
			return;
		}
		if (students.some((row) => row.studentCode.trim() === student.studentCode.trim())) {
			setError('Mã sinh viên này đã có trong danh sách.');
			return;
		}
		setStudents((current) => [
			...current,
			{
				...student,
				orderNo: current.reduce((highest, row) => Math.max(highest, row.orderNo), 0) + 1,
				studentCode: student.studentCode.trim(),
				familyName: student.familyName.trim(),
				givenName: student.givenName.trim(),
			},
		]);
		setStudent(emptyStudentDraft());
		setError('');
	}

	async function createClass() {
		setError('');
		if (!form.courseCode || !form.courseName || !form.groupNo || !form.term) {
			setError('Hãy điền đủ mã học phần, tên học phần, nhóm và học kỳ.');
			setStep(1);
			return;
		}
		if (!students.length) {
			setError('Hãy import hoặc thêm ít nhất một học viên.');
			setStep(2);
			return;
		}
		if (preview?.students.some((row) => !row.ok)) {
			setError('Hãy sửa các dòng lỗi trong file Excel trước khi tạo lớp.');
			setStep(2);
			return;
		}
		if (preview?.existingClassId) {
			setError('Lớp này đã tồn tại. Hãy mở lớp hiện có để thêm danh sách.');
			return;
		}
		setBusy(true);
		try {
			const result = await teachingApi<TeachingClassSetupResult>('/api/admin/teaching/classes/setup', {
				method: 'POST',
				body: JSON.stringify({
					class: {
						...form,
						credits: form.credits ? Number(form.credits) : null,
						totalWeeks: Number(form.totalWeeks),
					},
					students,
				}),
			});
			router.push(routes.admin.teachingClassTab(result.gradebook.class.id, 'attendance'));
		} catch (reason) {
			const typed = reason as Error & { fields?: Record<string, string> };
			setError(typed.fields?.existingClassId ? 'Lớp đã tồn tại. Hãy mở lớp hiện có từ bước xem lại.' : typed.message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mc-studio-container max-w-5xl px-0 py-8">
			<TeachingAppHeader
				backHref={routes.admin.teaching}
				backLabel="Các lớp"
				eyebrow="Teaching"
				title="Tạo lớp mới"
				description="Tạo thông tin lớp và danh sách học viên trong một luồng."
				actions={<StudioButton variant="quiet" onClick={() => router.push(routes.admin.teaching)}>Huỷ</StudioButton>}
			/>

			<ol className="mc-stepper mt-6">
				{['Thông tin lớp', 'Danh sách học viên', 'Xem lại & tạo'].map((label, index) => (
					<li key={label} data-state={step === index + 1 ? 'current' : step > index + 1 ? 'done' : undefined}>
						{index + 1}. {label}
					</li>
				))}
			</ol>

			{step === 1 ? (
				<section className="mc-surface mt-5 grid gap-4 p-5 md:grid-cols-2">
					<StudioField label="Mã học phần"><StudioInput required value={form.courseCode} onChange={(event) => patchForm('courseCode', event.target.value)} /></StudioField>
					<StudioField label="Tên học phần"><StudioInput required value={form.courseName} onChange={(event) => patchForm('courseName', event.target.value)} /></StudioField>
					<StudioField label="Mã lớp"><StudioInput required value={form.groupNo} onChange={(event) => patchForm('groupNo', event.target.value)} /></StudioField>
					<StudioField label="Học kỳ"><StudioInput required value={form.term} onChange={(event) => patchForm('term', event.target.value)} /></StudioField>
					<StudioField label="Số tuần"><StudioInput type="number" min={1} max={20} value={form.totalWeeks} onChange={(event) => patchForm('totalWeeks', event.target.value)} /></StudioField>
					<StudioField label="Số tín chỉ"><StudioInput type="number" min={1} max={20} value={form.credits} onChange={(event) => patchForm('credits', event.target.value)} /></StudioField>
					<StudioField label="Giảng viên"><StudioInput value={form.lecturerName} onChange={(event) => patchForm('lecturerName', event.target.value)} /></StudioField>
					<StudioField label="Mã giảng viên"><StudioInput value={form.lecturerCode} onChange={(event) => patchForm('lecturerCode', event.target.value)} /></StudioField>
					<div className="md:col-span-2 flex justify-end"><StudioButton onClick={() => { setError(''); setStep(2); }}>Tiếp tục</StudioButton></div>
				</section>
			) : null}

			{step === 2 ? (
				<div className="mt-5 space-y-5">
					<section className="mc-surface p-5">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div><h2 className="font-semibold text-ink">Import danh sách Excel</h2><p className="mc-meta mt-1">Có thể dùng file DanhSachSinhVien hoặc thêm thủ công bên dưới.</p></div>
							<div className="flex gap-2"><input ref={inputRef} type="file" accept=".xlsx" className="sr-only" onChange={(event) => void previewFile(event.target.files?.[0] ?? null)} /><StudioButton variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>Chọn file</StudioButton></div>
						</div>
						{fileName ? <p className="mt-3 text-sm text-ink-secondary">{fileName} · {students.length} dòng hợp lệ</p> : null}
						{preview?.existingClassId ? <div className="mc-banner mt-3" data-tone="error"><p>Lớp này đã tồn tại. Không ghi đè dữ liệu.</p><Link className="mt-2 inline-flex font-semibold underline" href={routes.admin.teachingClassTab(preview.existingClassId, 'students')}>Mở lớp hiện có</Link></div> : null}
						{preview && preview.students.some((row) => !row.ok) ? <p className="mc-banner mt-3" data-tone="error">Có dòng lỗi trong file; chỉ các dòng hợp lệ mới được đưa vào bản xem trước.</p> : null}
					</section>
					<form className="mc-surface grid gap-3 p-5 md:grid-cols-4" onSubmit={addStudent}>
						<StudioField label="Mã SV"><StudioInput value={student.studentCode} onChange={(event) => setStudent({ ...student, studentCode: event.target.value })} /></StudioField>
						<StudioField label="Họ lót"><StudioInput value={student.familyName} onChange={(event) => setStudent({ ...student, familyName: event.target.value })} /></StudioField>
						<StudioField label="Tên"><StudioInput value={student.givenName} onChange={(event) => setStudent({ ...student, givenName: event.target.value })} /></StudioField>
						<div className="flex items-end"><StudioButton type="submit" variant="secondary">Thêm học viên</StudioButton></div>
					</form>
					<div className="mc-surface overflow-auto">
						<table className="mc-data-table w-full text-sm"><thead><tr><th>STT</th><th>Mã SV</th><th>Họ lót</th><th>Tên</th><th /></tr></thead><tbody>
							{students.map((row, index) => <tr key={row.studentCode}><td>{index + 1}</td><td className="mc-num">{row.studentCode}</td><td>{row.familyName}</td><td className="font-semibold">{row.givenName}</td><td><button type="button" className="text-xs font-semibold text-error" onClick={() => setStudents((current) => current.filter((item) => item.studentCode !== row.studentCode))}>Xoá</button></td></tr>)}
						</tbody></table>
						<div className="mc-card-foot flex justify-between"><StudioButton variant="quiet" onClick={() => setStep(1)}>Quay lại</StudioButton><StudioButton onClick={() => { setError(''); setStep(3); }}>Xem lại</StudioButton></div>
					</div>
				</div>
			) : null}

			{step === 3 ? (
				<section className="mc-surface mt-5 space-y-5 p-5">
					<div><p className="mc-eyebrow">Xác nhận</p><h2 className="mt-1 text-lg font-semibold text-ink">Sẵn sàng tạo lớp</h2><p className="mt-1 text-sm text-ink-secondary">{form.courseCode} · {form.courseName} · Lớp {form.groupNo} · {students.length} học viên</p></div>
					<div className="flex flex-wrap justify-between gap-2"><StudioButton variant="quiet" onClick={() => setStep(2)}>Quay lại</StudioButton><StudioButton disabled={busy} onClick={() => void createClass()}>{busy ? 'Đang tạo…' : 'Tạo lớp và mở workspace'}</StudioButton></div>
				</section>
			) : null}
			{error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
		</div>
	);
}

'use client';

import { useState } from 'react';
import { TeachingSectionHeading, TeachingEmpty } from '../ui/TeachingElements';
import { useRouter } from 'next/navigation';

import {
	StudioButton,
	StudioField,
	StudioInput,
	StudioSelect,
} from '@/components/myclass/admin/studio';
import { teachingApi, AdminApiError } from '@/components/teaching/admin/api';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { routes } from '@/config/routes';
import type { TeachingClassRecord, TeachingCourseListItem } from '@/features/teaching/types';

export function NewTeachingClassWorkspace({
	courses = [],
	initialCourseId = '',
	termSuggestions = [],
}: {
	courses?: TeachingCourseListItem[];
	initialCourseId?: string;
	termSuggestions?: string[];
}) {
	const router = useRouter();
	const activeCourses = courses.filter((course) => course.status === 'ACTIVE');
	const lockedCourse =
		activeCourses.find((course) => course.id === initialCourseId) ??
		courses.find((course) => course.id === initialCourseId && course.status === 'ACTIVE');
	const courseLocked = Boolean(lockedCourse);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [form, setForm] = useState({
		courseId: lockedCourse?.id ?? '',
		groupNo: '',
		term: '',
	});

	async function createClass() {
		setError('');
		setFieldErrors({});
		if (!form.courseId || !form.groupNo.trim() || !form.term.trim()) {
			setError('Hãy chọn môn, nhập mã lớp và học kỳ.');
			return;
		}
		setBusy(true);
		try {
			const created = await teachingApi<TeachingClassRecord>('/api/admin/teaching/classes', {
				method: 'POST',
				body: JSON.stringify({
					courseId: form.courseId,
					groupNo: form.groupNo,
					term: form.term,
				}),
			});
			router.push(routes.mySpaceTeachingClassTab(created.id, 'students'));
		} catch (reason) {
			const typed = reason as AdminApiError;
			setFieldErrors(typed.fields ?? {});
			setError(typed.message || 'Không tạo được lớp');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mc-studio-container max-w-xl px-0 py-8">
			<TeachingAppHeader
				backHref={
					lockedCourse ? routes.mySpaceTeachingCourse(lockedCourse.id) : routes.mySpaceTeaching
				}
				backLabel={lockedCourse ? lockedCourse.courseCode : 'Các môn'}
				eyebrow="Teaching"
				title="Tạo lớp"
				description="Chỉ cần môn, mã lớp và học kỳ. Học viên thêm sau ở tab Học viên."
				actions={
					<StudioButton variant="quiet" onClick={() => router.back()}>
						Huỷ
					</StudioButton>
				}
			/>

			{activeCourses.length === 0 ? (
				<TeachingEmpty
					icon="course"
					title="Chưa có môn đang hoạt động"
					description="Hãy thêm môn trước khi tạo lớp."
					className="mt-6"
				/>
			) : (
				<section className="mc-surface mt-6 grid gap-4 p-5" aria-label="Thông tin lớp mới">
					<TeachingSectionHeading
						icon="class"
						title="Thông tin lớp"
						description="Chọn môn học, mã lớp và học kỳ để bắt đầu."
					/>
					<StudioField label="Môn học" error={fieldErrors.courseId}>
						<StudioSelect
							required
							disabled={courseLocked}
							value={form.courseId}
							onChange={(event) =>
								setForm((current) => ({ ...current, courseId: event.target.value }))
							}
						>
							<option value="">Chọn môn</option>
							{activeCourses.map((course) => (
								<option key={course.id} value={course.id}>
									{course.courseCode} · {course.courseName}
								</option>
							))}
						</StudioSelect>
					</StudioField>
					<StudioField
						label="Mã lớp"
						error={fieldErrors.groupNo}
						hint="Sẽ được viết hoa và bỏ khoảng trắng thừa."
					>
						<StudioInput
							required
							value={form.groupNo}
							onChange={(event) =>
								setForm((current) => ({ ...current, groupNo: event.target.value }))
							}
							placeholder="39-01"
						/>
					</StudioField>
					<StudioField
						label="Học kỳ"
						error={fieldErrors.term}
						hint="Gợi ý từ các kỳ đã có, vẫn nhập tự do được."
					>
						<StudioInput
							required
							list="new-class-term-suggestions"
							value={form.term}
							onChange={(event) => setForm((current) => ({ ...current, term: event.target.value }))}
							placeholder="HỌC KỲ 1 - NĂM HỌC 2026 - 2027"
						/>
					</StudioField>
					<datalist id="new-class-term-suggestions">
						{termSuggestions.map((term) => (
							<option key={term} value={term} />
						))}
					</datalist>
					<div className="flex justify-end">
						<StudioButton disabled={busy} onClick={() => void createClass()}>
							{busy ? 'Đang tạo…' : 'Tạo lớp trống'}
						</StudioButton>
					</div>
				</section>
			)}
			{error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
		</div>
	);
}

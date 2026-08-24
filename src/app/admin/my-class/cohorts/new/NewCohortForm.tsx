'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/config/routes';
import { myClassApi } from '@/components/myclass/admin/api';

export default function NewCohortForm({ courses }: { courses: Array<{ id: string; title: string }> }) {
	const router = useRouter();
	const [name, setName] = useState('');
	const [term, setTerm] = useState('');
	const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
	const [error, setError] = useState<string | null>(null);
	async function submit(event: React.FormEvent) {
		event.preventDefault();
		try {
			const created = await myClassApi<{ id: string }>('/api/admin/my-class/cohorts', {
				method: 'POST',
				body: JSON.stringify({ name, term, courseId }),
			});
			router.push(routes.admin.myClassCohortEdit(created.id));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được');
		}
	}
	return (
		<form onSubmit={submit} className="mt-8 space-y-4">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<label className="block text-sm">Tên lớp<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2" /></label>
			<label className="block text-sm">Term<input value={term} onChange={(e) => setTerm(e.target.value)} className="mt-1 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2" /></label>
			<label className="block text-sm">Course
				<select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3">
					{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
				</select>
			</label>
			<button className="rounded-[var(--mc-r-sm)] bg-ink px-5 py-2 text-xs font-bold uppercase text-paper">Tạo Cohort</button>
		</form>
	);
}

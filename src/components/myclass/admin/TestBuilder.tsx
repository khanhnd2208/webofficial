'use client';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/config/routes';
import TestRunner from '@/components/myclass/TestRunner';
import TestCsvImport from '@/components/myclass/workspace/edit/TestCsvImport';
import { myClassApi } from './api';
import type { MyClassTestForPlay, MyClassTestRevealPolicy } from '@/features/my-class';
import { StudioButton, StudioField, StudioInput, StudioSelect, StudioTextarea } from './studio';

type QuestionSummary = {
	id: string;
	stem: string;
	type?: string;
	status?: string;
	difficulty?: number;
	knowledgeUnits: Array<{
		knowledgeUnit: {
			id: string;
			slug: string;
			currentPublishedRevision: { title: string } | null;
		};
	}>;
};

type Placement = {
	id: string;
	scope: 'COURSE' | 'LESSON' | 'SECTION';
	course: { id: string; title: string };
	lesson?: { id: string; title: string } | null;
	section?: { id: string; title: string } | null;
};

type Test = {
	id: string;
	title: string;
	slug: string;
	description: string;
	status: string;
	passScore?: number | null;
	timeLimitMinutes?: number | null;
	maxAttempts?: number | null;
	shuffleQuestions?: boolean;
	shuffleOptions?: boolean;
	revealPolicy?: MyClassTestRevealPolicy;
	subjectId?: string | null;
	tags?: string[];
	questions: Array<{ position: number; points?: number; question: QuestionSummary }>;
	placements?: Placement[];
};

export default function TestBuilder({
	initial,
	bank,
	subjects = [],
}: {
	initial: Test;
	bank: QuestionSummary[];
	subjects?: Array<{ id: string; name: string }>;
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [tab, setTab] = useState<'questions' | 'placements' | 'settings'>('questions');
	const [title, setTitle] = useState(initial.title);
	const [slug, setSlug] = useState(initial.slug);
	const [description, setDescription] = useState(initial.description);
	const [passScore, setPassScore] = useState(initial.passScore == null ? '' : String(initial.passScore));
	const [timeLimit, setTimeLimit] = useState(initial.timeLimitMinutes == null ? '' : String(initial.timeLimitMinutes));
	const [maxAttempts, setMaxAttempts] = useState(initial.maxAttempts == null ? '' : String(initial.maxAttempts));
	const [shuffleQuestions, setShuffleQuestions] = useState(Boolean(initial.shuffleQuestions));
	const [shuffleOptions, setShuffleOptions] = useState(Boolean(initial.shuffleOptions));
	const [revealPolicy, setRevealPolicy] = useState<MyClassTestRevealPolicy>(initial.revealPolicy ?? 'AFTER_SUBMIT');
	const [subjectId, setSubjectId] = useState(initial.subjectId ?? '');
	const [tags, setTags] = useState((initial.tags ?? []).join(', '));
	const [items, setItems] = useState(initial.questions.map((row) => ({ questionId: row.question.id, points: row.points ?? 1 })));
	const [placements, setPlacements] = useState(initial.placements ?? []);
	const [issues, setIssues] = useState<Array<{ message: string; severity?: string }>>([]);
	const [preview, setPreview] = useState<MyClassTestForPlay | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [csvOpen, setCsvOpen] = useState(false);
	const [bankQuery, setBankQuery] = useState('');
	const [randomCount, setRandomCount] = useState('5');
	const [attachOpen, setAttachOpen] = useState(false);
	const [bankHits, setBankHits] = useState(bank);
	const [bankCache, setBankCache] = useState(bank);
	useEffect(() => {
		setBankHits(bank);
		setBankCache(bank);
	}, [bank]);

	useEffect(() => {
		const handle = window.setTimeout(() => {
			void myClassApi<QuestionSummary[]>(
				`/api/admin/my-class/questions?q=${encodeURIComponent(bankQuery)}&take=20&status=ACTIVE`,
			)
				.then((rows) => {
					if (!Array.isArray(rows)) return;
					setBankHits(rows);
					setBankCache((current) => {
						const byId = new Map(current.map((item) => [item.id, item] as const));
						for (const row of rows) byId.set(row.id, row);
						return [...byId.values()];
					});
				})
				.catch(() => {
					/* keep last hits */
				});
		}, 250);
		return () => window.clearTimeout(handle);
	}, [bankQuery]);

	const coverage = useMemo(() => {
		const counts = new Map<string, number>();
		const questionById = new Map([
			...initial.questions.map((row) => [row.question.id, row.question] as const),
			...bankCache.map((question) => [question.id, question] as const),
		]);
		for (const item of items) {
			const question = questionById.get(item.questionId);
			if (!question) continue;
			for (const link of question.knowledgeUnits) {
				const titleValue = link.knowledgeUnit.currentPublishedRevision?.title ?? link.knowledgeUnit.slug;
				counts.set(titleValue, (counts.get(titleValue) ?? 0) + 1);
			}
		}
		return [...counts.entries()];
	}, [bankCache, initial.questions, items]);
	const questionIds = items.map((item) => item.questionId);
	const filteredBank = bankHits.filter((item) => !questionIds.includes(item.id)).slice(0, 20);

	async function saveSettings() {
		await myClassApi(`/api/admin/my-class/tests/${initial.id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				title,
				slug,
				description,
				subjectId: subjectId || null,
				tags: tags.split(/[|,]/).map((item) => item.trim()).filter(Boolean),
				passScore: passScore.trim() === '' ? null : Number(passScore),
				timeLimitMinutes: timeLimit.trim() === '' ? null : Number(timeLimit),
				maxAttempts: maxAttempts.trim() === '' ? null : Number(maxAttempts),
				shuffleQuestions,
				shuffleOptions,
				revealPolicy,
			}),
		});
	}

	async function saveQuestions() {
		await myClassApi(`/api/admin/my-class/tests/${initial.id}/questions`, {
			method: 'PUT',
			body: JSON.stringify({ items }),
		});
	}

	async function save() {
		setError(null);
		try {
			await saveSettings();
			await saveQuestions();
			router.refresh();
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được');
			return false;
		}
	}

	async function publish() {
		setError(null);
		try {
			if (!(await save())) return;
			const found = await myClassApi<Array<{ message: string; severity?: string }>>(`/api/admin/my-class/tests/${initial.id}/publish`);
			setIssues(found);
			if (found.some((item) => item.severity !== 'warning')) return;
			await myClassApi(`/api/admin/my-class/tests/${initial.id}/publish`, { method: 'POST' });
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không xuất bản được');
		}
	}

	return (
		<>
		<div className="space-y-5">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<div className="flex gap-2">
				{(
					[
						['questions', 'Câu hỏi'],
						['placements', 'Đã gắn'],
						['settings', 'Cài đặt'],
					] as const
				).map(([id, label]) => (
					<button
						key={id}
						type="button"
						onClick={() => setTab(id)}
						className={`min-h-11 rounded-[var(--mc-r-sm)] px-4 text-sm font-semibold ${tab === id ? 'bg-ink text-paper' : 'border border-mc-rule'}`}
					>
						{label}
					</button>
				))}
			</div>
			{tab === 'settings' ? (
				<div className="space-y-4">
					<StudioField label="Tên bài kiểm tra">
						<StudioInput value={title} onChange={(event) => setTitle(event.target.value)} />
					</StudioField>
					<StudioField label="Slug">
						<StudioInput value={slug} onChange={(event) => setSlug(event.target.value)} />
					</StudioField>
					<StudioField label="Mô tả">
						<StudioTextarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
					</StudioField>
					<div className="grid gap-4 sm:grid-cols-2">
						<StudioField label="Điểm đạt (%)">
							<StudioInput value={passScore} onChange={(event) => setPassScore(event.target.value)} />
						</StudioField>
						<StudioField label="Thời gian (phút)">
							<StudioInput value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} />
						</StudioField>
						<StudioField label="Số lần làm tối đa">
							<StudioInput value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} />
						</StudioField>
						<StudioField label="Hiện đáp án">
							<StudioSelect value={revealPolicy} onChange={(event) => setRevealPolicy(event.target.value as MyClassTestRevealPolicy)}>
								<option value="AFTER_SUBMIT">Sau khi nộp</option>
								<option value="IMMEDIATE">Ngay khi chọn</option>
								<option value="NEVER">Không hiện</option>
							</StudioSelect>
						</StudioField>
						<StudioField label="Môn">
							<StudioSelect value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
								<option value="">Chưa gán</option>
								{subjects.map((subject) => (
									<option key={subject.id} value={subject.id}>
										{subject.name}
									</option>
								))}
							</StudioSelect>
						</StudioField>
						<StudioField label="Tags">
							<StudioInput value={tags} onChange={(event) => setTags(event.target.value)} />
						</StudioField>
					</div>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={shuffleQuestions} onChange={(event) => setShuffleQuestions(event.target.checked)} />
						Xáo câu hỏi
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={shuffleOptions} onChange={(event) => setShuffleOptions(event.target.checked)} />
						Xáo đáp án
					</label>
				</div>
			) : null}
			{tab === 'questions' ? (
				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
					<div>
						<ol className="space-y-2">
							{items.map((item, index) => {
								const question = bank.find((row) => row.id === item.questionId) ?? initial.questions.find((row) => row.question.id === item.questionId)?.question;
								return (
									<li key={item.questionId} className="flex items-start gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule p-3">
										<span className="mc-num text-xs">{index + 1}</span>
										<p className="min-w-0 flex-1 text-sm">{question?.stem ?? item.questionId}</p>
										<input
											type="number"
											min={1}
											value={item.points}
											onChange={(event) =>
												setItems((current) =>
													current.map((row) => (row.questionId === item.questionId ? { ...row, points: Number(event.target.value) } : row)),
												)
											}
											className="h-9 w-16 rounded border border-mc-rule px-2 text-sm"
											aria-label="Điểm"
										/>
										<button type="button" className="text-xs text-error" onClick={() => setItems((current) => current.filter((row) => row.questionId !== item.questionId))}>
											Gỡ
										</button>
									</li>
								);
							})}
						</ol>
						<div className="mt-4">
							<input
								value={bankQuery}
								onChange={(event) => setBankQuery(event.target.value)}
								placeholder="Tìm trong ngân hàng…"
								className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
							/>
							<div className="mt-2 flex gap-2">
								<input
									value={randomCount}
									onChange={(event) => setRandomCount(event.target.value)}
									className="h-9 w-16 rounded border border-mc-rule px-2 text-sm"
									aria-label="Số câu ngẫu nhiên"
								/>
								<StudioButton
									variant="secondary"
									size="sm"
									onClick={async () => {
										setError(null);
										try {
											const updated = await myClassApi<{
												questions: Array<{ question: { id: string }; points: number }>;
											}>(`/api/admin/my-class/tests/${initial.id}/random?q=${encodeURIComponent(bankQuery)}`, {
												method: 'POST',
												body: JSON.stringify({ count: Number(randomCount) || 5 }),
											});
											setItems(
												updated.questions.map((row) => ({
													questionId: row.question.id,
													points: row.points,
												})),
											);
										} catch (err) {
											setError(err instanceof Error ? err.message : 'Không lấy được câu ngẫu nhiên');
										}
									}}
								>
									Thêm ngẫu nhiên
								</StudioButton>
							</div>
							<ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm">
								{filteredBank.map((item) => (
									<li key={item.id}>
										<button
											type="button"
											className="w-full rounded px-2 py-2 text-left hover:bg-surface-sunken"
											onClick={() => setItems((current) => [...current, { questionId: item.id, points: 1 }])}
										>
											{item.stem}
										</button>
									</li>
								))}
							</ul>
						</div>
					</div>
					<aside className="mc-surface p-3 text-sm" data-testid="coverage">
						<section>
							<h2 className="font-semibold">Độ phủ nội dung</h2>
						<ul className="mt-2 space-y-1">
							{coverage.map(([label, count]) => (
								<li key={label} className="flex justify-between gap-2">
									<span>{label}</span>
									<span className="mc-num">{count}</span>
								</li>
							))}
							{!coverage.length ? <li className="mc-meta">Chưa có dữ liệu độ phủ.</li> : null}
						</ul>
						</section>
					</aside>
				</div>
			) : null}
			{tab === 'placements' ? (
				<div className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="mc-meta">Gắn bài vào khóa học, bài hoặc phần. Học viên sẽ thấy bài ở đúng chỗ đó.</p>
						<StudioButton variant="secondary" size="sm" onClick={() => setAttachOpen((open) => !open)}>
							{attachOpen ? 'Đóng form gắn' : 'Gắn vào khóa học'}
						</StudioButton>
					</div>
					{attachOpen ? (
						<TestPlacementForm
							testId={initial.id}
							onAttached={(placement) => {
								setPlacements((current) => [...current, placement]);
								setAttachOpen(false);
							}}
							onError={setError}
						/>
					) : null}
					<ul className="divide-y divide-mc-rule rounded-[var(--mc-r-sm)] border border-mc-rule">
						{placements.map((item) => (
							<li key={item.id} className="flex items-center justify-between gap-3 p-3 text-sm">
								<span>
									{item.course.title}
									{item.lesson ? ` · ${item.lesson.title}` : ''}
									{item.section ? ` · ${item.section.title}` : ''}
									<span className="mc-meta"> · {item.scope}</span>
								</span>
								<button
									type="button"
									className="text-error"
									onClick={async () => {
										await myClassApi(`/api/admin/my-class/tests/${initial.id}/placements/${item.id}`, { method: 'DELETE' });
										setPlacements((current) => current.filter((row) => row.id !== item.id));
									}}
								>
									Gỡ
								</button>
							</li>
						))}
						{!placements.length ? <li className="p-4 mc-meta">Chưa gắn vào khóa nào.</li> : null}
					</ul>
				</div>
			) : null}
			{issues.length ? (
				<ul className="text-sm text-warning" data-testid="publish-validation">
					{issues.map((item) => (
						<li key={item.message}>{item.message}</li>
					))}
				</ul>
			) : null}
			{preview ? <TestRunner test={preview} submitUrl={`/api/admin/my-class/tests/${initial.id}/preview/submit`} embedded /> : null}
			<div className="flex flex-wrap gap-2">
				<StudioButton variant="secondary" onClick={() => setCsvOpen(true)}>
					Nhập CSV
				</StudioButton>
				<StudioButton
					variant="secondary"
					onClick={async () => {
						const play = await myClassApi<MyClassTestForPlay>(`/api/admin/my-class/tests/${initial.id}/preview`);
						setPreview(play);
					}}
				>
					Xem trước
				</StudioButton>
				<StudioButton variant="secondary" onClick={() => void save()}>
					Lưu bản nháp
				</StudioButton>
				<StudioButton onClick={() => void publish()}>Xuất bản</StudioButton>
				<StudioButton
					variant="danger"
					onClick={async () => {
						const ok = await confirm({
							title: 'Lưu trữ bài kiểm tra',
							description: 'Lưu trữ bài kiểm tra này? Học viên sẽ không còn thấy bài.',
							confirmLabel: 'Lưu trữ',
						});
						if (!ok) return;
						setError(null);
						try {
							await myClassApi(`/api/admin/my-class/tests/${initial.id}`, { method: 'DELETE' });
							router.push(routes.admin.myClassTests);
						} catch (err) {
							setError(err instanceof Error ? err.message : 'Không lưu trữ được');
						}
					}}
				>
					Lưu trữ
				</StudioButton>
			</div>
			<TestCsvImport open={csvOpen} testId={initial.id} existingCount={items.length} onImported={() => router.refresh()} onClose={() => setCsvOpen(false)} />
		</div>
		{dialog}
		</>
	);
}

type CourseOutline = {
	id: string;
	title: string;
	lessons: Array<{ id: string; title: string; sections: Array<{ id: string; title: string }> }>;
};

function TestPlacementForm({
	testId,
	onAttached,
	onError,
}: {
	testId: string;
	onAttached: (placement: Placement) => void;
	onError: (message: string | null) => void;
}) {
	const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
	const [outline, setOutline] = useState<CourseOutline | null>(null);
	const [courseId, setCourseId] = useState('');
	const [lessonId, setLessonId] = useState('');
	const [sectionId, setSectionId] = useState('');
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		void myClassApi<{ items: Array<{ id: string; title: string }> }>('/api/admin/my-class/courses?pageSize=100')
			.then((page) => setCourses(page?.items ?? []))
			.catch((err: unknown) => onError(err instanceof Error ? err.message : 'Không tải được khóa học'));
	}, [onError]);

	useEffect(() => {
		if (!courseId) {
			setOutline(null);
			setLessonId('');
			setSectionId('');
			return;
		}
		void myClassApi<CourseOutline>(`/api/admin/my-class/courses/${courseId}/outline`)
			.then((data) => {
				setOutline(data);
				setLessonId('');
				setSectionId('');
			})
			.catch((err: unknown) => onError(err instanceof Error ? err.message : 'Không tải được mục lục'));
	}, [courseId, onError]);

	const lessons = outline?.lessons ?? [];
	const sections = lessons.find((lesson) => lesson.id === lessonId)?.sections ?? [];
	const scope = sectionId ? 'SECTION' : lessonId ? 'LESSON' : 'COURSE';

	return (
		<form
			className="space-y-3 rounded-[var(--mc-r-sm)] border border-mc-rule p-4"
			onSubmit={async (event) => {
				event.preventDefault();
				if (!courseId) {
					onError('Chọn khóa học');
					return;
				}
				setBusy(true);
				onError(null);
				try {
					const created = await myClassApi<Placement>(`/api/admin/my-class/tests/${testId}/placements`, {
						method: 'POST',
						body: JSON.stringify({
							courseId,
							scope,
							lessonId: lessonId || null,
							sectionId: sectionId || null,
						}),
					});
					onAttached(created);
				} catch (err) {
					onError(err instanceof Error ? err.message : 'Không gắn được bài kiểm tra');
				} finally {
					setBusy(false);
				}
			}}
		>
			<StudioField label="Khóa học">
				<StudioSelect value={courseId} onChange={(event) => setCourseId(event.target.value)}>
					<option value="">Chọn khóa học</option>
					{courses.map((course) => (
						<option key={course.id} value={course.id}>
							{course.title}
						</option>
					))}
				</StudioSelect>
			</StudioField>
			<StudioField label="Bài (tuỳ chọn)">
				<StudioSelect value={lessonId} onChange={(event) => { setLessonId(event.target.value); setSectionId(''); }} disabled={!lessons.length}>
					<option value="">Cả khóa học</option>
					{lessons.map((lesson) => (
						<option key={lesson.id} value={lesson.id}>
							{lesson.title}
						</option>
					))}
				</StudioSelect>
			</StudioField>
			<StudioField label="Phần (tuỳ chọn)">
				<StudioSelect value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!sections.length}>
					<option value="">Cả bài</option>
					{sections.map((section) => (
						<option key={section.id} value={section.id}>
							{section.title}
						</option>
					))}
				</StudioSelect>
			</StudioField>
			<StudioButton type="submit" disabled={busy || !courseId}>
				{busy ? 'Đang gắn…' : 'Gắn vào vị trí này'}
			</StudioButton>
		</form>
	);
}

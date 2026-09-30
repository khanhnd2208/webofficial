'use client';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/components/TiptapEditor';
import { routes } from '@/config/routes';
import type {
	AnswerSpec,
	MyClassQuestionType,
	QuestionOption,
	QuestionOptionKey,
} from '@/features/my-class';
import { extractBlankIds, insertBlankToken, nextBlankId } from '@/features/my-class/domain/blanks';
import { BLOOM_LABELS } from '@/features/my-class/domain/bloom';
import { myClassApi } from './api';
import { StudioButton, StudioField, StudioInput, StudioSelect, StudioTextarea } from './studio';

const KEYS: QuestionOptionKey[] = ['A', 'B', 'C', 'D', 'E', 'F'];

type BlankDraft = {
	id: string;
	length: number;
	accepted: string;
	caseSensitive: boolean;
	ignoreDiacritics: boolean;
	hint: string;
};

export type QuestionFormValue = {
	id?: string;
	slug?: string;
	type: MyClassQuestionType;
	stem: string;
	options: QuestionOption[];
	answer: AnswerSpec;
	explanation: string;
	hint: string;
	source: string;
	difficulty: number;
	subjectId: string | null;
	topicId: string | null;
	tags: string[];
	knowledgeUnitIds: string[];
};

function blanksFromAnswer(answer: AnswerSpec): BlankDraft[] {
	if (answer.type !== 'FILL_BLANK') return [];
	return answer.blanks.map((blank) => ({
		id: blank.id,
		length: blank.length,
		accepted: blank.accepted.join(' | '),
		caseSensitive: blank.caseSensitive,
		ignoreDiacritics: blank.ignoreDiacritics,
		hint: blank.hint ?? '',
	}));
}

function buildAnswer(
	type: MyClassQuestionType,
	options: QuestionOption[],
	correctKeys: QuestionOptionKey[],
	blanks: BlankDraft[],
	scoring: 'ALL_OR_NOTHING' | 'PARTIAL',
): AnswerSpec {
	if (type === 'FILL_BLANK') {
		return {
			type: 'FILL_BLANK',
			scoring,
			blanks: blanks.map((blank) => ({
				id: blank.id,
				length: blank.length,
				accepted: blank.accepted
					.split('|')
					.map((item) => item.trim())
					.filter(Boolean),
				caseSensitive: blank.caseSensitive,
				ignoreDiacritics: blank.ignoreDiacritics,
				hint: blank.hint || undefined,
			})),
		};
	}
	if (type === 'MCQ_MULTI') {
		return { type: 'MCQ_MULTI', correctKeys, scoring };
	}
	return { type: 'MCQ_SINGLE', correctKey: correctKeys[0] ?? 'A' };
}

export default function QuestionForm({
	initial,
	knowledgeUnits,
	subjects = [],
	topics = [],
}: {
	initial?: QuestionFormValue;
	knowledgeUnits: Array<{ id: string; title: string; slug: string }>;
	subjects?: Array<{ id: string; name: string }>;
	topics?: Array<{ id: string; name: string; path: string; subjectId: string }>;
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [type, setType] = useState<MyClassQuestionType>(initial?.type ?? 'MCQ_SINGLE');
	const [stem, setStem] = useState(initial?.stem ?? '');
	const [slug, setSlug] = useState(initial?.slug ?? '');
	const [options, setOptions] = useState(
		initial?.options?.length
			? initial.options
			: [
					{ key: 'A' as const, text: '' },
					{ key: 'B' as const, text: '' },
				],
	);
	const [correctKeys, setCorrectKeys] = useState<QuestionOptionKey[]>(() => {
		if (initial?.answer.type === 'MCQ_MULTI') return initial.answer.correctKeys;
		if (initial?.answer.type === 'MCQ_SINGLE') return [initial.answer.correctKey];
		return ['A'];
	});
	const [scoring, setScoring] = useState<'ALL_OR_NOTHING' | 'PARTIAL'>(
		initial?.answer.type === 'MCQ_SINGLE'
			? 'ALL_OR_NOTHING'
			: (initial?.answer.scoring ?? 'ALL_OR_NOTHING'),
	);
	const [blanks, setBlanks] = useState<BlankDraft[]>(
		blanksFromAnswer(initial?.answer ?? { type: 'MCQ_SINGLE', correctKey: 'A' }),
	);
	const [explanation, setExplanation] = useState(initial?.explanation ?? '');
	const [hint, setHint] = useState(initial?.hint ?? '');
	const [source, setSource] = useState(initial?.source ?? '');
	const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 2);
	const [subjectId, setSubjectId] = useState(initial?.subjectId ?? '');
	const [topicId, setTopicId] = useState(initial?.topicId ?? '');
	const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
	const [selected, setSelected] = useState<string[]>(initial?.knowledgeUnitIds ?? []);
	const [q, setQ] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [suggestion, setSuggestion] = useState<string | null>(null);
	const filtered = useMemo(
		() =>
			knowledgeUnits.filter((item) =>
				`${item.title} ${item.slug}`.toLowerCase().includes(q.toLowerCase()),
			),
		[knowledgeUnits, q],
	);
	const subjectTopics = topics.filter((topic) => !subjectId || topic.subjectId === subjectId);

	useEffect(() => {
		if (!selected.length) return;
		let cancelled = false;
		void myClassApi<Array<{ topicId: string; subjectId: string; topicName: string }>>(
			'/api/admin/my-class/bank/suggest-taxonomy',
			{ method: 'POST', body: JSON.stringify({ knowledgeUnitIds: selected }) },
		)
			.then((rows) => {
				if (cancelled || !rows[0]) return;
				setSuggestion(`Gợi ý từ KU: ${rows[0].topicName}`);
				if (!subjectId) setSubjectId(rows[0].subjectId);
				if (!topicId) setTopicId(rows[0].topicId);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [selected, subjectId, topicId]);

	function setOptionCount(count: number) {
		const next = KEYS.slice(0, count).map(
			(key) => options.find((item) => item.key === key) ?? { key, text: '' },
		);
		setOptions(next);
		setCorrectKeys((current) => {
			const kept = current.filter((key) => next.some((item) => item.key === key));
			const limited = type === 'MCQ_SINGLE' ? kept.slice(0, 1) : kept;
			return limited.length ? limited : [next[0]!.key];
		});
	}

	function toggleCorrect(key: QuestionOptionKey) {
		if (type === 'MCQ_SINGLE') {
			setCorrectKeys([key]);
			return;
		}
		setCorrectKeys((current) =>
			current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
		);
	}

	function addBlank() {
		const id = nextBlankId(blanks.map((item) => item.id));
		setBlanks((current) => [
			...current,
			{ id, length: 6, accepted: '', caseSensitive: false, ignoreDiacritics: true, hint: '' },
		]);
		setStem((current) => insertBlankToken(current, id));
	}

	async function save() {
		setBusy(true);
		setError(null);
		try {
			const answer = buildAnswer(type, options, correctKeys, blanks, scoring);
			const payload = {
				slug: slug || undefined,
				type,
				stem,
				options: type === 'FILL_BLANK' ? [] : options,
				answer,
				explanation,
				hint,
				source,
				difficulty,
				subjectId: subjectId || null,
				topicId: topicId || null,
				tags: tags
					.split(/[|,]/)
					.map((item) => item.trim())
					.filter(Boolean),
				knowledgeUnitIds: selected,
			};
			if (initial?.id) {
				await myClassApi(`/api/admin/my-class/questions/${initial.id}`, {
					method: 'PATCH',
					body: JSON.stringify(payload),
				});
			} else {
				const created = await myClassApi<{ id: string }>('/api/admin/my-class/questions', {
					method: 'POST',
					body: JSON.stringify(payload),
				});
				router.push(routes.admin.myClassQuestionEdit(created.id));
				return;
			}
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được');
		} finally {
			setBusy(false);
		}
	}

	const stemBlankIds = extractBlankIds(stem);

	return (
		<>
			<div className="space-y-5">
				{error ? <p className="text-sm text-error">{error}</p> : null}
				<StudioField label="Dạng câu">
					<StudioSelect
						value={type}
						onChange={(event) => setType(event.target.value as MyClassQuestionType)}
					>
						<option value="MCQ_SINGLE">MCQ một đáp án</option>
						<option value="MCQ_MULTI">MCQ nhiều đáp án</option>
						<option value="FILL_BLANK">Điền ô chữ</option>
					</StudioSelect>
				</StudioField>
				<StudioField label="Câu hỏi">
					<StudioTextarea value={stem} onChange={(event) => setStem(event.target.value)} rows={3} />
				</StudioField>
				<StudioField label="Slug">
					<StudioInput value={slug} onChange={(event) => setSlug(event.target.value)} />
				</StudioField>
				{type !== 'FILL_BLANK' ? (
					<>
						<StudioField label="Số đáp án">
							<StudioSelect
								value={options.length}
								onChange={(event) => setOptionCount(Number(event.target.value))}
							>
								{[2, 3, 4, 5, 6].map((count) => (
									<option key={count} value={count}>
										{count}
									</option>
								))}
							</StudioSelect>
						</StudioField>
						{type === 'MCQ_MULTI' ? (
							<StudioField label="Cách chấm">
								<StudioSelect
									value={scoring}
									onChange={(event) => setScoring(event.target.value as typeof scoring)}
								>
									<option value="ALL_OR_NOTHING">Đúng hết mới có điểm</option>
									<option value="PARTIAL">Điểm từng phần</option>
								</StudioSelect>
							</StudioField>
						) : null}
						<div className="space-y-3">
							{options.map((option) => (
								<div
									key={option.key}
									className="rounded-[var(--mc-r-sm)] border border-mc-rule p-3"
								>
									<label className="flex items-center gap-2 text-sm">
										<input
											type={type === 'MCQ_MULTI' ? 'checkbox' : 'radio'}
											name="correct"
											checked={correctKeys.includes(option.key)}
											onChange={() => toggleCorrect(option.key)}
										/>
										<span className="w-6 font-mono">{option.key}</span>
										<input
											value={option.text}
											onChange={(event) =>
												setOptions((current) =>
													current.map((item) =>
														item.key === option.key ? { ...item, text: event.target.value } : item,
													),
												)
											}
											className="min-h-11 flex-1 rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
										/>
									</label>
									<input
										value={option.feedback ?? ''}
										onChange={(event) =>
											setOptions((current) =>
												current.map((item) =>
													item.key === option.key
														? { ...item, feedback: event.target.value }
														: item,
												),
											)
										}
										placeholder="Giải thích đáp án này"
										className="mt-2 min-h-10 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
									/>
								</div>
							))}
						</div>
					</>
				) : (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold">
								Ô chữ {stemBlankIds.length ? `(stem: ${stemBlankIds.join(', ')})` : ''}
							</p>
							<StudioButton variant="secondary" size="sm" onClick={addBlank}>
								Chèn [[n]]
							</StudioButton>
						</div>
						<StudioField label="Cách chấm">
							<StudioSelect
								value={scoring}
								onChange={(event) => setScoring(event.target.value as typeof scoring)}
							>
								<option value="ALL_OR_NOTHING">Đúng hết mới có điểm</option>
								<option value="PARTIAL">Điểm từng ô</option>
							</StudioSelect>
						</StudioField>
						{blanks.map((blank, index) => (
							<div key={blank.id} className="rounded-[var(--mc-r-sm)] border border-mc-rule p-3">
								<p className="text-sm font-semibold">Ô [[{blank.id}]]</p>
								<div className="mt-2 grid gap-2 sm:grid-cols-2">
									<label className="text-sm">
										Số ô chữ
										<input
											type="number"
											min={1}
											value={blank.length}
											onChange={(event) =>
												setBlanks((current) =>
													current.map((item, i) =>
														i === index ? { ...item, length: Number(event.target.value) } : item,
													),
												)
											}
											className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
										/>
									</label>
									<label className="text-sm">
										Đáp án chấp nhận (| để tách)
										<input
											value={blank.accepted}
											onChange={(event) =>
												setBlanks((current) =>
													current.map((item, i) =>
														i === index ? { ...item, accepted: event.target.value } : item,
													),
												)
											}
											className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
										/>
									</label>
								</div>
								<div className="mt-2 flex flex-wrap gap-3 text-sm">
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={blank.caseSensitive}
											onChange={(event) =>
												setBlanks((current) =>
													current.map((item, i) =>
														i === index ? { ...item, caseSensitive: event.target.checked } : item,
													),
												)
											}
										/>
										Phân biệt hoa thường
									</label>
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={blank.ignoreDiacritics}
											onChange={(event) =>
												setBlanks((current) =>
													current.map((item, i) =>
														i === index
															? { ...item, ignoreDiacritics: event.target.checked }
															: item,
													),
												)
											}
										/>
										Bỏ dấu
									</label>
								</div>
								<div className="mt-2 flex gap-1" aria-hidden>
									{Array.from({ length: Math.max(1, blank.length) }).map((_, box) => (
										<span
											key={box}
											className="inline-flex h-8 w-7 items-center justify-center rounded border border-mc-rule text-xs"
										>
											_
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				)}
				<div>
					<p className="text-sm font-semibold">Giải thích chung</p>
					<TiptapEditor
						content={explanation}
						onChange={setExplanation}
						placeholder="Giải thích đáp án"
					/>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<StudioField label="Gợi ý (hint)">
						<StudioInput value={hint} onChange={(event) => setHint(event.target.value)} />
					</StudioField>
					<StudioField label="Nguồn">
						<StudioInput value={source} onChange={(event) => setSource(event.target.value)} />
					</StudioField>
					<StudioField label="Bloom">
						<StudioSelect
							value={difficulty}
							onChange={(event) => setDifficulty(Number(event.target.value))}
						>
							{[1, 2, 3, 4, 5, 6].map((value) => (
								<option key={value} value={value}>
									{value} · {BLOOM_LABELS[value]}
								</option>
							))}
						</StudioSelect>
					</StudioField>
					<StudioField label="Tags">
						<StudioInput
							value={tags}
							onChange={(event) => setTags(event.target.value)}
							placeholder="hrm, measurement"
						/>
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
					<StudioField label="Chủ đề">
						<StudioSelect value={topicId} onChange={(event) => setTopicId(event.target.value)}>
							<option value="">Chưa gán</option>
							{subjectTopics.map((topic) => (
								<option key={topic.id} value={topic.id}>
									{topic.path}
								</option>
							))}
						</StudioSelect>
					</StudioField>
				</div>
				{suggestion ? <p className="mc-meta">{suggestion}</p> : null}
				<div>
					<p className="text-sm font-semibold">Đơn vị kiến thức</p>
					<input
						value={q}
						onChange={(event) => setQ(event.target.value)}
						placeholder="Tìm KU"
						className="mt-2 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
					<ul
						className="mt-2 max-h-48 space-y-1 overflow-auto text-sm"
						data-testid="ku-multiselect"
					>
						{filtered.map((item) => (
							<li key={item.id}>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={selected.includes(item.id)}
										onChange={() =>
											setSelected((current) =>
												current.includes(item.id)
													? current.filter((id) => id !== item.id)
													: [...current, item.id],
											)
										}
									/>
									{item.title} · {item.slug}
								</label>
							</li>
						))}
					</ul>
				</div>
				<StudioButton disabled={busy} onClick={() => void save()}>
					Lưu câu hỏi
				</StudioButton>
				{initial?.id ? (
					<StudioButton
						variant="danger"
						disabled={busy}
						onClick={async () => {
							const ok = await confirm({
								title: 'Lưu trữ câu hỏi',
								description:
									'Lưu trữ câu hỏi này? Các bài kiểm tra đã xuất bản liên quan sẽ chuyển về bản nháp.',
								confirmLabel: 'Lưu trữ',
							});
							if (!ok) return;
							await myClassApi(`/api/admin/my-class/questions/${initial.id}`, { method: 'DELETE' });
							router.push(routes.admin.myClassBank);
						}}
					>
						Lưu trữ
					</StudioButton>
				) : null}
			</div>
			{dialog}
		</>
	);
}

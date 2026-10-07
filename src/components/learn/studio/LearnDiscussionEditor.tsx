'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import DiscussionQuestionCard from '@/components/learn/DiscussionQuestionCard';
import { newQuestionId } from '@/features/learn/content';
import { discussionQuestionViews } from '@/features/learn/discussionView';
import {
	ANSWER_SNIPPETS,
	PROMPT_SNIPPETS,
	nextStepSnippet,
} from '@/features/learn/discussionTemplates';
import { LEARN_MAX_QUESTIONS } from '@/features/learn/schemas';
import { discussionIssues } from '@/features/learn/questionHealth';
import type { LearnDiscussion, LearnDiscussionQuestion } from '@/features/learn/types';

import LearnRichEditor from './LearnRichEditor';
import QuestionNavigator, { type NavItem } from './QuestionNavigator';
import { StudioIcon } from './icons';
import StudioMenu from './StudioMenu';
import { useWideStudio } from './StudioTabs';
import { flushRegisteredEditors } from './useStudioSaver';
import { useDeferredDeletes } from './useDeferredDeletes';
import StudioToast from './StudioToast';

type Field = 'prompt' | 'answer';
type Pane = Field | 'preview';

interface DiscussionSessionValue {
	items: NavItem[];
	activeId: string | null;
	activeTitle: string;
	count: number;
	select: (id: string) => void;
	update: (id: string, patch: Partial<LearnDiscussionQuestion>) => void;
	reorder: (ids: string[]) => void;
	duplicate: (id: string) => void;
	remove: (id: string) => void;
	add: () => void;
	step: (delta: number) => void;
}

const DiscussionSessionContext = createContext<DiscussionSessionValue | null>(null);

export function useDiscussionSession() {
	return useContext(DiscussionSessionContext);
}

function emptyQuestion(): LearnDiscussionQuestion {
	return { id: newQuestionId(), question: '', answer: '' };
}

export function DiscussionSession({
	discussion,
	onChange,
	children,
	onSelect: onSelected,
}: {
	discussion: LearnDiscussion;
	onChange: (discussion: LearnDiscussion) => void;
	children: ReactNode;
	onSelect?: () => void;
}) {
	const [activeId, setActiveId] = useState<string | null>(discussion.questions[0]?.id ?? null);

	const latest = useRef(discussion.questions);
	useEffect(() => {
		latest.current = discussion.questions;
	}, [discussion.questions]);
	function setQuestions(questions: LearnDiscussionQuestion[]) {
		latest.current = questions;
		onChange({ questions });
	}
	const deletes = useDeferredDeletes();
	const visible = discussion.questions;

	function update(id: string, patch: Partial<LearnDiscussionQuestion>) {
		setQuestions(latest.current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
	}
	const views = discussionQuestionViews(visible.map((item) => item.question));
	const activeIndex = Math.max(
		0,
		visible.findIndex((item) => item.id === activeId),
	);
	const active = visible[activeIndex] ?? null;
	const visibleKey = visible.map((item) => item.id).join('\0');
	const [seenQuestions, setSeenQuestions] = useState(visibleKey);
	if (seenQuestions !== visibleKey) {
		setSeenQuestions(visibleKey);
		if (!activeId || !visible.some((item) => item.id === activeId)) {
			setActiveId(visible[0]?.id ?? null);
		}
	}

	function select(id: string) {
		flushRegisteredEditors();
		setActiveId(id);
		onSelected?.();
	}

	function step(delta: number) {
		const next = visible[activeIndex + delta];
		if (next) select(next.id);
	}

	function reorder(ids: string[]) {
		flushRegisteredEditors();
		const byId = new Map(latest.current.map((item) => [item.id, item]));
		setQuestions(ids.map((id) => byId.get(id)!).filter(Boolean));
	}

	function duplicate(id: string) {
		flushRegisteredEditors();
		if (latest.current.length >= LEARN_MAX_QUESTIONS) return;
		const index = latest.current.findIndex((item) => item.id === id);
		if (index < 0) return;
		const copy = { ...latest.current[index], id: newQuestionId() };
		const next = [...latest.current];
		next.splice(index + 1, 0, copy);
		setQuestions(next);
		select(copy.id);
	}

	const value: DiscussionSessionValue = {
		items: visible.map((item, index) => ({
			id: item.id,
			title:
				views[index]?.title ||
				item.question
					.replace(/^#{1,6}\s+/, '')
					.split('\n')
					.map((line) => line.trim())
					.find(Boolean) ||
				`Câu ${index + 1}`,
			issues: discussionIssues(item, views[index]),
			group: views[index]?.part ?? null,
		})),
		activeId: active?.id ?? null,
		activeTitle: views[activeIndex]?.title || (active ? `Câu ${activeIndex + 1}` : 'Chưa có câu'),
		count: visible.length,
		select,
		update,
		reorder,
		duplicate,
		remove: (id) => {
			flushRegisteredEditors();
			const index = latest.current.findIndex((item) => item.id === id);
			const removed = latest.current[index];
			if (!removed) return;
			const beforeId = latest.current[index + 1]?.id;
			setQuestions(latest.current.filter((item) => item.id !== id));
			deletes.defer({
				key: id,
				message: `Đã xóa câu ${index + 1}`,
				commit: () => undefined,
				restore: () => {
					flushRegisteredEditors();
					if (latest.current.some((item) => item.id === id)) return;
					const next = [...latest.current];
					const before = next.findIndex((item) => item.id === beforeId);
					next.splice(before >= 0 ? before : Math.min(index, next.length), 0, removed);
					setQuestions(next);
					setActiveId(id);
				},
			});
		},
		add: () => {
			flushRegisteredEditors();
			if (latest.current.length >= LEARN_MAX_QUESTIONS) return;
			const created = emptyQuestion();
			setQuestions([...latest.current, created]);
			select(created.id);
		},
		step,
	};

	return (
		<DiscussionSessionContext.Provider value={value}>
			{children}
			<StudioToast message={deletes.message} onAction={deletes.undo} onClose={deletes.commitAll} />
		</DiscussionSessionContext.Provider>
	);
}

export function DiscussionQuestionList() {
	const session = useDiscussionSession();
	if (!session) return null;
	return (
		<div className="ln-qside">
			<button
				type="button"
				className="ln-btn ln-btn--primary ln-btn--block"
				onClick={session.add}
				disabled={session.count >= LEARN_MAX_QUESTIONS}
			>
				<StudioIcon name="plus" size={14} /> Thêm câu
			</button>
			<p className="ln-qside__count tabular-nums">{session.count} câu</p>
			{session.count ? (
				<QuestionNavigator
					items={session.items}
					activeId={session.activeId}
					onSelect={session.select}
					onReorder={session.reorder}
					onDuplicate={session.duplicate}
					onDelete={session.remove}
				/>
			) : (
				<p className="ln-empty-hint">Chưa có câu. Thêm câu hoặc nhập nội dung.</p>
			)}
		</div>
	);
}

function useWorkWidth() {
	const ref = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(0);
	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(node);
		return () => observer.disconnect();
	}, []);
	return { ref, wide: width >= 960 };
}

export default function LearnDiscussionEditor({
	sectionId,
	discussion,
	onChange,
	onOpenImport,
	onOpenHelp,
}: {
	sectionId: string;
	discussion: LearnDiscussion;
	onChange: (discussion: LearnDiscussion) => void;
	onOpenImport: () => void;
	onOpenHelp: () => void;
}) {
	const session = useDiscussionSession();
	const [pane, setPane] = useState<Pane>('prompt');
	const [splitPreferred, setSplitPreferred] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const insertRef = useRef<((snippet: string) => void) | null>(null);
	const { ref, wide: workWide } = useWorkWidth();
	const compact = !useWideStudio();
	const split = splitPreferred && workWide && pane !== 'preview';
	const activeIndex = Math.max(
		0,
		discussion.questions.findIndex((item) => item.id === session?.activeId),
	);
	const active = discussion.questions[activeIndex] ?? null;
	const views = discussionQuestionViews(discussion.questions.map((item) => item.question));
	const view = views[activeIndex];

	function update(id: string, patch: Partial<LearnDiscussionQuestion>) {
		if (session) {
			session.update(id, patch);
			return;
		}
		onChange({
			questions: discussion.questions.map((item) =>
				item.id === id ? { ...item, ...patch } : item,
			),
		});
	}

	function insert(snippet: string) {
		insertRef.current?.(snippet);
	}

	const field: Field = pane === 'answer' ? 'answer' : 'prompt';
	const snippets =
		field === 'prompt'
			? [
					{ label: 'Tình huống', text: PROMPT_SNIPPETS.situation },
					{ label: 'Câu hỏi', text: PROMPT_SNIPPETS.ask },
				]
			: [
					{ label: 'Nhắc lại bài học', text: ANSWER_SNIPPETS.recall },
					{
						label: 'Bước giải',
						text: active?.answer.includes('#### Bước')
							? nextStepSnippet(active.answer)
							: ANSWER_SNIPPETS.steps,
					},
					{ label: 'Điều rút ra', text: ANSWER_SNIPPETS.takeaway },
				];
	const tooLong =
		field === 'prompt'
			? (active?.question.length ?? 0) > 8_000
			: (active?.answer.length ?? 0) > 30_000;

	return (
		<div className="ln-qwork" ref={ref} data-split={split ? 'true' : undefined}>
			<div className="ln-qwork__main">
				{compact && session ? (
					<div className="ln-qstep">
						<button
							type="button"
							className="ln-btn"
							disabled={activeIndex <= 0}
							onClick={() => session.step(-1)}
						>
							Câu trước
						</button>
						<p className="ln-qstep__title">{session.activeTitle}</p>
						<button
							type="button"
							className="ln-btn"
							disabled={!active || activeIndex >= discussion.questions.length - 1}
							onClick={() => session.step(1)}
						>
							Câu sau
						</button>
					</div>
				) : null}
				<div className="ln-qsplit__switch" role="tablist" aria-label="Nội dung câu">
					{(
						[
							['prompt', 'Đề bài'],
							['answer', 'Đáp án mẫu'],
							['preview', 'Xem trước'],
						] as const
					).map(([id, label]) => (
						<button
							key={id}
							type="button"
							role="tab"
							aria-selected={pane === id}
							onClick={() => {
								flushRegisteredEditors();
								setPane(id);
							}}
						>
							{label}
						</button>
					))}
				</div>
				{active && pane !== 'preview' ? (
					<>
						<div className="ln-qwork__tools">
							<StudioMenu
								label="Chèn cấu trúc"
								trigger="Chèn cấu trúc"
								triggerClassName="ln-btn"
								items={snippets.map((item) => ({
									label: item.label,
									onSelect: () => insert(item.text),
								}))}
							/>
							{workWide ? (
								<button
									type="button"
									className="ln-btn"
									aria-pressed={splitPreferred}
									onClick={() => setSplitPreferred((current) => !current)}
								>
									{splitPreferred ? 'Một khung' : 'Soạn và xem cạnh nhau'}
								</button>
							) : null}
						</div>
						{tooLong ? (
							<p className="ln-field-error">
								{field === 'prompt'
									? 'Đề bài tối đa 8.000 ký tự.'
									: 'Đáp án mẫu tối đa 30.000 ký tự.'}
							</p>
						) : null}
						<LearnRichEditor
							key={`${sectionId}:${active.id}:${field}`}
							value={field === 'prompt' ? active.question : active.answer}
							label={field === 'prompt' ? 'Đề bài' : 'Đáp án mẫu'}
							markdownPreview={false}
							onOpenHelp={onOpenHelp}
							bindInsert={(insertMarkdown) => {
								insertRef.current = insertMarkdown;
							}}
							onChange={(markdown) =>
								update(
									active.id,
									field === 'prompt' ? { question: markdown } : { answer: markdown },
								)
							}
						/>
					</>
				) : null}
				{!active ? (
					<div className="ln-studio__empty">
						<p>Chưa có câu hỏi.</p>
						<button type="button" className="ln-btn ln-btn--primary" onClick={() => session?.add()}>
							Thêm câu
						</button>
					</div>
				) : null}
				<div className="ln-qsplit__actions">
					<button type="button" className="ln-btn" onClick={onOpenImport}>
						<StudioIcon name="import" size={14} /> Nhập nội dung
					</button>
				</div>
			</div>
			{active && view && (pane === 'preview' || split) ? (
				<div className="ln ln-qwork__preview ln-qpreview">
					<p className="ln-eyebrow">Xem như học viên</p>
					<DiscussionQuestionCard
						index={activeIndex}
						view={view}
						answer={active.answer}
						open={previewOpen || split}
						onOpenChange={setPreviewOpen}
					/>
				</div>
			) : null}
		</div>
	);
}

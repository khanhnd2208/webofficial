'use client';

import { useRef } from 'react';

import { sectionMinutes } from '@/features/learn/content';
import { exportLessonMarkdown } from '@/features/learn/lessonImport';
import { LEARN_SECTION_KIND_SHORT, type LearnCheckpoint, type LearnSectionKind, type LearnStudioLesson, type LearnStudioSection } from '@/features/learn/types';

import { StudioIcon } from './icons';
import OptionListEditor from './OptionListEditor';
import SectionHistory from './SectionHistory';

export type SectionPatch = Partial<
	Pick<
		LearnStudioSection,
		'title' | 'type' | 'durationMinutes' | 'summary' | 'keyTakeaways' | 'markdown' | 'checkpoint' | 'quiz' | 'discussion'
	>
>;

function TakeawaysEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
	const inputs = useRef<Array<HTMLInputElement | null>>([]);
	const rows = items.length ? items : [];

	function add(at = rows.length) {
		const next = [...rows];
		next.splice(at, 0, '');
		onChange(next);
		requestAnimationFrame(() => inputs.current[at]?.focus());
	}

	return (
		<div className="ln-takeedit">
			{rows.map((item, index) => (
				<div key={index} className="ln-takeedit__row">
					<span aria-hidden="true">•</span>
					<input
						ref={(element) => {
							inputs.current[index] = element;
						}}
						value={item}
						placeholder="Một ý chính ngắn gọn"
						maxLength={500}
						onChange={(event) => onChange(rows.map((value, i) => (i === index ? event.target.value : value)))}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								add(index + 1);
							}
							if (event.key === 'Backspace' && !item) {
								event.preventDefault();
								onChange(rows.filter((_, i) => i !== index));
								requestAnimationFrame(() => inputs.current[Math.max(0, index - 1)]?.focus());
							}
						}}
					/>
				</div>
			))}
			<button type="button" className="ln-link-btn" onClick={() => add()}>
				+ Thêm ý chính
			</button>
		</div>
	);
}

function CheckpointEditor({
	sectionId,
	checkpoint,
	onChange,
}: {
	sectionId: string;
	checkpoint: LearnCheckpoint | null;
	onChange: (checkpoint: LearnCheckpoint | null) => void;
}) {
	if (!checkpoint) {
		return (
			<button
				type="button"
				className="ln-link-btn"
				onClick={() => onChange({ question: '', options: ['', '', ''], correctIndex: 0, explanation: '' })}
			>
				+ Thêm câu hỏi nhanh cuối mục
			</button>
		);
	}
	return (
		<div className="ln-checkedit">
			<textarea
				className="ln-input"
				rows={2}
				value={checkpoint.question}
				placeholder="Câu hỏi tự kiểm tra"
				onChange={(event) => onChange({ ...checkpoint, question: event.target.value })}
			/>
			<OptionListEditor
				name={`${sectionId}-checkpoint`}
				options={checkpoint.options}
				correctIndex={checkpoint.correctIndex}
				onChange={(next) => onChange({ ...checkpoint, ...next })}
			/>
			<textarea
				className="ln-input"
				rows={2}
				value={checkpoint.explanation}
				placeholder="Giải thích (hiện sau khi chọn)"
				onChange={(event) => onChange({ ...checkpoint, explanation: event.target.value })}
			/>
			<button type="button" className="ln-link-btn ln-link-btn--danger" onClick={() => onChange(null)}>
				Bỏ câu hỏi nhanh
			</button>
		</div>
	);
}

function downloadMarkdown(section: LearnStudioSection) {
	const markdown = exportLessonMarkdown({
		title: section.title,
		description: '',
		sections: [section],
	});
	const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${section.title.replace(/[\\/:*?"<>|]+/g, '').slice(0, 80) || 'muc'}.md`;
	link.click();
	URL.revokeObjectURL(url);
}

export default function StudioInspector({
	section,
	lessons,
	onPatch,
	onMove,
	onDelete,
	onRestored,
	onSaveVersion,
	previewHref,
}: {
	section: LearnStudioSection;
	lessons: LearnStudioLesson[];
	onPatch: (patch: SectionPatch) => void;
	onMove: (lessonId: string) => void;
	onDelete: () => void;
	onRestored: (section: LearnStudioSection) => void;
	onSaveVersion: () => Promise<void>;
	previewHref: string;
}) {
	const autoMinutes = sectionMinutes({ ...section, durationMinutes: null });

	return (
		<aside className="ln-inspector" aria-label="Thuộc tính mục">
			<div className="ln-inspector__group">
				<p className="ln-inspector__label">Loại mục</p>
				<div className="ln-segmented" role="radiogroup" aria-label="Loại mục">
					{(['READING', 'QUIZ', 'PRACTICE', 'DISCUSSION'] as const satisfies readonly LearnSectionKind[]).map((type) => (
						<button
							key={type}
							type="button"
							role="radio"
							aria-checked={section.type === type}
							onClick={() =>
								onPatch({
									type,
									...((type === 'QUIZ' || type === 'PRACTICE') && !section.quiz
										? { quiz: { passingScorePercent: 70, timeLimitMinutes: null, questions: [] } }
										: {}),
									...(type === 'DISCUSSION' && !section.discussion ? { discussion: { questions: [] } } : {}),
								})
							}
						>
							{LEARN_SECTION_KIND_SHORT[type]}
						</button>
					))}
				</div>
			</div>

			<div className="ln-inspector__group">
				<label className="ln-inspector__label" htmlFor="ln-duration">
					Thời lượng
				</label>
				<span className="ln-affix">
					<input
						id="ln-duration"
						type="number"
						min={1}
						max={600}
						placeholder={String(autoMinutes)}
						value={section.durationMinutes ?? ''}
						onChange={(event) => {
							const minutes = Number(event.target.value);
							onPatch({ durationMinutes: minutes > 0 ? Math.min(600, minutes) : null });
						}}
					/>
					phút
				</span>
				<p className="ln-inspector__hint">Để trống: tự tính ({autoMinutes} phút).</p>
			</div>

			<div className="ln-inspector__group">
				<label className="ln-inspector__label" htmlFor="ln-summary">
					Tóm tắt
				</label>
				<textarea
					id="ln-summary"
					className="ln-input"
					rows={3}
					maxLength={2000}
					value={section.summary}
					placeholder="Một câu nói mục này giúp người học hiểu điều gì"
					onChange={(event) => onPatch({ summary: event.target.value })}
				/>
			</div>

			<div className="ln-inspector__group">
				<p className="ln-inspector__label">Ý chính</p>
				<TakeawaysEditor items={section.keyTakeaways} onChange={(keyTakeaways) => onPatch({ keyTakeaways })} />
			</div>

			{section.type === 'READING' ? (
				<div className="ln-inspector__group">
					<p className="ln-inspector__label">Câu hỏi nhanh</p>
					<CheckpointEditor
						sectionId={section.id}
						checkpoint={section.checkpoint}
						onChange={(checkpoint) => onPatch({ checkpoint })}
					/>
				</div>
			) : null}

			<div className="ln-inspector__group">
				<label className="ln-inspector__label" htmlFor="ln-move">
					Thuộc bài
				</label>
				<select id="ln-move" className="ln-input" value={section.lessonId} onChange={(event) => onMove(event.target.value)}>
					{lessons.map((lesson, index) => (
						<option key={lesson.id} value={lesson.id}>
							Bài {index + 1}: {lesson.title}
						</option>
					))}
				</select>
			</div>

			<div className="ln-inspector__actions">
				<SectionHistory
					sectionId={section.id}
					currentMarkdown={section.markdown}
					onRestored={onRestored}
					onSaveVersion={onSaveVersion}
				/>
				<a className="ln-btn ln-btn--block" href={previewHref} target="_blank" rel="noreferrer">
					<StudioIcon name="eye" size={14} /> Xem như học viên
				</a>
				{section.type === 'READING' ? (
					<button type="button" className="ln-btn ln-btn--block" onClick={() => downloadMarkdown(section)}>
						<StudioIcon name="download" size={14} /> Tải Markdown
					</button>
				) : null}
				<button type="button" className="ln-btn ln-btn--block ln-btn--danger-quiet" onClick={onDelete}>
					<StudioIcon name="trash" size={14} /> Xóa mục này
				</button>
			</div>
		</aside>
	);
}

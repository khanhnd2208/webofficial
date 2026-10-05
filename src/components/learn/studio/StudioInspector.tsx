'use client';

import { useRef } from 'react';

import { sectionMinutes } from '@/features/learn/content';
import {
	type LearnCheckpoint,
	type LearnStudioLesson,
	type LearnStudioSection,
} from '@/features/learn/types';

import { StudioIcon } from './icons';
import OptionListEditor from './OptionListEditor';
import type { SectionPatch } from './sectionPatch';

export type { SectionPatch };

function TakeawaysEditor({
	items,
	onChange,
}: {
	items: string[];
	onChange: (items: string[]) => void;
}) {
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
						onChange={(event) =>
							onChange(rows.map((value, i) => (i === index ? event.target.value : value)))
						}
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
				onClick={() =>
					onChange({ question: '', options: ['', '', ''], correctIndex: 0, explanation: '' })
				}
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
				aria-label="Câu hỏi tự kiểm tra"
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
				aria-label="Giải thích câu hỏi nhanh"
				value={checkpoint.explanation}
				placeholder="Giải thích (hiện sau khi chọn)"
				onChange={(event) => onChange({ ...checkpoint, explanation: event.target.value })}
			/>
			<button
				type="button"
				className="ln-link-btn ln-link-btn--danger"
				onClick={() => onChange(null)}
			>
				Bỏ câu hỏi nhanh
			</button>
		</div>
	);
}

export default function StudioInspector({
	section,
	lessons,
	onPatch,
	onMove,
	onDelete,
	onHistory,
	onPreview,
}: {
	section: LearnStudioSection;
	lessons: LearnStudioLesson[];
	onPatch: (patch: SectionPatch) => void;
	onMove: (lessonId: string) => void;
	onDelete: () => void;
	onHistory: () => void;
	onPreview: () => void;
}) {
	const autoMinutes = sectionMinutes({ ...section, durationMinutes: null });

	return (
		<aside className="ln-inspector" aria-label="Thuộc tính mục">
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
				<TakeawaysEditor
					items={section.keyTakeaways}
					onChange={(keyTakeaways) => onPatch({ keyTakeaways })}
				/>
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
				<select
					id="ln-move"
					className="ln-input"
					value={section.lessonId}
					onChange={(event) => onMove(event.target.value)}
				>
					{lessons.map((lesson, index) => (
						<option key={lesson.id} value={lesson.id}>
							Bài {index + 1}: {lesson.title}
						</option>
					))}
				</select>
			</div>

			<div className="ln-inspector__group">
				<p className="ln-inspector__label">Lịch sử</p>
				<button type="button" className="ln-btn ln-btn--block" onClick={onHistory}>
					Xem các phiên bản
				</button>
			</div>

			<div className="ln-inspector__actions">
				<button type="button" className="ln-btn ln-btn--block" onClick={onPreview}>
					<StudioIcon name="eye" size={14} /> Xem như học viên
				</button>
				<button
					type="button"
					className="ln-btn ln-btn--block ln-btn--danger-quiet"
					onClick={onDelete}
				>
					<StudioIcon name="trash" size={14} /> Xóa mục này
				</button>
			</div>
		</aside>
	);
}

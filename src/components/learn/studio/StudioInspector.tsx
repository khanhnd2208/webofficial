'use client';

import { useRef } from 'react';

import { sectionMinutes } from '@/features/learn/content';
import { type LearnStudioLesson, type LearnStudioSection } from '@/features/learn/types';

import { StudioIcon } from './icons';
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

export default function StudioInspector({
	section,
	lessons,
	onPatch,
	onMove,
	onDelete,
	onHistory,
	onPreview,
	onClose,
}: {
	section: LearnStudioSection;
	lessons: LearnStudioLesson[];
	onPatch: (patch: SectionPatch) => void;
	onMove: (lessonId: string) => void;
	onDelete: () => void;
	onHistory: () => void;
	onPreview: () => void;
	onClose: () => void;
}) {
	const autoMinutes = sectionMinutes({ ...section, durationMinutes: null });

	return (
		<aside className="ln-inspector" aria-label="Thuộc tính mục">
			<div className="ln-inspector__head">
				<p className="ln-inspector__label">Thuộc tính</p>
				<button
					type="button"
					className="ln-icon-btn"
					onClick={onClose}
					aria-label="Đóng thuộc tính"
				>
					<StudioIcon name="close" />
				</button>
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
				<TakeawaysEditor
					items={section.keyTakeaways}
					onChange={(keyTakeaways) => onPatch({ keyTakeaways })}
				/>
			</div>

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

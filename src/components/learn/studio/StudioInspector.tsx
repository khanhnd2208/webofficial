'use client';

import { useRef } from 'react';

import { sectionMinutes } from '@/features/learn/content';
import { type LearnStudioLesson, type LearnStudioSection } from '@/features/learn/types';

import { StudioIcon } from './icons';
import type { SectionFieldErrors, SectionPatch } from './sectionPatch';

export type { SectionPatch };

function TakeawaysEditor({
	items,
	describedBy,
	onChange,
}: {
	items: string[];
	describedBy?: string;
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
		<div className="ln-takeedit" role="group" aria-labelledby="ln-takeaways-label">
			{rows.map((item, index) => (
				<div key={index} className="ln-takeedit__row">
					<span aria-hidden="true">•</span>
					<input
						ref={(element) => {
							inputs.current[index] = element;
						}}
						value={item}
						placeholder="Một ý chính ngắn gọn"
						aria-label={`Ý chính ${index + 1}`}
						aria-describedby={describedBy}
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
	fieldErrors,
	onPatch,
	onMove,
	onDelete,
	onHistory,
}: {
	section: LearnStudioSection;
	lessons: LearnStudioLesson[];
	fieldErrors?: SectionFieldErrors;
	onPatch: (patch: SectionPatch) => void;
	onMove: (lessonId: string) => void;
	onDelete: () => void;
	onHistory: () => void;
}) {
	const autoMinutes = sectionMinutes({ ...section, durationMinutes: null });
	const durationHint = fieldErrors?.durationMinutes
		? 'ln-duration-hint ln-duration-error'
		: 'ln-duration-hint';
	const summaryHint = fieldErrors?.summary ? 'ln-summary-hint ln-summary-error' : 'ln-summary-hint';
	const takeawayHint = fieldErrors?.keyTakeaways ? 'ln-takeaways-error' : undefined;

	return (
		<aside className="ln-inspector" aria-label="Thông tin mục">
			<div className="ln-inspector__head">
				<h2 className="ln-inspector__title">Thông tin mục</h2>
			</div>

			<section className="ln-inspector__group" aria-labelledby="ln-learner-fields">
				<h3 id="ln-learner-fields" className="ln-inspector__label">
					Hiện với học viên
				</h3>
				<p className="ln-inspector__hint">Tùy chọn. Để trống nếu không cần hiện.</p>

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
						aria-describedby={durationHint}
						aria-invalid={fieldErrors?.durationMinutes ? true : undefined}
						value={section.durationMinutes ?? ''}
						onChange={(event) => {
							const minutes = Number(event.target.value);
							onPatch({ durationMinutes: minutes > 0 ? Math.min(600, minutes) : null });
						}}
					/>
					phút
				</span>
				<p id="ln-duration-hint" className="ln-inspector__hint">
					Hiện cạnh loại mục trên trang học, ví dụ “Bài đọc · {autoMinutes} phút”. Để trống thì tự
					tính.
				</p>
				{fieldErrors?.durationMinutes ? (
					<p id="ln-duration-error" className="ln-field-error ln-field-error--block" role="alert">
						{fieldErrors.durationMinutes}
					</p>
				) : null}

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
					aria-describedby={summaryHint}
					aria-invalid={fieldErrors?.summary ? true : undefined}
					onChange={(event) => onPatch({ summary: event.target.value })}
				/>
				<p id="ln-summary-hint" className="ln-inspector__hint">
					Hiện ngay dưới tên mục, trước nội dung bài.
				</p>
				{fieldErrors?.summary ? (
					<p id="ln-summary-error" className="ln-field-error ln-field-error--block" role="alert">
						{fieldErrors.summary}
					</p>
				) : null}

				<p id="ln-takeaways-label" className="ln-inspector__label">
					Ý chính
				</p>
				<TakeawaysEditor
					items={section.keyTakeaways}
					describedBy={takeawayHint}
					onChange={(keyTakeaways) => onPatch({ keyTakeaways })}
				/>
				<p className="ln-inspector__hint">Hiện trong khối “Bạn sẽ nắm được”, trước nội dung bài.</p>
				{fieldErrors?.keyTakeaways ? (
					<p id="ln-takeaways-error" className="ln-field-error ln-field-error--block" role="alert">
						{fieldErrors.keyTakeaways}
					</p>
				) : null}
			</section>

			<section className="ln-inspector__group" aria-labelledby="ln-structure-fields">
				<h3 id="ln-structure-fields" className="ln-inspector__label">
					Cấu trúc
				</h3>
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
				<button type="button" className="ln-btn ln-btn--block mt-3" onClick={onHistory}>
					Xem các phiên bản
				</button>
			</section>

			<div className="ln-inspector__actions">
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

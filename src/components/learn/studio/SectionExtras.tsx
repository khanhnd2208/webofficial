'use client';

import { useRef } from 'react';

import { sectionMinutes } from '@/features/learn/content';
import type { LearnStudioSection } from '@/features/learn/types';

import type { SectionFieldErrors, SectionPatch } from './sectionPatch';

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

/** Optional learner-facing extras. Collapsed under the editor: most sections leave them empty. */
export default function SectionExtras({
	section,
	fieldErrors,
	onPatch,
}: {
	section: LearnStudioSection;
	fieldErrors?: SectionFieldErrors;
	onPatch: (patch: SectionPatch) => void;
}) {
	const autoMinutes = sectionMinutes({ ...section, durationMinutes: null });
	const durationHint = fieldErrors?.durationMinutes
		? 'ln-duration-hint ln-duration-error'
		: 'ln-duration-hint';
	const summaryHint = fieldErrors?.summary ? 'ln-summary-hint ln-summary-error' : 'ln-summary-hint';
	const takeawayHint = fieldErrors?.keyTakeaways ? 'ln-takeaways-error' : undefined;
	const hasErrors = Boolean(
		fieldErrors?.durationMinutes || fieldErrors?.summary || fieldErrors?.keyTakeaways,
	);
	const filled = [
		section.durationMinutes ? 'thời lượng' : null,
		section.summary.trim() ? 'tóm tắt' : null,
		section.keyTakeaways.some((item) => item.trim()) ? 'ý chính' : null,
	].filter(Boolean);

	return (
		<details className="ln-extras" open={hasErrors || undefined}>
			<summary>
				Tùy chọn hiển thị
				<span className="ln-extras__meta">
					{filled.length ? `Đang dùng: ${filled.join(', ')}` : 'Không bắt buộc'}
				</span>
			</summary>
			<div className="ln-extras__body">
				<label className="ln-inspector__label" htmlFor="ln-summary">
					Tóm tắt
				</label>
				<textarea
					id="ln-summary"
					className="ln-input"
					rows={2}
					maxLength={2000}
					value={section.summary}
					placeholder="Một câu nói mục này giúp người học hiểu điều gì"
					aria-describedby={summaryHint}
					aria-invalid={fieldErrors?.summary ? true : undefined}
					onChange={(event) => onPatch({ summary: event.target.value })}
				/>
				<p id="ln-summary-hint" className="ln-inspector__hint">
					Hiện ngay dưới tên mục.
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
				<p className="ln-inspector__hint">Hiện trong khối “Bạn sẽ nắm được”.</p>
				{fieldErrors?.keyTakeaways ? (
					<p id="ln-takeaways-error" className="ln-field-error ln-field-error--block" role="alert">
						{fieldErrors.keyTakeaways}
					</p>
				) : null}

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
					Để trống thì tự tính (khoảng {autoMinutes} phút).
				</p>
				{fieldErrors?.durationMinutes ? (
					<p id="ln-duration-error" className="ln-field-error ln-field-error--block" role="alert">
						{fieldErrors.durationMinutes}
					</p>
				) : null}
			</div>
		</details>
	);
}

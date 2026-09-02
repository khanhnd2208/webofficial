'use client';

import { useId, useRef, useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { parseCalendarDate } from '@/features/teaching/domain/studentIdentity';
import { sessionDateLabel } from '@/components/teaching/admin/attendanceLabels';
import type { GradebookSaveState } from '@/components/teaching/admin/useGradebookMutations';

function partsFromIso(iso: string | null): { dd: string; mm: string; yyyy: string } {
	if (!iso) return { dd: '', mm: '', yyyy: '' };
	const [year, month, day] = iso.split('-');
	return { dd: day ?? '', mm: month ?? '', yyyy: year ?? '' };
}

function openDatePicker(input: HTMLInputElement) {
	const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
	if (typeof pickerInput.showPicker === 'function') {
		try {
			pickerInput.showPicker();
		} catch {
			// Native picker can reject outside a trusted gesture.
		}
	}
}

export function SessionDateInput({
	weekNumber,
	value,
	saveState,
	disabled,
	onCommit,
}: {
	weekNumber: number;
	value: string | null;
	saveState?: GradebookSaveState | 'idle';
	disabled?: boolean;
	onCommit: (heldOn: string | null) => void | Promise<void>;
}) {
	const labelId = useId();
	const nativeRef = useRef<HTMLInputElement>(null);
	const ddRef = useRef<HTMLInputElement>(null);
	const mmRef = useRef<HTMLInputElement>(null);
	const yyyyRef = useRef<HTMLInputElement>(null);
	const [draft, setDraft] = useState(() => partsFromIso(value));
	const [error, setError] = useState('');
	const [syncedValue, setSyncedValue] = useState(value);

	if (value !== syncedValue) {
		setSyncedValue(value);
		setDraft(partsFromIso(value));
		setError('');
	}

	function applyText(text: string, source: 'dd' | 'mm' | 'yyyy' | 'paste') {
		const compact = text.replace(/[^\d]/g, '');
		if (source === 'paste' || compact.length >= 8) {
			const parsed = parseCalendarDate(text.trim() || compact);
			if (parsed.iso) {
				setDraft(partsFromIso(parsed.iso));
				setError('');
				commit(parsed.iso);
				return;
			}
		}
		if (source === 'dd') {
			setDraft((current) => ({ ...current, dd: compact.slice(0, 2) }));
			if (compact.length >= 2) mmRef.current?.focus();
		} else if (source === 'mm') {
			setDraft((current) => ({ ...current, mm: compact.slice(0, 2) }));
			if (compact.length >= 2) yyyyRef.current?.focus();
		} else {
			const nextYear = compact.slice(0, 4);
			setDraft((current) => ({ ...current, yyyy: nextYear }));
			if (nextYear.length >= 4 && draft.dd && draft.mm) {
				const parsed = parseCalendarDate(`${draft.dd}/${draft.mm}/${nextYear}`);
				if (parsed.iso) {
					setError('');
					void commit(parsed.iso);
				} else {
					setError(parsed.error ?? 'Ngày không hợp lệ');
				}
			}
		}
	}

	function commitDraft() {
		if (!draft.dd && !draft.mm && !draft.yyyy) {
			setError('');
			if (value) commit(null);
			return;
		}
		const parsed = parseCalendarDate(`${draft.dd}/${draft.mm}/${draft.yyyy}`);
		if (!parsed.iso) {
			setError(parsed.error ?? 'Ngày không hợp lệ');
			return;
		}
		setError('');
		if (parsed.iso !== value) commit(parsed.iso);
	}

	function cancelDraft() {
		setDraft(partsFromIso(value));
		setError('');
	}

	function commit(heldOn: string | null) {
		void Promise.resolve(onCommit(heldOn)).catch(() => undefined);
	}

	const status =
		saveState === 'saving'
			? 'Đang lưu…'
			: saveState === 'error'
				? 'Lỗi lưu ngày'
				: '';

	return (
		<div className="mc-session-date" data-invalid={error ? 'true' : undefined}>
			<span id={labelId} className="sr-only">
				Ngày học tuần {weekNumber}
			</span>
			<div
				className="mc-session-date-fields"
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget as Node)) commitDraft();
				}}
			>
				<input
					ref={ddRef}
					inputMode="numeric"
					maxLength={2}
					placeholder="DD"
					aria-labelledby={labelId}
					aria-label={`Ngày học tuần ${weekNumber}`}
					disabled={disabled}
					value={draft.dd}
					onChange={(event) => applyText(event.target.value, 'dd')}
					onPaste={(event) => {
						event.preventDefault();
						applyText(event.clipboardData.getData('text'), 'paste');
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							commitDraft();
						}
						if (event.key === 'Escape') {
							event.preventDefault();
							cancelDraft();
						}
					}}
				/>
				<span aria-hidden>/</span>
				<input
					ref={mmRef}
					inputMode="numeric"
					maxLength={2}
					placeholder="MM"
					aria-label={`Tháng học tuần ${weekNumber}`}
					disabled={disabled}
					value={draft.mm}
					onChange={(event) => applyText(event.target.value, 'mm')}
					onPaste={(event) => {
						event.preventDefault();
						applyText(event.clipboardData.getData('text'), 'paste');
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							commitDraft();
						}
						if (event.key === 'Escape') {
							event.preventDefault();
							cancelDraft();
						}
					}}
				/>
				<span aria-hidden>/</span>
				<input
					ref={yyyyRef}
					inputMode="numeric"
					maxLength={4}
					placeholder="YYYY"
					aria-label={`Năm học tuần ${weekNumber}`}
					disabled={disabled}
					value={draft.yyyy}
					onChange={(event) => applyText(event.target.value, 'yyyy')}
					onPaste={(event) => {
						event.preventDefault();
						applyText(event.clipboardData.getData('text'), 'paste');
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							commitDraft();
						}
						if (event.key === 'Escape') {
							event.preventDefault();
							cancelDraft();
						}
					}}
				/>
				<button
					type="button"
					className="mc-session-date-calendar"
					aria-label={`Mở lịch tuần ${weekNumber}`}
					disabled={disabled}
					onClick={() => nativeRef.current && openDatePicker(nativeRef.current)}
				>
					<McIcon name="calendar_month" size={14} />
				</button>
				{value ? (
					<button
						type="button"
						className="mc-session-date-clear"
						aria-label={`Xóa ngày tuần ${weekNumber}`}
						disabled={disabled}
						onClick={() => {
							setDraft({ dd: '', mm: '', yyyy: '' });
							setError('');
							commit(null);
						}}
					>
						×
					</button>
				) : null}
			</div>
			<input
				ref={nativeRef}
				type="date"
				className="sr-only"
				tabIndex={-1}
				value={value ?? ''}
				aria-hidden
				onChange={(event) => {
					const next = event.target.value || null;
					if (next) {
						setDraft(partsFromIso(next));
						setError('');
						commit(next);
					}
				}}
			/>
			<span className="mc-session-date-status" data-tone={saveState === 'error' ? 'error' : saveState === 'saving' ? 'saving' : 'ok'}>
				{error || status || (value ? sessionDateLabel(value) : 'dd/mm/yyyy')}
			</span>
		</div>
	);
}

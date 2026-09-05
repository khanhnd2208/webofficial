'use client';

import { useId, useRef, useState } from 'react';

import { GridPopover } from './GridPopover';
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
			return true;
		} catch {
			// Native picker can reject outside a trusted gesture.
		}
	}
	return false;
}

function SessionDateEditor({
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
	const [nativeFallback, setNativeFallback] = useState(false);
	const [commitState, setCommitState] = useState<'idle' | 'saving' | 'error'>('idle');
	const attempted = useRef<string | null>(null);
	const inFlight = useRef(false);
	const cancelled = useRef(false);
	const [syncedValue, setSyncedValue] = useState(value);

	if (value !== syncedValue) {
		setSyncedValue(value);
		if (commitState === 'idle') {
			setDraft(partsFromIso(value));
			setError('');
		}
	}

	function applyText(text: string, source: 'dd' | 'mm' | 'yyyy' | 'paste') {
		cancelled.current = false;
		const compact = text.replace(/[^\d]/g, '');
		if (source === 'paste' || compact.length >= 8) {
			const parsed = parseCalendarDate(text.trim() || compact);
			if (parsed.iso) {
				setDraft(partsFromIso(parsed.iso));
				setError('');
				commit(parsed.iso);
				return;
			}
			if (source === 'paste') {
				setError(parsed.error ?? 'Ngày không hợp lệ');
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
		if (cancelled.current || inFlight.current) return;
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
		cancelled.current = true;
		if (commitState === 'idle') {
			setDraft(partsFromIso(value));
			setError('');
		}
	}

	function commit(heldOn: string | null) {
		if (inFlight.current || (heldOn === value && commitState !== 'error')) return;
		attempted.current = heldOn;
		inFlight.current = true;
		setCommitState('saving');
		void (async () => {
			try {
				await onCommit(heldOn);
				setCommitState('idle');
				setError('');
			} catch {
				setCommitState('error');
				setError('Không thể lưu ngày. Vui lòng thử lại.');
			} finally {
				inFlight.current = false;
			}
		})();
	}

	const status =
		saveState === 'saving'
			? 'Đang lưu…'
			: saveState === 'error'
				? 'Lỗi lưu ngày'
				: saveState === 'saved'
					? 'Đã lưu'
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
					aria-describedby={`${labelId}-status`}
					aria-invalid={Boolean(error)}
					aria-label={`Ngày học tuần ${weekNumber}`}
					disabled={disabled || commitState === 'saving'}
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
					aria-describedby={`${labelId}-status`}
					aria-invalid={Boolean(error)}
					aria-label={`Tháng học tuần ${weekNumber}`}
					disabled={disabled || commitState === 'saving'}
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
					aria-describedby={`${labelId}-status`}
					aria-invalid={Boolean(error)}
					aria-label={`Năm học tuần ${weekNumber}`}
					disabled={disabled || commitState === 'saving'}
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
					disabled={disabled || commitState === 'saving'}
					onClick={() => {
						if (nativeRef.current && !openDatePicker(nativeRef.current)) setNativeFallback(true);
					}}
				>
					<McIcon name="calendar_month" size={16} />
				</button>
				{value ? (
					<button
						type="button"
						className="mc-session-date-clear"
						aria-label={`Xóa ngày tuần ${weekNumber}`}
						disabled={disabled || commitState === 'saving'}
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
				disabled={disabled || commitState === 'saving'}
				type="date"
				className={nativeFallback ? 'mc-native-date' : 'sr-only'}
				tabIndex={nativeFallback ? 0 : -1}
				value={value ?? ''}
				aria-label={`Chọn ngày tuần ${weekNumber}`}
				aria-hidden={!nativeFallback}
				onChange={(event) => {
					const next = event.target.value || null;
					if (next) {
						setDraft(partsFromIso(next));
						setError('');
						commit(next);
					}
				}}
			/>
			<span
				role={error ? 'alert' : 'status'}
				id={`${labelId}-status`}
				className="mc-session-date-status"
				data-tone={saveState === 'error' ? 'error' : saveState === 'saving' ? 'saving' : 'ok'}
			>
				{error || status}
			</span>
			<button type="button" disabled={disabled || commitState === 'saving'} onClick={commitDraft}>
				Lưu ngày
			</button>
			{commitState === 'error' ? (
				<button type="button" onClick={() => commit(attempted.current)}>
					Thử lại lưu ngày
				</button>
			) : null}
		</div>
	);
}

export function SessionDateInput(props: Parameters<typeof SessionDateEditor>[0]) {
	return (
		<GridPopover
			label={`Sửa ngày tuần ${props.weekNumber}`}
			disabled={props.disabled}
			trigger={
				<>
					<McIcon name="calendar_month" size={16} />
					<span>{props.value ? sessionDateLabel(props.value) : 'Thêm ngày'}</span>
				</>
			}
		>
			<p className="mc-grid-menu-hint">Ngày học tuần {props.weekNumber}</p>
			<SessionDateEditor {...props} />
		</GridPopover>
	);
}

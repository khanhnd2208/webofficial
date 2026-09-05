'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { GridPopover } from './GridPopover';
import { McIcon } from '@/components/myclass/ui';
import { sessionDateLabel } from './attendanceLabels';
import type { GradebookSaveState } from './useGradebookMutations';

type Props = {
	weekNumber: number;
	value: string | null;
	saveState?: GradebookSaveState | 'idle';
	disabled?: boolean;
	onCommit: (heldOn: string | null) => void | Promise<void>;
};

// Calendar dates stay local; converting through UTC can shift the selected day.
function iso(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateFromIso(value: string) {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day, 12);
}

function SessionCalendar({
	value,
	weekNumber,
	disabled,
	saveState,
	onCommit,
	close,
}: Props & { close: () => void }) {
	const today = iso(new Date());
	const [focused, setFocused] = useState(value ?? today);
	const [selected, setSelected] = useState(value);
	const [month, setMonth] = useState(() => (value ?? today).slice(0, 7));
	const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
	const inFlight = useRef(false);
	const attempted = useRef<string | null>(value);
	const calendar = useRef<HTMLDivElement>(null);
	const focusRequested = useRef(false);
	const heading = useId();
	const first = dateFromIso(`${month}-01`);
	const offset = (first.getDay() + 6) % 7;
	const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
	const busy = disabled || status === 'saving' || saveState === 'saving';

	useLayoutEffect(() => {
		if (focusRequested.current) {
			calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
			focusRequested.current = false;
		}
	}, [focused, month]);

	function moveFocus(date: Date) {
		const next = iso(date);
		focusRequested.current = true;
		setMonth(next.slice(0, 7));
		setFocused(next);
	}
	function moveMonth(delta: number) {
		const next = new Date(first.getFullYear(), first.getMonth() + delta, 1, 12);
		setMonth(iso(next).slice(0, 7));
		setFocused(iso(next));
	}
	async function commit(next: string | null) {
		if (inFlight.current || busy) return;
		if (next === value && status !== 'error') {
			close();
			return;
		}
		inFlight.current = true;
		attempted.current = next;
		setSelected(next);
		setStatus('saving');
		try {
			await onCommit(next);
			close();
		} catch {
			setStatus('error');
		} finally {
			inFlight.current = false;
		}
	}

	return (
		<div className="mc-session-calendar" ref={calendar} aria-busy={status === 'saving'}>
			<p className="mc-grid-menu-hint">Ngày học tuần {weekNumber}</p>
			<div className="mc-calendar-heading">
				<button
					type="button"
					aria-label="Tháng trước"
					disabled={busy}
					onClick={() => moveMonth(-1)}
				>
					<McIcon name="chevron_left" size={18} />
				</button>
				<strong id={heading} aria-live="polite">
					Tháng {first.getMonth() + 1} / {first.getFullYear()}
				</strong>
				<button type="button" aria-label="Tháng sau" disabled={busy} onClick={() => moveMonth(1)}>
					<McIcon name="chevron_right" size={18} />
				</button>
			</div>
			<div className="mc-calendar-days" role="group" aria-labelledby={heading}>
				{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
					<span className="mc-calendar-weekday" key={day}>
						{day}
					</span>
				))}
				{Array.from({ length: offset }, (_, i) => (
					<span key={`blank-${i}`} />
				))}
				{Array.from({ length: days }, (_, i) => {
					const day = `${month}-${String(i + 1).padStart(2, '0')}`;
					return (
						<button
							type="button"
							key={day}
							data-date={day}
							data-autofocus={day === focused ? true : undefined}
							aria-label={`${i + 1}/${first.getMonth() + 1}/${first.getFullYear()}`}
							aria-pressed={selected === day}
							aria-current={day === today ? 'date' : undefined}
							tabIndex={day === focused ? 0 : -1}
							disabled={busy}
							onClick={() => void commit(day)}
							onKeyDown={(event) => {
								const date = dateFromIso(day);
								const shift = (
									{ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<
										string,
										number
									>
								)[event.key];
								if (shift !== undefined) date.setDate(date.getDate() + shift);
								else if (event.key === 'Home')
									date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
								else if (event.key === 'End')
									date.setDate(date.getDate() + 6 - ((date.getDay() + 6) % 7));
								else return;
								event.preventDefault();
								moveFocus(date);
							}}
						>
							{i + 1}
						</button>
					);
				})}
			</div>
			<div className="mc-calendar-footer">
				<button type="button" disabled={busy} onClick={() => moveFocus(dateFromIso(today))}>
					Hôm nay
				</button>
				{value || selected ? (
					<button
						type="button"
						disabled={busy}
						aria-label={`Xóa ngày tuần ${weekNumber}`}
						onClick={() => void commit(null)}
					>
						<McIcon name="close" size={16} />
						Xóa ngày
					</button>
				) : null}
			</div>
			{status === 'saving' ? <p role="status">Đang lưu…</p> : null}
			{status === 'error' ? (
				<>
					<p role="alert">Không thể lưu ngày. Vui lòng thử lại.</p>
					<button type="button" disabled={busy} onClick={() => void commit(attempted.current)}>
						Thử lại lưu ngày
					</button>
				</>
			) : null}
		</div>
	);
}

export function SessionDateInput(props: Props) {
	return (
		<GridPopover
			label={`Sửa ngày tuần ${props.weekNumber}`}
			disabled={props.disabled || props.saveState === 'saving'}
			trigger={
				<>
					<McIcon name="calendar_month" size={16} />
					<span>{props.value ? sessionDateLabel(props.value) : 'Thêm ngày'}</span>
				</>
			}
		>
			{(close) => <SessionCalendar {...props} close={close} />}
		</GridPopover>
	);
}

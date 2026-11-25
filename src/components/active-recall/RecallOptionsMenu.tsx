'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Icon } from '@/components/ui/Icon';

import { READING_SIZE_LABELS, READING_SIZES, type ReadingSize } from './readingSize';

const PRIVACY_NOTE = 'Tiến độ chỉ lưu trên trình duyệt này. Lượt học được thống kê ẩn danh.';

/**
 * Secondary study settings behind one button, on every screen size, so the
 * toolbar keeps only what a learner uses on every card.
 */
export default function RecallOptionsMenu({
	shuffled,
	onToggleShuffle,
	readingSize,
	onReadingSize,
	onPresent,
	knownCount,
	onResetProgress,
	onOpenChange,
}: {
	shuffled: boolean;
	onToggleShuffle: () => void;
	readingSize: ReadingSize;
	onReadingSize: (size: ReadingSize) => void;
	onPresent: () => void;
	knownCount: number;
	onResetProgress: () => void;
	/** Lets the card ignore the tap that only closed the menu. */
	onOpenChange?: (open: boolean, byOutsideTap: boolean) => void;
}) {
	const [open, setOpen] = useState(false);
	const [confirmReset, setConfirmReset] = useState(false);
	const menuId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const toggleRef = useRef<HTMLButtonElement>(null);

	const setMenu = (next: boolean, byOutsideTap = false) => {
		setOpen(next);
		if (!next) setConfirmReset(false);
		onOpenChange?.(next, byOutsideTap);
	};
	const setMenuRef = useRef(setMenu);
	useEffect(() => {
		setMenuRef.current = setMenu;
	});

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
			setMenuRef.current(false, true);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.stopImmediatePropagation();
			setMenuRef.current(false);
			toggleRef.current?.focus();
		};
		document.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('keydown', onKeyDown, true);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('keydown', onKeyDown, true);
		};
	}, [open]);

	return (
		<div className="recall-options-wrap" ref={rootRef}>
			<button
				ref={toggleRef}
				type="button"
				className="recall-options-toggle"
				aria-label="Tùy chọn"
				aria-expanded={open}
				aria-controls={menuId}
				onClick={() => setMenu(!open)}
			>
				<Icon name="more_horiz" size={22} aria-hidden="true" />
			</button>
			<div className="recall-options" id={menuId} data-open={open} hidden={!open}>
				<button
					type="button"
					role="switch"
					aria-checked={shuffled}
					className="recall-option-row"
					onClick={() => {
						onToggleShuffle();
						setMenu(false);
					}}
				>
					<Icon name="shuffle" size={18} aria-hidden="true" />
					<span className="recall-option-label">Xáo thứ tự thẻ</span>
					<span className="recall-option-switch" aria-hidden="true" />
				</button>

				<div className="recall-option-row is-static">
					<span className="recall-option-glyph" aria-hidden="true">
						Aa
					</span>
					<span className="recall-option-label" id={`${menuId}-size`}>
						Cỡ chữ
					</span>
					<span className="recall-size-group" role="radiogroup" aria-labelledby={`${menuId}-size`}>
						{READING_SIZES.map((size) => (
							<button
								key={size}
								type="button"
								role="radio"
								aria-checked={readingSize === size}
								className="recall-size-option"
								onClick={() => onReadingSize(size)}
							>
								{READING_SIZE_LABELS[size]}
							</button>
						))}
					</span>
				</div>

				<button
					type="button"
					className="recall-option-row"
					onClick={() => {
						setMenu(false);
						// The row hides with the menu; leaving presentation returns focus here.
						toggleRef.current?.focus();
						onPresent();
					}}
				>
					<Icon name="fullscreen" size={18} aria-hidden="true" />
					<span className="recall-option-label">Trình chiếu toàn màn hình</span>
					<kbd className="recall-option-key">F</kbd>
				</button>

				{knownCount > 0 ? (
					<button
						type="button"
						className="recall-option-row is-danger"
						onClick={() => {
							if (!confirmReset) {
								setConfirmReset(true);
								return;
							}
							onResetProgress();
							setMenu(false);
						}}
					>
						<Icon name="undo" size={18} aria-hidden="true" />
						<span className="recall-option-label">
							{confirmReset ? 'Bấm lần nữa để xoá' : `Xoá tiến độ (${knownCount} thẻ đã nhớ)`}
						</span>
					</button>
				) : null}

				<div className="recall-options-foot">
					<p className="recall-options-keys">
						<kbd>Space</kbd> lật thẻ · <kbd>1</kbd> chưa nhớ · <kbd>2</kbd> đã nhớ · <kbd>←</kbd>{' '}
						<kbd>→</kbd> chuyển thẻ
					</p>
					<p>{PRIVACY_NOTE}</p>
				</div>
			</div>
		</div>
	);
}

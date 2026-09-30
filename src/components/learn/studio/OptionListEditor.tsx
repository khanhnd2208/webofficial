'use client';

import { useRef } from 'react';

import { StudioIcon } from './icons';

const LETTERS = 'ABCDEFGH';
const MAX_OPTIONS = 8;

/** Answer options with a radio for the correct one. Enter on the last option adds another. */
export default function OptionListEditor({
	name,
	options,
	correctIndex,
	onChange,
}: {
	name: string;
	options: string[];
	correctIndex: number;
	onChange: (next: { options: string[]; correctIndex: number }) => void;
}) {
	const inputs = useRef<Array<HTMLInputElement | null>>([]);

	function setOption(index: number, text: string) {
		onChange({ options: options.map((option, i) => (i === index ? text : option)), correctIndex });
	}

	function addOption(focus = true) {
		if (options.length >= MAX_OPTIONS) return;
		onChange({ options: [...options, ''], correctIndex });
		if (focus) requestAnimationFrame(() => inputs.current[options.length]?.focus());
	}

	function removeOption(index: number) {
		if (options.length <= 2) return;
		const next = options.filter((_, i) => i !== index);
		const nextCorrect =
			index === correctIndex ? 0 : index < correctIndex ? correctIndex - 1 : correctIndex;
		onChange({ options: next, correctIndex: nextCorrect });
	}

	return (
		<div className="ln-optedit">
			{options.map((option, index) => (
				<div
					key={index}
					className="ln-optedit__row"
					data-correct={index === correctIndex ? 'true' : undefined}
				>
					<label className="ln-optedit__radio" title="Đánh dấu là đáp án đúng">
						<input
							type="radio"
							name={name}
							checked={index === correctIndex}
							onChange={() => onChange({ options, correctIndex: index })}
						/>
						<span>{LETTERS[index]}</span>
					</label>
					<input
						ref={(element) => {
							inputs.current[index] = element;
						}}
						className="ln-optedit__input"
						value={option}
						placeholder={`Phương án ${LETTERS[index]}`}
						onChange={(event) => setOption(index, event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								if (index === options.length - 1) addOption();
								else inputs.current[index + 1]?.focus();
							}
							if (event.key === 'Backspace' && !option && options.length > 2) {
								event.preventDefault();
								removeOption(index);
								requestAnimationFrame(() => inputs.current[Math.max(0, index - 1)]?.focus());
							}
						}}
					/>
					<button
						type="button"
						className="ln-icon-btn ln-optedit__remove"
						onClick={() => removeOption(index)}
						disabled={options.length <= 2}
						aria-label={`Xóa phương án ${LETTERS[index]}`}
					>
						<StudioIcon name="close" size={14} />
					</button>
				</div>
			))}
			{options.length < MAX_OPTIONS ? (
				<button type="button" className="ln-link-btn" onClick={() => addOption()}>
					+ Thêm phương án
				</button>
			) : null}
		</div>
	);
}

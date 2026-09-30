'use client';

/* ════════════════════════════════════════════════════════════════════════
   GuessWhoInput.tsx — Letter-box input for Guess Who game
   
   Architecture:
   • Each character of word.term gets a box
   • Non-alphanumeric chars (/[^a-zA-Z0-9]/g): rendered as static text
   • Alphanumeric chars: <input maxLength={1}> with ref in array
   • Auto-advance: after typing, call refs[nextIndex].focus() via DOM (no state)
   • Backspace: move to previous input via DOM ref
   • Optionally pre-fills answer (for game-over reveal)
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';

interface GuessWhoInputProps {
	term: string;
	/** External controlled values for each input character position */
	values: string[];
	onChange: (values: string[]) => void;
	disabled?: boolean;
	/** If true, fill all boxes with the correct answer (game-over reveal) */
	reveal?: boolean;
	/** Shake animation trigger */
	shake?: boolean;
}

const NON_ALPHA_RE = /[^a-zA-Z0-9]/;

export default function GuessWhoInput({
	term,
	values,
	onChange,
	disabled = false,
	reveal = false,
	shake = false,
}: GuessWhoInputProps) {
	// Build array of input refs for alphanumeric positions only
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Recompute ref array size when term changes
	useEffect(() => {
		inputRefs.current = inputRefs.current.slice(0, term.length);
	}, [term]);

	// Map character index → ref slot index (only alphanumeric chars get inputs)
	// e.g. "don't" → indices 0,1,2 are inputs; 3 is static "'"; 4 is input
	const charMeta = Array.from(term).map((ch) => ({
		ch,
		isInput: !NON_ALPHA_RE.test(ch),
	}));

	// Build a mapping from charIndex → refIndex (for alphanumeric chars)
	let refCounter = 0;
	const refIndexMap: number[] = charMeta.map(({ isInput }) => (isInput ? refCounter++ : -1));
	const totalInputs = refCounter;

	function handleChange(charIdx: number, refIdx: number, rawVal: string) {
		if (disabled || reveal) return;
		const char = rawVal.slice(-1); // take last typed char
		const newValues = [...values];
		newValues[charIdx] = char.toUpperCase();
		onChange(newValues);

		// Auto-advance: find next input ref
		if (char) {
			const nextRefIdx = refIdx + 1;
			if (nextRefIdx < totalInputs) {
				// Find charIdx of next ref
				const nextCharIdx = refIndexMap.indexOf(nextRefIdx);
				if (nextCharIdx >= 0 && inputRefs.current[nextRefIdx]) {
					inputRefs.current[nextRefIdx]!.focus();
				}
			}
		}
	}

	function handleKeyDown(
		e: React.KeyboardEvent<HTMLInputElement>,
		charIdx: number,
		refIdx: number,
	) {
		if (e.key === 'Backspace') {
			const newValues = [...values];
			if (values[charIdx]) {
				// Clear current
				newValues[charIdx] = '';
				onChange(newValues);
			} else {
				// Move to previous input
				const prevRefIdx = refIdx - 1;
				if (prevRefIdx >= 0) {
					const prevCharIdx = refIndexMap.indexOf(prevRefIdx);
					if (prevCharIdx >= 0 && inputRefs.current[prevRefIdx]) {
						inputRefs.current[prevRefIdx]!.focus();
						newValues[prevCharIdx] = '';
						onChange(newValues);
					}
				}
			}
			e.preventDefault();
		}
	}

	// Focus first input on mount / word change
	useEffect(() => {
		if (!disabled && !reveal && inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}
	}, [term, disabled, reveal]);

	return (
		<div
			className={`flex flex-wrap items-center justify-center gap-1.5 transition-all ${
				shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
			}`}
		>
			{charMeta.map(({ ch, isInput }, charIdx) => {
				const refIdx = refIndexMap[charIdx];
				const displayValue = reveal ? ch.toUpperCase() : (values[charIdx] ?? '').toUpperCase();

				if (!isInput) {
					// Static non-alphanumeric character
					return (
						<span
							key={charIdx}
							className="flex h-10 items-end justify-center pb-1 text-lg font-bold text-foreground"
							style={{ minWidth: ch === ' ' ? '1.5rem' : '0.75rem' }}
						>
							{ch}
						</span>
					);
				}

				const isFilled = displayValue.length > 0;
				return (
					<input
						key={charIdx}
						ref={(el) => {
							inputRefs.current[refIdx] = el;
						}}
						type="text"
						inputMode="text"
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="characters"
						spellCheck={false}
						maxLength={2} // allow 2 so we can take the last char
						value={displayValue}
						onChange={(e) => handleChange(charIdx, refIdx, e.target.value)}
						onKeyDown={(e) => handleKeyDown(e, charIdx, refIdx)}
						disabled={disabled || reveal}
						className={`h-10 w-9 rounded border-b-2 bg-transparent text-center text-base font-bold uppercase tracking-widest outline-none transition-all
              ${
								reveal
									? 'border-success text-success'
									: isFilled
										? 'border-accent text-foreground'
										: 'border-border text-foreground focus:border-accent'
							}
              ${disabled && !reveal ? 'opacity-60 cursor-not-allowed' : ''}
            `}
					/>
				);
			})}

			<style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
      `}</style>
		</div>
	);
}

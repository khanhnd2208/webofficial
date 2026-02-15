'use client';

import { useCallback, useRef, useState } from 'react';

/* ──────────────────────────────────────────────
   Deterministic tag color — same tag always gets
   the same color, no randomness.
   ────────────────────────────────────────────── */
const TAG_COLORS = [
	{ bg: 'bg-accent-subtle', text: 'text-accent', border: 'border-accent/20' },
	{ bg: 'bg-success-subtle', text: 'text-success', border: 'border-success/20' },
	{ bg: 'bg-warning-subtle', text: 'text-warning', border: 'border-warning/20' },
	{ bg: 'bg-surface-hover', text: 'text-foreground-secondary', border: 'border-border' },
	{ bg: 'bg-error-subtle', text: 'text-error', border: 'border-error/20' },
];

function hashTag(tag: string): number {
	let h = 0;
	for (let i = 0; i < tag.length; i++) {
		h = ((h << 5) - h + tag.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

function getTagColor(tag: string) {
	return TAG_COLORS[hashTag(tag) % TAG_COLORS.length];
}

interface TagInputProps {
	tags: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
	/** Existing tags from DB for auto-suggestions */
	suggestions?: string[];
}

export default function TagInput({ tags, onChange, placeholder = 'Nhập tag rồi ấn Tab / Enter…', suggestions = [] }: TagInputProps) {
	const [input, setInput] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const addTag = useCallback(
		(raw: string) => {
			const tag = raw.trim();
			if (!tag) return;
			if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
			onChange([...tags, tag]);
			setInput('');
			setShowSuggestions(false);
		},
		[tags, onChange]
	);

	const removeTag = useCallback(
		(index: number) => {
			onChange(tags.filter((_, i) => i !== index));
		},
		[tags, onChange]
	);

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if ((e.key === 'Tab' || e.key === 'Enter' || e.key === ',') && input.trim()) {
			e.preventDefault();
			addTag(input);
		}
		if (e.key === 'Backspace' && !input && tags.length > 0) {
			removeTag(tags.length - 1);
		}
		if (e.key === 'Escape') {
			setShowSuggestions(false);
		}
	}

	const filtered = suggestions.filter(
		(s) =>
			s.toLowerCase().includes(input.toLowerCase()) &&
			!tags.some((t) => t.toLowerCase() === s.toLowerCase())
	);

	return (
		<div className="relative">
			<div
				className="flex flex-wrap items-center gap-1.5 rounded-md border border-border-hover px-2 py-1.5 transition-colors focus-within:border-accent"
				onClick={() => inputRef.current?.focus()}
			>
				{tags.map((tag, i) => {
					const color = getTagColor(tag);
					return (
						<span
							key={tag}
							className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${color.bg} ${color.text} ${color.border}`}
						>
							{tag}
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									removeTag(i);
								}}
								className="ml-0.5 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
								aria-label={`Remove ${tag}`}
							>
								<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</span>
					);
				})}
				<input
					ref={inputRef}
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						setShowSuggestions(true);
					}}
					onKeyDown={handleKeyDown}
					onFocus={() => setShowSuggestions(true)}
					onBlur={() => {
						// Delay to allow clicking suggestions
						setTimeout(() => setShowSuggestions(false), 150);
					}}
					className="min-w-30 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted"
					placeholder={tags.length === 0 ? placeholder : ''}
				/>
			</div>

			{/* Suggestions dropdown */}
			{showSuggestions && input && filtered.length > 0 ? (
				<div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface-elevated p-1 shadow-lg">
					{filtered.slice(0, 8).map((s) => {
						const color = getTagColor(s);
						return (
							<button
								key={s}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									addTag(s);
								}}
								className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface-hover"
							>
								<span className={`inline-block h-2 w-2 rounded-full ${color.bg} ${color.border} border`} />
								{s}
							</button>
						);
					})}
				</div>
			) : null}

			<p className="mt-1 text-xs text-muted">
				Nhấn <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">Tab</kbd> hoặc{' '}
				<kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">Enter</kbd> để thêm tag.
			</p>
		</div>
	);
}

'use client';

import { useEffect, useState } from 'react';
import TagInput from '@/components/TagInput';
import type { CreateWordInput, VocabSetDTO } from '@/types/vocab';

export type EditableWord = {
	id?: string;
	term: string;
	definition: string;
	partOfSpeech: string;
	example: string;
	pronunciation: string;
	meaningEn: string;
	meaningVi: string;
	ndkExplanation: string;
	hintsHard: string[];
	hintsMedium: string[];
	hintsEasy: string[];
	_isNew?: boolean;
	_deleted?: boolean;
	_expanded?: boolean;
};

const EMPTY_WORD: EditableWord = {
	term: '',
	definition: '',
	partOfSpeech: '',
	example: '',
	pronunciation: '',
	meaningEn: '',
	meaningVi: '',
	ndkExplanation: '',
	hintsHard: [],
	hintsMedium: [],
	hintsEasy: [],
	_isNew: true,
	_deleted: false,
	_expanded: true,
};

export function wordsFromSet(set: VocabSetDTO): EditableWord[] {
	return set.words.map((word) => ({
		id: word.id,
		term: word.term,
		definition: word.definition,
		partOfSpeech: word.partOfSpeech ?? '',
		example: word.example ?? '',
		pronunciation: word.pronunciation ?? '',
		meaningEn: word.meaningEn ?? '',
		meaningVi: word.meaningVi || word.definition,
		ndkExplanation: word.ndkExplanation ?? '',
		hintsHard: word.hintsHard ?? [],
		hintsMedium: word.hintsMedium ?? [],
		hintsEasy: word.hintsEasy ?? [],
		_isNew: false,
		_deleted: false,
		_expanded: false,
	}));
}

export function toCreateWords(words: EditableWord[]): CreateWordInput[] {
	return words
		.filter((word) => !word._deleted && word.term.trim() && (word.meaningVi || word.definition || word.meaningEn).trim())
		.map((word) => ({
			term: word.term.trim(),
			definition: (word.meaningVi || word.definition).trim(),
			partOfSpeech: word.partOfSpeech.trim(),
			example: word.example.trim(),
			pronunciation: word.pronunciation.trim(),
			meaningEn: word.meaningEn.trim(),
			meaningVi: (word.meaningVi || word.definition).trim(),
			ndkExplanation: word.ndkExplanation.trim() || null,
			hintsHard: word.hintsHard,
			hintsMedium: word.hintsMedium,
			hintsEasy: word.hintsEasy,
		}));
}

export default function VocabSetEditor({
	title,
	description,
	words,
	onTitleChange,
	onDescriptionChange,
	onWordsChange,
	error,
}: {
	title: string;
	description: string;
	words: EditableWord[];
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onWordsChange: (words: EditableWord[]) => void;
	error?: string | null;
}) {
	const active = words.filter((word) => !word._deleted);
	const willDelete = words.filter((word) => word._deleted && word.id).length;

	function updateWord(index: number, field: keyof EditableWord, value: unknown) {
		onWordsChange(words.map((word, i) => (i === index ? { ...word, [field]: value } : word)));
	}

	return (
		<div className="space-y-6">
			<div className="mc-surface grid gap-4 p-4 sm:grid-cols-2">
				<label className="text-sm">
					Tên bộ từ <span className="text-error">*</span>
					<input
						name="vocab-set-title"
						value={title}
						onChange={(event) => onTitleChange(event.target.value)}
						required
						className="mt-1.5 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
					/>
				</label>
				<label className="text-sm">
					Mô tả
					<input
						value={description}
						onChange={(event) => onDescriptionChange(event.target.value)}
						className="mt-1.5 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
					/>
				</label>
			</div>
			<div>
				<div className="mb-3 flex items-center justify-between">
					<p className="mc-meta">
						{active.length} từ
						{willDelete ? <span className="ml-2 text-error">· xóa {willDelete}</span> : null}
					</p>
					<button
						type="button"
						onClick={() => onWordsChange(words.map((word) => ({ ...word, _expanded: true })))}
						className="text-xs font-semibold text-ink-secondary hover:text-ink"
					>
						Mở rộng tất cả
					</button>
				</div>
				<div className="space-y-2">
					{words.map((word, index) => (
						<WordEditorCard
							key={word.id ?? `new-${index}`}
							word={word}
							index={index}
							onUpdate={(field, value) => updateWord(index, field, value)}
							onToggleExpand={() => updateWord(index, '_expanded', !word._expanded)}
							onToggleDelete={() => updateWord(index, '_deleted', !word._deleted)}
						/>
					))}
				</div>
				<button
					type="button"
					onClick={() => onWordsChange([...words, { ...EMPTY_WORD }])}
					className="mt-4 flex min-h-11 w-full items-center justify-center rounded-[var(--mc-r-sm)] border border-dashed border-mc-rule text-sm font-semibold text-ink-secondary hover:bg-surface-sunken hover:text-ink"
				>
					Thêm từ
				</button>
			</div>
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</div>
	);
}

export function useVocabSetDraft(initial?: { title?: string; description?: string; words?: EditableWord[] }) {
	const [title, setTitle] = useState(initial?.title ?? '');
	const [description, setDescription] = useState(initial?.description ?? '');
	const [words, setWords] = useState<EditableWord[]>(initial?.words ?? [{ ...EMPTY_WORD }]);
	return { title, setTitle, description, setDescription, words, setWords };
}

export function useLoadedVocabSet(setId: string | null) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [words, setWords] = useState<EditableWord[]>([{ ...EMPTY_WORD }]);
	const [loading, setLoading] = useState(Boolean(setId));
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!setId) return;
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch(`/api/vocab-sets/${setId}`);
				const json = (await res.json()) as { ok: boolean; data?: { set: VocabSetDTO }; error?: string };
				if (!json.ok || !json.data?.set) throw new Error(json.error ?? 'Không tải được bộ từ');
				if (cancelled) return;
				setTitle(json.data.set.title);
				setDescription(json.data.set.description ?? '');
				setWords(wordsFromSet(json.data.set));
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : 'Không tải được bộ từ');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [setId]);

	return { title, setTitle, description, setDescription, words, setWords, loading, error, setError };
}

function WordEditorCard({
	word,
	index,
	onUpdate,
	onToggleExpand,
	onToggleDelete,
}: {
	word: EditableWord;
	index: number;
	onUpdate: (field: keyof EditableWord, value: unknown) => void;
	onToggleExpand: () => void;
	onToggleDelete: () => void;
}) {
	if (word._deleted) {
		return (
			<div className="flex items-center gap-3 border border-error/30 bg-error-subtle px-4 py-3">
				<p className="flex-1 text-sm text-error line-through">
					{word.term || '(từ mới)'} — {word.meaningVi || word.definition}
				</p>
				<button type="button" onClick={onToggleDelete} className="text-xs font-semibold text-ink-secondary">
					Hoàn tác
				</button>
			</div>
		);
	}

	return (
		<div className="border border-mc-rule bg-paper">
			<div className="flex items-center gap-3 px-4 py-3">
				<span className="mc-num w-6 shrink-0 text-xs text-ink-tertiary">{index + 1}</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-ink">
						{word.term || <span className="italic text-ink-tertiary">chưa nhập</span>}
						<span className="mx-2 font-normal text-ink-tertiary">—</span>
						<span className="font-normal text-ink-secondary">
							{word.meaningVi || word.definition || <span className="italic text-ink-tertiary">chưa nhập</span>}
						</span>
					</p>
				</div>
				<button type="button" onClick={onToggleExpand} className="text-xs font-semibold text-ink-secondary">
					{word._expanded ? 'Thu gọn' : 'Sửa'}
				</button>
				<button type="button" onClick={onToggleDelete} className="text-xs font-semibold text-error">
					Xóa
				</button>
			</div>
			{word._expanded ? (
				<div className="space-y-3 border-t border-mc-rule bg-surface-sunken p-4">
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="text-sm">
							Từ
							<input
								value={word.term}
								onChange={(event) => onUpdate('term', event.target.value)}
								className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
							/>
						</label>
						<label className="text-sm">
							Phiên âm
							<input
								value={word.pronunciation}
								onChange={(event) => onUpdate('pronunciation', event.target.value)}
								className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
							/>
						</label>
						<label className="text-sm">
							Nghĩa tiếng Anh
							<input
								value={word.meaningEn}
								onChange={(event) => onUpdate('meaningEn', event.target.value)}
								className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
							/>
						</label>
						<label className="text-sm">
							Nghĩa tiếng Việt
							<input
								value={word.meaningVi || word.definition}
								onChange={(event) => {
									onUpdate('meaningVi', event.target.value);
									onUpdate('definition', event.target.value);
								}}
								className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
							/>
						</label>
						<label className="text-sm">
							Từ loại
							<input
								value={word.partOfSpeech}
								onChange={(event) => onUpdate('partOfSpeech', event.target.value)}
								className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
							/>
						</label>
						<label className="text-sm">
							Ví dụ
							<input
								value={word.example}
								onChange={(event) => onUpdate('example', event.target.value)}
								className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm"
							/>
						</label>
					</div>
					<label className="block text-sm">
						Giải thích
						<textarea
							value={word.ndkExplanation}
							onChange={(event) => onUpdate('ndkExplanation', event.target.value)}
							rows={2}
							className="mt-1 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 py-2 text-sm"
						/>
					</label>
					<div className="grid gap-3 sm:grid-cols-3">
						<div>
							<p className="mb-1 text-xs font-semibold text-ink-secondary">Gợi ý khó</p>
							<TagInput tags={word.hintsHard} onChange={(value) => onUpdate('hintsHard', value)} />
						</div>
						<div>
							<p className="mb-1 text-xs font-semibold text-ink-secondary">Gợi ý vừa</p>
							<TagInput tags={word.hintsMedium} onChange={(value) => onUpdate('hintsMedium', value)} />
						</div>
						<div>
							<p className="mb-1 text-xs font-semibold text-ink-secondary">Gợi ý dễ</p>
							<TagInput tags={word.hintsEasy} onChange={(value) => onUpdate('hintsEasy', value)} />
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}

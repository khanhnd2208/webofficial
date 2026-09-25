'use client';

import { useMemo, useState, type ReactNode } from 'react';

import { compareLectureText, countPlaces } from '@/features/learn/textFidelity';

import { StudioIcon } from './icons';
import StudioDialog from './StudioDialog';
import TextDiff from './TextDiff';
import { useCopy } from './useCopy';

export default function QuestionPasteDialog({
	title,
	hint,
	placeholder,
	formatPrompt,
	composePrompt,
	text,
	onText,
	warnings,
	missingCount,
	preview,
	canAdd,
	addLabel,
	onClose,
	onAdd,
}: {
	title: string;
	hint: string;
	placeholder: string;
	formatPrompt: string;
	composePrompt?: string;
	text: string;
	onText: (value: string) => void;
	warnings: string[];
	missingCount: number;
	preview: ReactNode;
	canAdd: boolean;
	addLabel: string;
	onClose: () => void;
	onAdd: () => void;
}) {
	const [pane, setPane] = useState<'ai' | 'original'>('ai');
	const [original, setOriginal] = useState('');
	const [ackedFor, setAckedFor] = useState<string | null>(null);
	const { copied, copy } = useCopy();
	const { copied: copiedCompose, copy: copyCompose } = useCopy();
	const fidelity = useMemo(
		() => (original.trim() && text.trim() ? compareLectureText(original, text, { questions: true }) : null),
		[original, text],
	);
	const places = fidelity ? countPlaces(fidelity.hunks) : 0;
	const needsAck = places > 0 || missingCount > 0;
	// A tick covers the paste it was given for; editing either pane asks again.
	const ackKey = `${places}:${missingCount}:${text}\u0000${original}`;
	const acked = ackedFor === ackKey;

	return (
		<StudioDialog
			title={title}
			onClose={onClose}
			footer={
				<>
					{needsAck ? (
						<label className="mr-auto flex items-center gap-2 text-sm">
							<input type="checkbox" checked={acked} onChange={(event) => setAckedFor(event.target.checked ? ackKey : null)} />
							{places > 0 ? `${places} chỗ khác bản gốc` : null}
							{places > 0 && missingCount > 0 ? ' · ' : null}
							{missingCount > 0 ? `${missingCount} câu thiếu đáp án` : null}
						</label>
					) : null}
					<button type="button" className="ln-btn" onClick={onClose}>
						Hủy
					</button>
					<button type="button" className="ln-btn ln-btn--primary" disabled={!canAdd || (needsAck && !acked)} onClick={onAdd}>
						{addLabel}
					</button>
				</>
			}
		>
			<div className="ln-split">
				<div className="flex min-h-0 flex-col gap-2">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-sm text-ink-secondary">{hint}</p>
						<span className="flex gap-3">
							<button type="button" className="ln-link-btn" onClick={() => copy(formatPrompt)}>
								<StudioIcon name="copy" size={14} /> {copied ? 'Đã chép' : 'Chép prompt định dạng'}
							</button>
							{composePrompt ? (
								<button type="button" className="ln-link-btn" onClick={() => copyCompose(composePrompt)}>
									<StudioIcon name="copy" size={14} /> {copiedCompose ? 'Đã chép' : 'Chép prompt soạn câu'}
								</button>
							) : null}
						</span>
					</div>
					<div className="ln-segmented" role="radiogroup" aria-label="Nguồn dán">
						<button type="button" role="radio" aria-checked={pane === 'ai'} onClick={() => setPane('ai')}>
							Kết quả AI
						</button>
						<button type="button" role="radio" aria-checked={pane === 'original'} onClick={() => setPane('original')}>
							Bản gốc
						</button>
					</div>
					<textarea
						autoFocus
						className="ln-editor__source min-h-[18rem] flex-1"
						value={pane === 'ai' ? text : original}
						onChange={(event) => (pane === 'ai' ? onText(event.target.value) : setOriginal(event.target.value))}
						placeholder={pane === 'ai' ? placeholder : 'Dán đúng phần bạn đã đưa cho AI, để so chữ.'}
					/>
				</div>
				<div className="ln-preview">
					{warnings.map((warning) => (
						<p key={warning} className="ln-warning">
							{warning}
						</p>
					))}
					{fidelity && places > 0 ? <TextDiff hunks={fidelity.hunks} /> : null}
					{fidelity && places === 0 ? <p className="text-sm text-ink-secondary">Khớp bản gốc.</p> : null}
					{preview}
				</div>
			</div>
		</StudioDialog>
	);
}

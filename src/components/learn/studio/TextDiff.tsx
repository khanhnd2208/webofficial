import type { TextHunk } from '@/features/learn/textFidelity';

function side(words: string[]) {
	return words.join(' ');
}

/** Shared word diff: deletions struck, additions marked. Context sits on either side. */
export default function TextDiff({ hunks }: { hunks: TextHunk[] }) {
	if (!hunks.length) return null;
	return (
		<ul className="ln-diff">
			{hunks.map((hunk, index) => (
				<li key={index}>
					{hunk.before.length ? <span className="ln-diff__context">{side(hunk.before)} </span> : null}
					{hunk.kind === 'removed' ? <del>{side(hunk.words)}</del> : <ins>{side(hunk.words)}</ins>}
					{hunk.after.length ? <span className="ln-diff__context"> {side(hunk.after)}</span> : null}
				</li>
			))}
		</ul>
	);
}

'use client';

import { findImageHints } from '@/features/learn/imageHints';

function quoted(alts: string[]) {
	const names = alts
		.slice(0, 3)
		.map((alt) => `“${alt.length > 60 ? `${alt.slice(0, 57)}…` : alt}”`);
	return alts.length > 3 ? `${names.join(', ')} và ${alts.length - 3} chỗ khác` : names.join(', ');
}

/** Asks for pictures where pasted text still has a caption or "[Hình …]" note but no image slot. */
export default function ImageHintsBar({
	markdown,
	onAdd,
	disabled = false,
}: {
	markdown: string;
	onAdd: () => void;
	disabled?: boolean;
}) {
	const hints = findImageHints(markdown);
	if (!hints.length) return null;
	return (
		<div className="ln-image-picker" role="status">
			<p>
				{hints.length} chỗ có vẻ cần ảnh: {quoted(hints.map((hint) => hint.alt))} ·{' '}
				<button type="button" className="ln-link-btn" disabled={disabled} onClick={onAdd}>
					Tạo ô ảnh
				</button>
			</p>
			<p className="text-xs text-ink-secondary">
				Ô ảnh trống được đặt ngay trên chú thích, hoặc thay cho ghi chú [Hình …]. Sau đó chọn ảnh
				cho từng ô.
			</p>
		</div>
	);
}

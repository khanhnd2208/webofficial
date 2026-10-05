'use client';

import { useEffect, useRef, useState } from 'react';

import { findImageRefs, replaceImageSrcs } from '@/features/learn/images';

import { droppedImageFiles, matchImageFiles } from './imageUploadUtils';
import ImageUploadStatus from './ImageUploadStatus';
import MissingImagesBar from './MissingImagesBar';
import { useImageUploads } from './useImageUploads';

export default function ImportImagePicker({
	markdown,
	onChange,
	onBusyChange,
}: {
	markdown: string;
	onChange: (markdown: string) => void;
	onBusyChange: (busy: boolean) => void;
}) {
	const uploads = useImageUploads();
	const latest = useRef(markdown);
	useEffect(() => {
		latest.current = markdown;
	}, [markdown]);
	const [note, setNote] = useState('');
	const [reading, setReading] = useState(false);
	useEffect(() => {
		onBusyChange(reading || uploads.uploading);
	}, [reading, uploads.uploading, onBusyChange]);
	async function attach(files: File[]) {
		const { replacements, unmatched, count } = await matchImageFiles(
			findImageRefs(latest.current),
			files,
			uploads.uploadFile,
		);
		onChange(replaceImageSrcs(latest.current, replacements));
		setNote(
			`Đã gắn ${count} ảnh${unmatched.length ? ` · ${unmatched.length} file không khớp: ${unmatched.join(', ')}` : ''}`,
		);
	}
	const unresolved = findImageRefs(markdown).filter((ref) => ref.status !== 'ready');
	if (!unresolved.length && !note && !uploads.uploading && !uploads.errors.length) return null;
	return (
		<div
			className="ln-image-picker"
			onDragOver={(event) => {
				if (event.dataTransfer.types.includes('Files')) event.preventDefault();
			}}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				setReading(true);
				void droppedImageFiles(event.dataTransfer)
					.then(attach)
					.catch(() => setNote('Không đọc được thư mục ảnh. Hãy chọn các file ảnh.'))
					.finally(() => setReading(false));
			}}
		>
			<MissingImagesBar
				markdown={markdown}
				onFiles={(files) => void attach(files)}
				disabled={reading || uploads.uploading}
			/>
			{unresolved.length ? (
				<>
					<ul className="text-sm">
						{[...new Set(unresolved.map((ref) => ref.url || '(chưa có tên)'))].map((src) => (
							<li key={src}>{src}</li>
						))}
					</ul>
					<p className="ln-warning">Có thể lưu khi còn thiếu ảnh và bổ sung trong trình soạn.</p>
				</>
			) : null}
			<ImageUploadStatus uploads={uploads} />
			{note ? (
				<p role="status" className="text-sm">
					{note}
				</p>
			) : null}
		</div>
	);
}

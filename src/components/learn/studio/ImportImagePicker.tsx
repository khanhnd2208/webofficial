'use client';

import { useEffect, useRef, useState } from 'react';

import { addImageSlots, findImageHints } from '@/features/learn/imageHints';
import { findImageRefs, replaceImageSrcs } from '@/features/learn/images';

import ImageHintsBar from './ImageHintsBar';
import { droppedImageFiles, matchImageFiles, uploadImageAt } from './imageUploadUtils';
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
	function change(markdown: string) {
		latest.current = markdown;
		onChange(markdown);
	}
	async function attach(files: File[]) {
		const { replacements, unmatched, count } = await matchImageFiles(
			findImageRefs(latest.current),
			files,
			uploads.uploadFile,
		);
		change(replaceImageSrcs(latest.current, replacements));
		setNote(
			`Đã gắn ${count} ảnh${unmatched.length ? ` · ${unmatched.length} file không khớp: ${unmatched.join(', ')}` : ''}`,
		);
	}
	const images = findImageRefs(markdown);
	const hinted = findImageHints(markdown).length > 0;
	if (!images.length && !hinted && !note && !uploads.uploading && !uploads.errors.length)
		return null;
	return (
		<div
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
			<ImageHintsBar
				markdown={markdown}
				disabled={reading || uploads.uploading}
				onAdd={() => change(addImageSlots(latest.current))}
			/>
			<MissingImagesBar
				markdown={markdown}
				onFiles={(files) => void attach(files)}
				onReplace={(index, file) =>
					void uploadImageAt(index, file, () => latest.current, change, uploads.uploadFile)
				}
				disabled={reading || uploads.uploading}
			/>

			<ImageUploadStatus uploads={uploads} />
			{note ? (
				<p role="status" className="text-sm">
					{note}
				</p>
			) : null}
		</div>
	);
}

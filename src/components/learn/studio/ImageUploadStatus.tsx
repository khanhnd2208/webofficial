'use client';

import type { useImageUploads } from './useImageUploads';

export default function ImageUploadStatus({
	uploads,
}: {
	uploads: ReturnType<typeof useImageUploads>;
}) {
	return (
		<>
			{uploads.uploading ? (
				<p className="ln-editor__upload" role="status">
					Đang tải {uploads.progress.done}/{uploads.progress.total} ảnh…
				</p>
			) : null}
			{uploads.errors.length ? (
				<div className="ln-warning" role="alert">
					{uploads.errors.map((error, index) => (
						<p key={index}>{error}</p>
					))}
					<button type="button" className="ln-link-btn" onClick={uploads.dismissErrors}>
						Đóng thông báo
					</button>
				</div>
			) : null}
		</>
	);
}

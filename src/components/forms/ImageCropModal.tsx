'use client';

import { Icon } from '@/components/ui/Icon';
import { useCallback, useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
	src: string;
	aspectRatio?: number;
	onCropDone: (file: File) => void;
	onCancel: () => void;
}

function getCroppedCanvas(
	image: HTMLImageElement,
	crop: PixelCrop,
	brightness: number,
	contrast: number,
	quality = 0.9,
): Promise<File> {
	const canvas = document.createElement('canvas');
	const scaleX = image.naturalWidth / image.width;
	const scaleY = image.naturalHeight / image.height;

	canvas.width = Math.floor(crop.width * scaleX);
	canvas.height = Math.floor(crop.height * scaleY);

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('No canvas context');

	ctx.imageSmoothingQuality = 'high';
	ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
	ctx.drawImage(
		image,
		crop.x * scaleX,
		crop.y * scaleY,
		crop.width * scaleX,
		crop.height * scaleY,
		0,
		0,
		canvas.width,
		canvas.height,
	);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) return reject(new Error('Canvas export failed'));
				const file = new File([blob], `cropped-${Date.now()}.webp`, {
					type: 'image/webp',
				});
				resolve(file);
			},
			'image/webp',
			quality,
		);
	});
}

export default function ImageCropModal({
	src,
	aspectRatio,
	onCropDone,
	onCancel,
}: ImageCropModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const imgRef = useRef<HTMLImageElement | null>(null);
	const [crop, setCrop] = useState<Crop>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
	const [currentAspect] = useState<number | undefined>(aspectRatio);
	const [brightness, setBrightness] = useState(100);
	const [contrast, setContrast] = useState(100);
	const [saving, setSaving] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) dialog.showModal();
		return () => dialog?.close();
	}, []);

	const requestClose = useCallback(() => {
		if (!saving) onCancel();
	}, [onCancel, saving]);

	const onImageLoad = useCallback(
		(e: SyntheticEvent<HTMLImageElement>) => {
			const { width, height } = e.currentTarget;
			const cropW = width * 0.8;
			const cropH = currentAspect ? cropW / currentAspect : height * 0.8;
			const clampedH = Math.min(cropH, height * 0.95);
			const clampedW = currentAspect ? clampedH * currentAspect : cropW;
			const next: PixelCrop = {
				unit: 'px',
				x: (width - clampedW) / 2,
				y: (height - clampedH) / 2,
				width: clampedW,
				height: clampedH,
			};
			setCrop(next);
			setCompletedCrop(next);
		},
		[currentAspect],
	);

	async function handleSave() {
		if (!imgRef.current || !completedCrop || saving) return;
		setSaving(true);
		setExportError(null);
		try {
			const file = await getCroppedCanvas(imgRef.current, completedCrop, brightness, contrast);
			onCropDone(file);
		} catch {
			setExportError('Không xuất được ảnh. Hãy thử lại.');
		} finally {
			setSaving(false);
		}
	}

	const filterStyle = {
		filter: `brightness(${brightness}%) contrast(${contrast}%)`,
	};

	return createPortal(
		<dialog
			ref={dialogRef}
			aria-labelledby={titleId}
			className="fixed inset-0 z-100 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-4 text-foreground backdrop:bg-black/70 open:flex open:items-center open:justify-center [&::backdrop]:bg-black/70"
			onCancel={(event) => {
				event.preventDefault();
				requestClose();
			}}
		>
			<div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-lg">
				<div className="flex items-center justify-between border-b border-border px-5 py-3">
					<div>
						<h3 id={titleId} className="text-sm font-bold uppercase tracking-wider text-foreground">
							Chỉnh sửa ảnh
						</h3>
						{aspectRatio ? (
							<p className="mt-0.5 text-xs text-muted">Tỉ lệ cố định: {aspectRatio}:1</p>
						) : null}
					</div>
					<button
						type="button"
						onClick={requestClose}
						aria-label="Đóng"
						className="flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
					>
						<Icon name="close" className="h-4 w-4" />
					</button>
				</div>

				<div className="flex-1 overflow-auto p-4">
					{completedCrop && imgRef.current ? (
						<div className="mb-3 flex items-center gap-3 rounded-lg bg-surface-secondary px-3 py-2 text-xs text-muted">
							<span>📐 Kích thước xuất:</span>
							<span className="font-mono font-bold text-foreground">
								{Math.floor(
									completedCrop.width * (imgRef.current.naturalWidth / imgRef.current.width),
								)}
								{' × '}
								{Math.floor(
									completedCrop.height * (imgRef.current.naturalHeight / imgRef.current.height),
								)}
								{' px'}
							</span>
							<span className="text-muted/60">·</span>
							<span>Tỉ lệ: {(completedCrop.width / completedCrop.height).toFixed(2)} : 1</span>
						</div>
					) : null}

					<div className="flex justify-center rounded-xl bg-black/20 p-2">
						<ReactCrop
							crop={crop}
							onChange={(c) => setCrop(c)}
							onComplete={(c) => {
								if (c.width > 0 && c.height > 0) setCompletedCrop(c);
							}}
							aspect={currentAspect}
							className="max-h-[50vh]"
						>
							<img
								ref={imgRef}
								src={src}
								alt="Crop preview"
								onLoad={onImageLoad}
								className="max-h-[50vh] max-w-full"
								style={filterStyle}
								crossOrigin="anonymous"
							/>
						</ReactCrop>
					</div>

					<div className="mt-4 grid grid-cols-2 gap-4">
						<label className="block">
							<span className="text-xs font-bold uppercase tracking-wider text-muted">
								Độ sáng: {brightness}%
							</span>
							<input
								type="range"
								min={50}
								max={150}
								value={brightness}
								onChange={(e) => setBrightness(Number(e.target.value))}
								className="mt-1 w-full accent-accent"
							/>
						</label>
						<label className="block">
							<span className="text-xs font-bold uppercase tracking-wider text-muted">
								Tương phản: {contrast}%
							</span>
							<input
								type="range"
								min={50}
								max={150}
								value={contrast}
								onChange={(e) => setContrast(Number(e.target.value))}
								className="mt-1 w-full accent-accent"
							/>
						</label>
					</div>
				</div>

				{exportError ? (
					<p role="alert" className="px-5 text-xs text-error">
						{exportError}
					</p>
				) : null}

				<div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3">
					<button
						type="button"
						onClick={() => {
							setBrightness(100);
							setContrast(100);
						}}
						className="text-xs font-medium text-muted underline underline-offset-2 hover:text-foreground"
					>
						Đặt lại
					</button>
					<button
						type="button"
						onClick={requestClose}
						className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-hover"
					>
						Huỷ
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={saving || !completedCrop}
						className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
					>
						{saving ? (
							<>
								<span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
								Đang xử lý…
							</>
						) : (
							'Áp dụng'
						)}
					</button>
				</div>
			</div>
		</dialog>,
		document.body,
	);
}

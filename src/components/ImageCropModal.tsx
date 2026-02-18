'use client';

import { useCallback, useRef, useState } from 'react';
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
	const imgRef = useRef<HTMLImageElement | null>(null);
	const [crop, setCrop] = useState<Crop>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
	const [currentAspect, setCurrentAspect] = useState<number | undefined>(aspectRatio);
	const [brightness, setBrightness] = useState(100);
	const [contrast, setContrast] = useState(100);
	const [saving, setSaving] = useState(false);

	const onImageLoad = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement>) => {
			const { width, height } = e.currentTarget;
			// Default crop — 80% centered
			const cropW = width * 0.8;
			const cropH = currentAspect ? cropW / currentAspect : height * 0.8;
			const clampedH = Math.min(cropH, height * 0.95);
			const clampedW = currentAspect ? clampedH * currentAspect : cropW;
			setCrop({
				unit: 'px',
				x: (width - clampedW) / 2,
				y: (height - clampedH) / 2,
				width: clampedW,
				height: clampedH,
			});
		},
		[currentAspect],
	);

	async function handleSave() {
		if (!imgRef.current || !completedCrop) return;
		setSaving(true);
		try {
			const file = await getCroppedCanvas(imgRef.current, completedCrop);
			onCropDone(file);
		} catch {
			/* fallback — just close */
			onCancel();
		} finally {
			setSaving(false);
		}
	}

	const filterStyle = {
		filter: `brightness(${brightness}%) contrast(${contrast}%)`,
	};

	const aspectPresets: { label: string; value: number | undefined }[] = [
		{ label: 'Tự do', value: undefined },
		{ label: '16:9', value: 16 / 9 },
		{ label: '4:3', value: 4 / 3 },
		{ label: '1:1', value: 1 },
		{ label: '2:1', value: 2 },
	];

	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-lg">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-3">
					<h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
						Chỉnh sửa ảnh
					</h3>
					<button
						onClick={onCancel}
						className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Crop area */}
				<div className="flex-1 overflow-auto p-4">
					{/* Dimensions info */}
					{completedCrop && imgRef.current ? (
						<div className="mb-3 flex items-center gap-3 rounded-lg bg-surface-secondary px-3 py-2 text-xs text-muted">
							<span>📐 Kích thước xuất:</span>
							<span className="font-mono font-bold text-foreground">
								{Math.floor(completedCrop.width * (imgRef.current.naturalWidth / imgRef.current.width))}
								{' × '}
								{Math.floor(completedCrop.height * (imgRef.current.naturalHeight / imgRef.current.height))}
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
							onComplete={(c) => setCompletedCrop(c)}
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

					{/* Aspect ratio presets */}
					<div className="mt-4 flex flex-wrap items-center gap-2">
						<span className="text-[11px] font-bold uppercase tracking-wider text-muted">Tỉ lệ:</span>
						{aspectPresets.map((p) => (
							<button
								key={p.label}
								onClick={() => setCurrentAspect(p.value)}
								className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
									currentAspect === p.value
										? 'bg-accent text-accent-foreground'
										: 'bg-surface-hover text-foreground-secondary hover:bg-surface-active'
								}`}
							>
								{p.label}
							</button>
						))}
					</div>

					{/* Adjustments */}
					<div className="mt-4 grid grid-cols-2 gap-4">
						<label className="block">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted">
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
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted">
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

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3">
					<button
						onClick={() => {
							setBrightness(100);
							setContrast(100);
							setCurrentAspect(aspectRatio);
						}}
						className="text-xs font-medium text-muted underline underline-offset-2 hover:text-foreground"
					>
						Đặt lại
					</button>
					<button
						onClick={onCancel}
						className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-hover"
					>
						Huỷ
					</button>
					<button
						onClick={handleSave}
						disabled={saving || !completedCrop}
						className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
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
		</div>
	);
}

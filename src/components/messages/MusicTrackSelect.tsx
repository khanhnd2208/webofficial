'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import type { MusicTrackDTO } from '@/types/messageMusic';

interface MusicTrackSelectProps {
	value: string;
	onChange: (value: string) => void;
}

export default function MusicTrackSelect({ value, onChange }: MusicTrackSelectProps) {
	const { confirm, dialog } = useAdminConfirm();
	const audioRef = useRef<HTMLAudioElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const [tracks, setTracks] = useState<MusicTrackDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [label, setLabel] = useState('');
	const [error, setError] = useState('');
	const [playing, setPlaying] = useState(false);

	const selected = tracks.find((t) => t.url === value || t.id === value);

	const loadTracks = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const res = await fetch('/api/messages/music', { credentials: 'same-origin' });
			const json = (await res.json()) as { ok?: boolean; error?: string; data?: MusicTrackDTO[] };
			if (!res.ok || !json.ok || !json.data) {
				throw new Error(json.error ?? `Không tải được danh sách nhạc (${res.status})`);
			}
			setTracks(json.data);
		} catch (e) {
			setTracks([]);
			setError(e instanceof Error ? e.message : 'Không tải được danh sách nhạc');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadTracks();
	}, [loadTracks]);

	const handlePreview = async () => {
		if (!audioRef.current || !selected) return;
		setError('');
		try {
			audioRef.current.currentTime = 0;
			await audioRef.current.play();
			setPlaying(true);
		} catch {
			setError('Không thể phát nhạc. Hãy thử lại.');
		}
	};

	const handleUpload = async (file: File) => {
		setUploading(true);
		setError('');
		try {
			const fd = new FormData();
			fd.append('file', file);
			if (label.trim()) fd.append('label', label.trim());
			const res = await fetch('/api/messages/music/upload', {
				method: 'POST',
				body: fd,
				credentials: 'same-origin',
			});
			const json = (await res.json()) as { ok?: boolean; error?: string; data?: MusicTrackDTO };
			if (!res.ok || !json.ok || !json.data) {
				throw new Error(json.error ?? 'Upload thất bại');
			}
			await loadTracks();
			onChange(json.data.url);
			setLabel('');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Upload thất bại');
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = '';
		}
	};

	const handleDelete = async (track: MusicTrackDTO) => {
		if (!track.canDelete || track.source !== 'upload') return;
		const ok = await confirm({
			title: 'Xóa nhạc',
			description: `Xóa "${track.label}"?`,
			confirmLabel: 'Xóa',
		});
		if (!ok) return;
		setError('');
		try {
			const res = await fetch(`/api/messages/music/${track.id}`, {
				method: 'DELETE',
				credentials: 'same-origin',
			});
			const json = (await res.json()) as { ok?: boolean; error?: string };
			if (!res.ok || !json.ok) throw new Error(json.error ?? 'Xóa thất bại');
			if (value === track.url) onChange('');
			await loadTracks();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Xóa thất bại');
		}
	};

	const presets = tracks.filter((t) => t.source === 'preset');
	const globals = tracks.filter((t) => t.source === 'global');
	const uploads = tracks.filter((t) => t.source === 'upload');

	return (
		<>
			<div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
				<div className="flex items-center justify-between gap-3">
					<label className="text-xs font-semibold uppercase tracking-wider text-muted">
						Nhạc nền
					</label>
					<button
						type="button"
						onClick={() => void loadTracks()}
						disabled={loading}
						className="text-xs text-accent hover:underline disabled:opacity-50"
					>
						Làm mới
					</button>
				</div>

				<select
					value={value}
					disabled={loading}
					onChange={(e) => {
						setError('');
						setPlaying(false);
						onChange(e.target.value);
					}}
					className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
				>
					<option value="">{loading ? 'Đang tải danh sách nhạc...' : 'Không dùng nhạc nền'}</option>
					{presets.length > 0 && (
						<optgroup label="Nhạc có sẵn">
							{presets.map((t) => (
								<option key={t.id} value={t.url}>
									{t.label}
								</option>
							))}
						</optgroup>
					)}
					{globals.length > 0 && (
						<optgroup label="Thư viện nhạc (public/music)">
							{globals.map((t) => (
								<option key={t.id} value={t.url}>
									{t.label}
								</option>
							))}
						</optgroup>
					)}
					{uploads.length > 0 && (
						<optgroup label="Nhạc của bạn">
							{uploads.map((t) => (
								<option key={t.id} value={t.url}>
									{t.label}
								</option>
							))}
						</optgroup>
					)}
				</select>

				{!loading && tracks.length > 0 && (
					<p className="text-xs text-muted">{tracks.length} bài trong thư viện</p>
				)}

				{selected && (
					<>
						<audio
							key={selected.url}
							ref={audioRef}
							src={selected.url}
							preload="metadata"
							onEnded={() => setPlaying(false)}
							onError={() => setError(`Không tải được: ${selected.label}`)}
						/>
						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								onClick={() => void handlePreview()}
								className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
							>
								{playing ? 'Đang phát...' : 'Nghe thử'}
							</button>
							{selected.canDelete && (
								<button
									type="button"
									onClick={() => void handleDelete(selected)}
									className="rounded-lg border border-error/30 px-3 py-2 text-sm text-error transition hover:bg-error/5"
								>
									Xóa
								</button>
							)}
						</div>
					</>
				)}

				<div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4">
					<p className="text-sm font-medium text-foreground">Tải nhạc MP3 lên</p>
					<p className="mt-1 text-xs text-muted">
						File sẽ xuất hiện trong mục &quot;Nhạc của bạn&quot;. Tối đa 15MB.
					</p>
					<input
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="Tên hiển thị (tùy chọn)"
						className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
					/>
					<input
						ref={fileRef}
						type="file"
						accept="audio/mpeg,audio/mp3,.mp3"
						className="hidden"
						disabled={uploading}
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) void handleUpload(file);
						}}
					/>
					<button
						type="button"
						disabled={uploading}
						onClick={() => fileRef.current?.click()}
						className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
					>
						{uploading ? 'Đang tải lên...' : 'Chọn file MP3 và tải lên'}
					</button>
				</div>

				{error && (
					<p className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
						{error}
					</p>
				)}
			</div>
			{dialog}
		</>
	);
}

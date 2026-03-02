'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════
   Lucky Card — Magical Tools
   
   A gamified card-flipping tool for admin.
   • Upload CSV/Excel to populate card contents
   • Cards stay face-down until flipped
   • State persists in localStorage until explicit reset
   • Rich 3D flip + particle animations via framer-motion
   ═══════════════════════════════════════════════════════ */

// ─── Types ──────────────────────────────────────────────
interface CardData {
	id: string;
	content: string;
	flipped: boolean;
}

interface LuckyCardState {
	cards: CardData[];
	title: string;
	createdAt: string;
}

const STORAGE_KEY = 'admin_lucky_card_state';

// ─── Sparkle Particle Component ─────────────────────────
function Sparkles({ count = 12 }: { count?: number }) {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{Array.from({ length: count }).map((_, i) => {
				const angle = (360 / count) * i;
				const distance = 60 + Math.random() * 80;
				const size = 4 + Math.random() * 6;
				const duration = 0.5 + Math.random() * 0.4;
				const delay = Math.random() * 0.15;
				const colors = ['#FFD700', '#FF6B35', '#FF1493', '#00CED1', '#7B68EE', '#FF4500', '#32CD32'];
				const color = colors[i % colors.length];

				return (
					<motion.div
						key={i}
						className="absolute left-1/2 top-1/2 rounded-full"
						style={{
							width: size,
							height: size,
							backgroundColor: color,
							boxShadow: `0 0 ${size * 2}px ${color}`,
						}}
						initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
						animate={{
							x: Math.cos((angle * Math.PI) / 180) * distance,
							y: Math.sin((angle * Math.PI) / 180) * distance,
							scale: [0, 1.5, 0],
							opacity: [1, 1, 0],
						}}
						transition={{ duration, delay, ease: 'easeOut' }}
					/>
				);
			})}
		</div>
	);
}

// ─── Star burst on flip ─────────────────────────────────
function StarBurst() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{Array.from({ length: 6 }).map((_, i) => {
				const angle = (360 / 6) * i + Math.random() * 30;
				const distance = 40 + Math.random() * 50;
				return (
					<motion.div
						key={i}
						className="absolute left-1/2 top-1/2 text-lg"
						initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
						animate={{
							x: Math.cos((angle * Math.PI) / 180) * distance,
							y: Math.sin((angle * Math.PI) / 180) * distance,
							scale: [0, 1.2, 0],
							opacity: [1, 1, 0],
							rotate: Math.random() * 360,
						}}
						transition={{ duration: 0.6, ease: 'easeOut', delay: Math.random() * 0.1 }}
					>
						{['⭐', '✨', '💫', '🌟', '⚡', '🎉'][i]}
					</motion.div>
				);
			})}
		</div>
	);
}

// ─── Single Card Component ──────────────────────────────
function LuckyCardItem({
	card,
	index,
	onFlip,
}: {
	card: CardData;
	index: number;
	onFlip: (id: string) => void;
}) {
	const [showSparkle, setShowSparkle] = useState(false);
	const [justFlipped, setJustFlipped] = useState(false);

	const handleFlip = () => {
		if (card.flipped) return;
		setShowSparkle(true);
		setJustFlipped(true);
		onFlip(card.id);
		setTimeout(() => setShowSparkle(false), 800);
		setTimeout(() => setJustFlipped(false), 1200);
	};

	// Card pattern colors
	const patterns = [
		{ bg: 'from-violet-600 via-purple-600 to-indigo-700', glow: 'shadow-purple-500/30' },
		{ bg: 'from-rose-600 via-pink-600 to-fuchsia-700', glow: 'shadow-rose-500/30' },
		{ bg: 'from-amber-500 via-orange-500 to-red-600', glow: 'shadow-amber-500/30' },
		{ bg: 'from-emerald-500 via-teal-500 to-cyan-600', glow: 'shadow-emerald-500/30' },
		{ bg: 'from-blue-500 via-indigo-500 to-violet-600', glow: 'shadow-blue-500/30' },
		{ bg: 'from-pink-500 via-rose-500 to-orange-500', glow: 'shadow-pink-500/30' },
	];
	const pattern = patterns[index % patterns.length];

	return (
		<motion.div
			className="relative"
			initial={{ opacity: 0, y: 30, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
		>
			{/* Sparkle effects */}
			<AnimatePresence>
				{showSparkle && (
					<>
						<Sparkles count={16} />
						<StarBurst />
					</>
				)}
			</AnimatePresence>

			{/* Glow ring on flip */}
			{justFlipped && (
				<motion.div
					className={`absolute -inset-2 rounded-3xl bg-gradient-to-r ${pattern.bg} blur-xl`}
					initial={{ opacity: 0.6 }}
					animate={{ opacity: 0 }}
					transition={{ duration: 1.2 }}
				/>
			)}

			<div
				onClick={handleFlip}
				className={`relative cursor-pointer select-none ${card.flipped ? '' : 'active:scale-95'}`}
				style={{ perspective: '1200px' }}
			>
				<motion.div
					className="relative w-full"
					style={{ transformStyle: 'preserve-3d' }}
					animate={{ rotateY: card.flipped ? 180 : 0 }}
					transition={{
						duration: 0.7,
						ease: [0.23, 1, 0.32, 1], // custom spring-like ease
					}}
				>
					{/* ── FRONT FACE (Face down / Mystery) ── */}
					<div
						className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${pattern.bg} p-1 shadow-xl ${pattern.glow} transition-shadow hover:shadow-2xl`}
						style={{ backfaceVisibility: 'hidden' }}
					>
						<div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center rounded-xl bg-black/20 backdrop-blur-sm">
							{/* Decorative pattern */}
							<div className="absolute inset-4 rounded-lg border border-white/20" />
							<div className="absolute inset-6 rounded-md border border-white/10" />
							
							{/* Center symbol */}
							<motion.div
								className="relative z-10 text-5xl sm:text-6xl"
								animate={{
									rotate: [0, 5, -5, 0],
									scale: [1, 1.05, 1],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: 'easeInOut',
								}}
							>
								🃏
							</motion.div>
							
							{/* Shimmer effect */}
							<motion.div
								className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
								animate={{ x: ['-200%', '200%'] }}
								transition={{
									duration: 2.5,
									repeat: Infinity,
									ease: 'easeInOut',
									repeatDelay: 1,
								}}
							/>

							{/* Card number */}
							<div className="absolute bottom-3 left-0 right-0 text-center">
								<span className="text-xs font-bold text-white/50 tracking-widest uppercase">
									Card #{index + 1}
								</span>
							</div>

							{/* Corner decorations */}
							<div className="absolute top-3 left-3 text-white/30 text-lg">✦</div>
							<div className="absolute top-3 right-3 text-white/30 text-lg">✦</div>
							<div className="absolute bottom-8 left-3 text-white/30 text-lg">✦</div>
							<div className="absolute bottom-8 right-3 text-white/30 text-lg">✦</div>

							{/* Tap hint */}
							<motion.p
								className="absolute bottom-12 text-[10px] font-bold uppercase tracking-widest text-white/40"
								animate={{ opacity: [0.3, 0.7, 0.3] }}
								transition={{ duration: 2, repeat: Infinity }}
							>
								Tap to reveal
							</motion.p>
						</div>
					</div>

					{/* ── BACK FACE (Content revealed) ── */}
					<div
						className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-border bg-surface-elevated shadow-xl"
						style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
					>
						<div className="flex aspect-[3/4] w-full flex-col items-center justify-center p-5">
							{/* Top decoration */}
							<div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />

							{/* Revealed badge */}
							<motion.div
								className="absolute top-3 right-3"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
							>
								<span className="text-lg">🎉</span>
							</motion.div>

							{/* Content */}
							<motion.div
								className="text-center"
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.3, duration: 0.4 }}
							>
								<p className="text-base sm:text-lg font-bold text-foreground leading-relaxed whitespace-pre-wrap break-words">
									{card.content}
								</p>
							</motion.div>

							{/* Card number at bottom */}
							<div className="absolute bottom-3 left-0 right-0 text-center">
								<span className="text-[10px] font-bold text-muted/50 tracking-widest uppercase">
									#{index + 1}
								</span>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
}

// ─── CSV/Excel Parser ───────────────────────────────────
function parseCSVContent(text: string): string[] {
	const lines = text
		.replace(/^\uFEFF/, '') // BOM
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);

	// If single column, each line is a card content
	// If multi-column, take the first column as content
	const results: string[] = [];
	for (const line of lines) {
		// Skip header-like first line if it looks like a header
		if (results.length === 0 && /^(content|nội dung|card|thẻ|stt|no|#)/i.test(line)) continue;
		// Simple CSV parse — handle quoted fields
		const match = line.match(/^"([^"]*)"/) || line.match(/^([^,\t]*)/);
		if (match && match[1].trim()) {
			results.push(match[1].trim());
		}
	}
	return results;
}

async function parseExcelFile(file: File): Promise<string[]> {
	// Dynamic import SheetJS
	const XLSX = await import('xlsx');
	const buffer = await file.arrayBuffer();
	const wb = XLSX.read(buffer, { type: 'array' });
	const ws = wb.Sheets[wb.SheetNames[0]];
	const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

	const results: string[] = [];
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		if (!row || row.length === 0) continue;
		// Skip header row
		if (i === 0 && /^(content|nội dung|card|thẻ|stt|no|#)/i.test(String(row[0]))) continue;
		// Take first non-empty cell
		const val = row.find((cell) => cell != null && String(cell).trim() !== '');
		if (val) results.push(String(val).trim());
	}
	return results;
}

// ─── Setup Modal ────────────────────────────────────────
function SetupModal({
	onSetup,
	onClose,
}: {
	onSetup: (cards: string[], title: string) => void;
	onClose: () => void;
}) {
	const [title, setTitle] = useState('Lucky Card');
	const [mode, setMode] = useState<'manual' | 'upload'>('upload');
	const [manualCount, setManualCount] = useState(6);
	const [manualCards, setManualCards] = useState<string[]>(Array(6).fill(''));
	const [uploadedCards, setUploadedCards] = useState<string[]>([]);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleManualCountChange = (count: number) => {
		const clamped = Math.max(1, Math.min(50, count));
		setManualCount(clamped);
		setManualCards((prev) => {
			if (clamped > prev.length) return [...prev, ...Array(clamped - prev.length).fill('')];
			return prev.slice(0, clamped);
		});
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		setError('');

		try {
			const ext = file.name.split('.').pop()?.toLowerCase();
			let contents: string[];

			if (ext === 'csv' || ext === 'txt') {
				const text = await file.text();
				contents = parseCSVContent(text);
			} else if (ext === 'xlsx' || ext === 'xls') {
				contents = await parseExcelFile(file);
			} else {
				throw new Error('Chỉ hỗ trợ file .csv, .txt, .xlsx, .xls');
			}

			if (contents.length === 0) throw new Error('Không tìm thấy nội dung trong file');
			setUploadedCards(contents);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi khi đọc file');
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = () => {
		const cards = mode === 'upload' ? uploadedCards : manualCards.filter((c) => c.trim());
		if (cards.length === 0) {
			setError('Vui lòng nhập nội dung cho ít nhất 1 thẻ');
			return;
		}
		onSetup(cards, title);
	};

	return (
		<motion.div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			<motion.div
				className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl"
				initial={{ scale: 0.9, y: 20 }}
				animate={{ scale: 1, y: 0 }}
				exit={{ scale: 0.9, y: 20 }}
			>
				{/* Close */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
				>
					✕
				</button>

				{/* Header */}
				<div className="mb-6">
					<div className="flex items-center gap-2 mb-1">
						<span className="text-2xl">🃏</span>
						<h2 className="text-xl font-black text-foreground">Thiết lập Lucky Card</h2>
					</div>
					<p className="text-sm text-muted">Tạo bộ thẻ may mắn — mỗi thẻ ẩn một nội dung bí mật!</p>
				</div>

				{/* Title */}
				<div className="mb-5">
					<label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">
						Tiêu đề
					</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="VD: Bốc thăm may mắn..."
						className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none transition-colors"
					/>
				</div>

				{/* Mode tabs */}
				<div className="mb-5">
					<div className="flex gap-1 rounded-xl bg-surface p-1">
						{(['upload', 'manual'] as const).map((m) => (
							<button
								key={m}
								onClick={() => setMode(m)}
								className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
									mode === m
										? 'bg-foreground text-background shadow-sm'
										: 'text-muted hover:text-foreground'
								}`}
							>
								{m === 'upload' ? '📁 Upload File' : '✏️ Nhập tay'}
							</button>
						))}
					</div>
				</div>

				{/* Upload mode */}
				{mode === 'upload' && (
					<div className="space-y-4">
						<div
							onClick={() => fileInputRef.current?.click()}
							className="group cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-accent hover:bg-accent-subtle/30"
						>
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv,.txt,.xlsx,.xls"
								onChange={handleFileUpload}
								className="hidden"
							/>
							<div className="text-3xl mb-2">
								{uploading ? '⏳' : uploadedCards.length > 0 ? '✅' : '📄'}
							</div>
							<p className="text-sm font-bold text-foreground">
								{uploading
									? 'Đang đọc file...'
									: uploadedCards.length > 0
									? `Đã tải ${uploadedCards.length} thẻ`
									: 'Click để chọn file'}
							</p>
							<p className="mt-1 text-xs text-muted">
								Hỗ trợ: .csv, .txt, .xlsx, .xls — Mỗi dòng/ô = 1 thẻ
							</p>
						</div>

						{/* Preview uploaded cards */}
						{uploadedCards.length > 0 && (
							<div className="rounded-xl border border-border bg-surface p-4">
								<p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
									Xem trước ({uploadedCards.length} thẻ)
								</p>
								<div className="max-h-40 overflow-y-auto space-y-1">
									{uploadedCards.map((c, i) => (
										<div
											key={i}
											className="flex items-center gap-2 rounded-lg bg-surface-hover px-3 py-1.5 text-sm"
										>
											<span className="text-xs font-bold text-muted w-6">#{i + 1}</span>
											<span className="text-foreground truncate">{c}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Manual mode */}
				{mode === 'manual' && (
					<div className="space-y-4">
						<div>
							<label className="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">
								Số lượng thẻ
							</label>
							<input
								type="number"
								min={1}
								max={50}
								value={manualCount}
								onChange={(e) => handleManualCountChange(parseInt(e.target.value) || 1)}
								className="w-24 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
							/>
						</div>

						<div className="max-h-60 overflow-y-auto space-y-2 pr-1">
							{manualCards.map((val, i) => (
								<div key={i} className="flex items-center gap-2">
									<span className="text-xs font-bold text-muted w-8 shrink-0">#{i + 1}</span>
									<input
										type="text"
										value={val}
										onChange={(e) => {
											const next = [...manualCards];
											next[i] = e.target.value;
											setManualCards(next);
										}}
										placeholder={`Nội dung thẻ ${i + 1}...`}
										className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:border-accent focus:outline-none transition-colors"
									/>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="mt-4 rounded-lg bg-error-subtle border border-error/20 px-4 py-2.5 text-sm text-error font-medium">
						{error}
					</div>
				)}

				{/* Actions */}
				<div className="mt-6 flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-sm font-bold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
					>
						Huỷ
					</button>
					<button
						onClick={handleSubmit}
						className="flex-1 rounded-xl bg-foreground py-2.5 text-sm font-black text-background hover:bg-foreground/90 transition-colors"
					>
						🎴 Tạo bộ thẻ
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
}

// ─── Confetti on all cards flipped ──────────────────────
function CelebrationOverlay({ onDone }: { onDone: () => void }) {
	useEffect(() => {
		const timer = setTimeout(onDone, 3000);
		return () => clearTimeout(timer);
	}, [onDone]);

	const confettiPieces = Array.from({ length: 40 }).map((_, i) => ({
		id: i,
		x: Math.random() * 100,
		delay: Math.random() * 0.5,
		duration: 1.5 + Math.random() * 1.5,
		emoji: ['🎉', '🎊', '✨', '⭐', '🌟', '💫', '🎆', '🎇', '🥳'][i % 9],
		size: 16 + Math.random() * 20,
	}));

	return (
		<motion.div
			className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
			initial={{ opacity: 1 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			{confettiPieces.map((p) => (
				<motion.div
					key={p.id}
					className="absolute"
					style={{ left: `${p.x}%`, top: -30, fontSize: p.size }}
					initial={{ y: -50, rotate: 0, opacity: 1 }}
					animate={{
						y: window.innerHeight + 50,
						rotate: Math.random() * 720 - 360,
						opacity: [1, 1, 0],
					}}
					transition={{
						duration: p.duration,
						delay: p.delay,
						ease: 'easeIn',
					}}
				>
					{p.emoji}
				</motion.div>
			))}

			{/* Center text */}
			<motion.div
				className="absolute inset-0 flex items-center justify-center"
				initial={{ scale: 0, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0, opacity: 0 }}
				transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
			>
				<div className="rounded-2xl bg-surface-elevated/95 backdrop-blur-md border border-border px-8 py-5 text-center shadow-2xl">
					<div className="text-4xl mb-2">🎉</div>
					<p className="text-lg font-black text-foreground">Tất cả thẻ đã được lật!</p>
					<p className="text-sm text-muted mt-1">Chúc mừng bạn!</p>
				</div>
			</motion.div>
		</motion.div>
	);
}

// ─── Main Page Component ────────────────────────────────
export default function LuckyCardPage() {
	const [state, setState] = useState<LuckyCardState | null>(null);
	const [showSetup, setShowSetup] = useState(false);
	const [showCelebration, setShowCelebration] = useState(false);
	const [loaded, setLoaded] = useState(false);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as LuckyCardState;
				if (parsed.cards && parsed.cards.length > 0) {
					setState(parsed);
				}
			}
		} catch {
			/* corrupted data, ignore */
		}
		setLoaded(true);
	}, []);

	// Save to localStorage on every state change
	useEffect(() => {
		if (!loaded) return;
		if (state) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	}, [state, loaded]);

	const handleSetup = useCallback((contents: string[], title: string) => {
		const cards: CardData[] = contents.map((content, i) => ({
			id: `card_${Date.now()}_${i}`,
			content,
			flipped: false,
		}));
		setState({ cards, title, createdAt: new Date().toISOString() });
		setShowSetup(false);
	}, []);

	const handleFlip = useCallback((id: string) => {
		setState((prev) => {
			if (!prev) return prev;
			const updated = {
				...prev,
				cards: prev.cards.map((c) => (c.id === id ? { ...c, flipped: true } : c)),
			};
			// Check if all flipped
			if (updated.cards.every((c) => c.flipped)) {
				setTimeout(() => setShowCelebration(true), 600);
			}
			return updated;
		});
	}, []);

	const handleReset = useCallback(() => {
		setState(null);
		setShowCelebration(false);
	}, []);

	const handleShuffle = useCallback(() => {
		setState((prev) => {
			if (!prev) return prev;
			// Only shuffle un-flipped cards positions (re-shuffle all)
			const shuffled = [...prev.cards];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			return { ...prev, cards: shuffled };
		});
	}, []);

	const handleFlipAll = useCallback(() => {
		setState((prev) => {
			if (!prev) return prev;
			const allFlipped = prev.cards.every((c) => c.flipped);
			if (allFlipped) return prev;
			const updated = {
				...prev,
				cards: prev.cards.map((c) => ({ ...c, flipped: true })),
			};
			setTimeout(() => setShowCelebration(true), 600);
			return updated;
		});
	}, []);

	const flippedCount = state?.cards.filter((c) => c.flipped).length ?? 0;
	const totalCount = state?.cards.length ?? 0;

	if (!loaded) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<motion.div
					className="text-4xl"
					animate={{ rotate: 360 }}
					transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
				>
					🃏
				</motion.div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-2 text-sm text-muted mb-3">
					<Link href="/admin/tools" className="hover:text-foreground transition-colors">
						Magical Tools
					</Link>
					<span>/</span>
					<span className="text-foreground font-medium">Lucky Card</span>
				</div>

				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<motion.span
							className="text-3xl"
							animate={{ rotate: [0, 10, -10, 0] }}
							transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
						>
							🃏
						</motion.span>
						<div>
							<h1 className="text-2xl font-black tracking-tight text-foreground">
								{state?.title || 'Lucky Card'}
							</h1>
							<p className="text-sm text-muted">
								{state
									? `${flippedCount}/${totalCount} thẻ đã lật`
									: 'Tạo bộ thẻ may mắn để bắt đầu!'}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						{state && (
							<>
								<button
									onClick={handleShuffle}
									className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-foreground hover:bg-surface-hover transition-colors"
								>
									🔀 Xáo trộn
								</button>
								<button
									onClick={handleFlipAll}
									disabled={flippedCount === totalCount}
									className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-foreground hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
								>
									🔄 Lật tất cả
								</button>
								<button
									onClick={handleReset}
									className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
								>
									🗑️ Reset
								</button>
							</>
						)}
						{!state && (
							<button
								onClick={() => setShowSetup(true)}
								className="flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-2.5 text-sm font-black text-background hover:bg-foreground/90 transition-colors"
							>
								✨ Tạo bộ thẻ mới
							</button>
						)}
					</div>
				</div>

				{/* Progress bar */}
				{state && (
					<div className="mt-4">
						<div className="h-2 rounded-full bg-surface overflow-hidden border border-border">
							<motion.div
								className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
								initial={{ width: 0 }}
								animate={{ width: `${totalCount > 0 ? (flippedCount / totalCount) * 100 : 0}%` }}
								transition={{ duration: 0.5, ease: 'easeOut' }}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Card Grid */}
			{state && state.cards.length > 0 && (
				<motion.div
					className="grid gap-4 sm:gap-5 lg:gap-6"
					style={{
						gridTemplateColumns: `repeat(auto-fill, minmax(${
							totalCount <= 4 ? '200px' : totalCount <= 9 ? '180px' : '160px'
						}, 1fr))`,
					}}
					layout
				>
					{state.cards.map((card, i) => (
						<LuckyCardItem key={card.id} card={card} index={i} onFlip={handleFlip} />
					))}
				</motion.div>
			)}

			{/* Empty state */}
			{!state && (
				<motion.div
					className="flex flex-col items-center justify-center py-20"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<div className="relative mb-6">
						<motion.div
							className="text-7xl"
							animate={{
								y: [0, -10, 0],
								rotate: [0, 5, -5, 0],
							}}
							transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
						>
							🃏
						</motion.div>
						<motion.div
							className="absolute -top-2 -right-3 text-2xl"
							animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
							transition={{ duration: 2, repeat: Infinity }}
						>
							✨
						</motion.div>
					</div>
					<h2 className="text-xl font-black text-foreground mb-2">Chưa có bộ thẻ nào</h2>
					<p className="text-sm text-muted mb-6 text-center max-w-sm">
						Tạo bộ thẻ may mắn bằng cách nhập nội dung thủ công hoặc upload file Excel/CSV
					</p>
					<button
						onClick={() => setShowSetup(true)}
						className="flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-black text-background hover:bg-foreground/90 transition-all hover:-translate-y-0.5 hover:shadow-lg"
					>
						<span className="text-lg">✨</span>
						Tạo bộ thẻ mới
					</button>
				</motion.div>
			)}

			{/* Setup Modal */}
			<AnimatePresence>
				{showSetup && (
					<SetupModal onSetup={handleSetup} onClose={() => setShowSetup(false)} />
				)}
			</AnimatePresence>

			{/* Celebration */}
			<AnimatePresence>
				{showCelebration && <CelebrationOverlay onDone={() => setShowCelebration(false)} />}
			</AnimatePresence>
		</div>
	);
}

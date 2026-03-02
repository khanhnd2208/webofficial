'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const STORAGE_KEY = 'admin_lucky_card_state';
const CARD_BACK_IMG = '/uploads/lucky-card-back.jpg';

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
            style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 ${size * 2}px ${color}` }}
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

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
    >
      <AnimatePresence>
        {showSparkle && (
          <>
            <Sparkles count={16} />
            <StarBurst />
          </>
        )}
      </AnimatePresence>

      {justFlipped && (
        <motion.div
          className="absolute -inset-3 rounded-3xl blur-2xl"
          style={{ background: 'radial-gradient(ellipse, #d4a830 0%, #c8973a 40%, transparent 70%)' }}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.4 }}
        />
      )}

      <div
        onClick={handleFlip}
        className={`relative select-none ${card.flipped ? 'cursor-default' : 'cursor-pointer'}`}
        style={{ perspective: '1400px' }}
      >
        <motion.div
          className="relative w-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: card.flipped ? 180 : 0 }}
          transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
          whileHover={!card.flipped ? { rotateY: 12, scale: 1.03 } : {}}
        >
          {/* FRONT FACE — real ornate card photo */}
          <div
            className="relative w-full overflow-hidden rounded-2xl"
            style={{
              backfaceVisibility: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,168,48,0.2)',
            }}
          >
            <div className="relative aspect-[3/4] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CARD_BACK_IMG}
                alt="Lucky Card"
                className="absolute inset-0 h-full w-full object-cover rounded-2xl select-none pointer-events-none"
                draggable={false}
              />
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: 'linear-gradient(105deg, transparent 38%, rgba(255,230,120,0.14) 50%, transparent 62%)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span
                  className="rounded-full px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] uppercase"
                  style={{
                    background: 'rgba(26,16,8,0.55)',
                    color: 'rgba(212,168,48,0.85)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(212,168,48,0.25)',
                  }}
                >
                  #{index + 1}
                </span>
              </div>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)' }}
              />
            </div>
          </div>

          {/* BACK FACE — revealed parchment */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="relative flex aspect-[3/4] w-full flex-col items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #fdf6e3 0%, #f5e9c8 35%, #edddb0 70%, #e5d09a 100%)',
                boxShadow: 'inset 0 0 50px rgba(139,90,20,0.12)',
              }}
            >
              <div className="absolute inset-2 rounded-xl" style={{ border: '2px solid rgba(212,168,48,0.65)' }} />
              <div className="absolute inset-4 rounded-lg" style={{ border: '1px solid rgba(196,151,58,0.3)' }} />
              {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                <div key={i} className={`absolute ${pos}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M7,0 L9,5 L14,7 L9,9 L7,14 L5,9 L0,7 L5,5 Z" fill="#c8973a" opacity="0.65" />
                  </svg>
                </div>
              ))}
              <div className="absolute top-9 left-9 right-9 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c8973a80, transparent)' }} />
              <div className="absolute bottom-9 left-9 right-9 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c8973a80, transparent)' }} />
              <motion.div
                className="absolute top-6 right-6"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.45, type: 'spring', stiffness: 280, damping: 16 }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                  style={{ background: 'linear-gradient(135deg, #d4a830, #a87820)', boxShadow: '0 2px 10px rgba(168,120,32,0.4)' }}
                >
                  ✦
                </div>
              </motion.div>
              <motion.div
                className="relative z-10 px-8 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.45 }}
              >
                <p
                  className="text-lg font-bold leading-relaxed whitespace-pre-wrap break-words"
                  style={{ color: '#3d2010', fontFamily: 'Georgia, serif', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}
                >
                  {card.content}
                </p>
              </motion.div>
              <div className="absolute bottom-5 left-0 right-0 text-center">
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#a87820', fontFamily: 'Georgia, serif' }}>
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

function parseCSVContent(text: string): string[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: string[] = [];
  for (const line of lines) {
    if (results.length === 0 && /^(content|nội dung|card|thẻ|stt|no|#)/i.test(line)) continue;
    const match = line.match(/^"([^"]*)"/) || line.match(/^([^,\t]*)/);
    if (match && match[1].trim()) results.push(match[1].trim());
  }
  return results;
}

async function parseExcelFile(file: File): Promise<string[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const results: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (i === 0 && /^(content|nội dung|card|thẻ|stt|no|#)/i.test(String(row[0]))) continue;
    const val = row.find((cell) => cell != null && String(cell).trim() !== '');
    if (val) results.push(String(val).trim());
  }
  return results;
}

function SetupModal({ onSetup, onClose }: { onSetup: (cards: string[], title: string) => void; onClose: () => void }) {
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
        contents = parseCSVContent(await file.text());
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
    if (cards.length === 0) { setError('Vui lòng nhập nội dung cho ít nhất 1 thẻ'); return; }
    onSetup(cards, title);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#c8973a]/30 p-6 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #1a1208 0%, #221609 50%, #1a1208 100%)', boxShadow: '0 0 60px rgba(200,151,58,0.15), 0 25px 60px rgba(0,0,0,0.7)' }}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors" style={{ color: '#c8973a', background: 'rgba(200,151,58,0.1)', border: '1px solid rgba(200,151,58,0.2)' }}>✕</button>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">��</span>
            <h2 className="text-xl font-black" style={{ color: '#f0d080', fontFamily: 'Georgia, serif' }}>Thiết lập Lucky Card</h2>
          </div>
          <p className="text-sm" style={{ color: '#a89060' }}>Tạo bộ thẻ may mắn — mỗi thẻ ẩn một nội dung bí mật!</p>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#a89060' }}>Tiêu đề</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Bốc thăm may mắn..." className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,151,58,0.25)', color: '#f0d080' }} />
        </div>
        <div className="mb-5">
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {(['upload', 'manual'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className="flex-1 rounded-lg py-2 text-sm font-bold transition-all" style={mode === m ? { background: 'linear-gradient(135deg, #c8973a, #a87820)', color: '#1a1208' } : { color: '#a89060' }}>
                {m === 'upload' ? '📁 Upload File' : '✏️ Nhập tay'}
              </button>
            ))}
          </div>
        </div>
        {mode === 'upload' && (
          <div className="space-y-4">
            <div onClick={() => fileInputRef.current?.click()} className="group cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors" style={{ borderColor: 'rgba(200,151,58,0.3)' }}>
              <input ref={fileInputRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <div className="text-3xl mb-2">{uploading ? '⏳' : uploadedCards.length > 0 ? '✅' : '📄'}</div>
              <p className="text-sm font-bold" style={{ color: '#f0d080' }}>
                {uploading ? 'Đang đọc file...' : uploadedCards.length > 0 ? `Đã tải ${uploadedCards.length} thẻ` : 'Click để chọn file'}
              </p>
              <p className="mt-1 text-xs" style={{ color: '#a89060' }}>Hỗ trợ: .csv, .txt, .xlsx, .xls — Mỗi dòng/ô = 1 thẻ</p>
            </div>
            {uploadedCards.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(200,151,58,0.2)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a89060' }}>Xem trước ({uploadedCards.length} thẻ)</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadedCards.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-xs font-bold w-6" style={{ color: '#c8973a' }}>#{i + 1}</span>
                      <span className="truncate" style={{ color: '#e8c878' }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#a89060' }}>Số lượng thẻ</label>
              <input type="number" min={1} max={50} value={manualCount} onChange={(e) => handleManualCountChange(parseInt(e.target.value) || 1)} className="w-24 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,151,58,0.25)', color: '#f0d080' }} />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {manualCards.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-8 shrink-0" style={{ color: '#c8973a' }}>#{i + 1}</span>
                  <input type="text" value={val} onChange={(e) => { const next = [...manualCards]; next[i] = e.target.value; setManualCards(next); }} placeholder={`Nội dung thẻ ${i + 1}...`} className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(200,151,58,0.2)', color: '#f0d080' }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <div className="mt-4 rounded-lg px-4 py-2.5 text-sm font-medium" style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)', color: '#ff8080' }}>{error}</div>}
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors" style={{ border: '1px solid rgba(200,151,58,0.25)', color: '#a89060', background: 'transparent' }}>Huỷ</button>
          <button onClick={handleSubmit} className="flex-1 rounded-xl py-2.5 text-sm font-black transition-colors" style={{ background: 'linear-gradient(135deg, #c8973a, #a87820)', color: '#1a1208', boxShadow: '0 4px 20px rgba(200,151,58,0.3)' }}>🎴 Tạo bộ thẻ</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
    <motion.div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {confettiPieces.map((p) => (
        <motion.div key={p.id} className="absolute" style={{ left: `${p.x}%`, top: -30, fontSize: p.size }}
          initial={{ y: -50, rotate: 0, opacity: 1 }}
          animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800, rotate: Math.random() * 720 - 360, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        >
          {p.emoji}
        </motion.div>
      ))}
      <motion.div className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      >
        <div className="rounded-2xl px-8 py-5 text-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #1a1208, #221609)', border: '1px solid rgba(200,151,58,0.4)', boxShadow: '0 0 60px rgba(200,151,58,0.2)' }}>
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-lg font-black" style={{ color: '#f0d080', fontFamily: 'Georgia, serif' }}>Tất cả thẻ đã được lật!</p>
          <p className="text-sm mt-1" style={{ color: '#a89060' }}>Chúc mừng!</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LuckyCardPage() {
  const [state, setState] = useState<LuckyCardState | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LuckyCardState;
        if (parsed.cards?.length > 0) setState(parsed);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state, loaded]);

  const handleSetup = useCallback((contents: string[], title: string) => {
    const cards: CardData[] = contents.map((content, i) => ({ id: `card_${Date.now()}_${i}`, content, flipped: false }));
    setState({ cards, title, createdAt: new Date().toISOString() });
    setShowSetup(false);
  }, []);

  const handleFlip = useCallback((id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, cards: prev.cards.map((c) => (c.id === id ? { ...c, flipped: true } : c)) };
      if (updated.cards.every((c) => c.flipped)) setTimeout(() => setShowCelebration(true), 600);
      return updated;
    });
  }, []);

  const handleReset = useCallback(() => { setState(null); setShowCelebration(false); }, []);

  const handleShuffle = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
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
      if (prev.cards.every((c) => c.flipped)) return prev;
      const updated = { ...prev, cards: prev.cards.map((c) => ({ ...c, flipped: true })) };
      setTimeout(() => setShowCelebration(true), 600);
      return updated;
    });
  }, []);

  const flippedCount = state?.cards.filter((c) => c.flipped).length ?? 0;
  const totalCount = state?.cards.length ?? 0;

  if (!loaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #1a1208 0%, #0d0a05 100%)' }}>
        <motion.div className="text-4xl" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🃏</motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: 'radial-gradient(ellipse at 30% 20%, #1e1408 0%, #120d04 40%, #0a0704 100%)',
      }}
    >
      {/* Floating ambient particles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#c8973a', '#d4a830', '#e8c878', '#fff8e0'][i % 4],
              boxShadow: `0 0 6px ${['#c8973a', '#d4a830', '#e8c878'][i % 3]}`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Vignette overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link href="/admin/tools" className="transition-colors" style={{ color: '#a89060' }}>Magical Tools</Link>
            <span style={{ color: '#6b5030' }}>/</span>
            <span style={{ color: '#c8973a' }}>Lucky Card</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.span className="text-3xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>🃏</motion.span>
              <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#f0d080', fontFamily: 'Georgia, serif' }}>{state?.title || 'Lucky Card'}</h1>
                <p className="text-sm" style={{ color: '#a89060' }}>{state ? `${flippedCount}/${totalCount} thẻ đã lật` : 'Tạo bộ thẻ may mắn để bắt đầu!'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {state && (
                <>
                  <button onClick={handleShuffle} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors" style={{ border: '1px solid rgba(200,151,58,0.3)', color: '#c8973a', background: 'rgba(200,151,58,0.08)' }}>🔀 Xáo trộn</button>
                  <button onClick={handleFlipAll} disabled={flippedCount === totalCount} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ border: '1px solid rgba(200,151,58,0.3)', color: '#c8973a', background: 'rgba(200,151,58,0.08)' }}>�� Lật tất cả</button>
                  <button onClick={handleReset} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors" style={{ border: '1px solid rgba(180,60,60,0.4)', color: '#e07070', background: 'rgba(180,60,60,0.1)' }}>🗑️ Reset</button>
                </>
              )}
              {!state && (
                <button onClick={() => setShowSetup(true)} className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-black transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #c8973a, #a87820)', color: '#1a1208', boxShadow: '0 4px 20px rgba(200,151,58,0.35)' }}>✨ Tạo bộ thẻ mới</button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {state && (
            <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,151,58,0.15)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #8b5e1a, #c8973a, #f0c040)' }}
                initial={{ width: 0 }}
                animate={{ width: `${totalCount > 0 ? (flippedCount / totalCount) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>

        {/* Card Grid */}
        {state && state.cards.length > 0 && (
          <motion.div
            className="grid gap-5 sm:gap-6 lg:gap-8"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${
                totalCount <= 3 ? '280px' : totalCount <= 6 ? '240px' : totalCount <= 12 ? '210px' : '180px'
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
          <motion.div className="flex flex-col items-center justify-center py-24" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Decorative ring */}
            <div className="relative mb-8">
              <motion.div
                className="absolute -inset-8 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #c8973a, transparent 70%)' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="text-8xl relative z-10"
                animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                🃏
              </motion.div>
              <motion.div className="absolute -top-2 -right-2 text-2xl" animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>✨</motion.div>
            </div>

            <h2 className="text-2xl font-black mb-3" style={{ color: '#f0d080', fontFamily: 'Georgia, serif' }}>Chưa có bộ thẻ nào</h2>
            <p className="text-sm mb-8 text-center max-w-sm leading-relaxed" style={{ color: '#a89060' }}>
              Tạo bộ thẻ may mắn bằng cách nhập nội dung thủ công hoặc upload file Excel/CSV
            </p>

            {/* Ornate divider */}
            <div className="flex items-center gap-3 mb-8 w-48">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c8973a40)' }} />
              <span style={{ color: '#c8973a', fontSize: 10 }}>✦</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #c8973a40, transparent)' }} />
            </div>

            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-black transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #c8973a, #a87820)', color: '#1a1208', boxShadow: '0 6px 30px rgba(200,151,58,0.4), 0 0 0 1px rgba(200,151,58,0.2)' }}
            >
              <span className="text-lg">✨</span>
              Tạo bộ thẻ mới
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>{showSetup && <SetupModal onSetup={handleSetup} onClose={() => setShowSetup(false)} />}</AnimatePresence>
      <AnimatePresence>{showCelebration && <CelebrationOverlay onDone={() => setShowCelebration(false)} />}</AnimatePresence>
    </div>
  );
}

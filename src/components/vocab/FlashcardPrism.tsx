'use client';

/* ════════════════════════════════════════════════════════════════════════
   FlashcardPrism.tsx — 3D Triangular Prism Flashcard
   
   Architecture:
   • 3 faces positioned with CSS 3D: rotateY(0|120|240deg) + translateZ(apothem)
   • Container rotates: faceIndex * -120deg to bring correct face forward
   • Tap/click  → rotate to next face (framer-motion onTap)
   • Swipe left  → previous card (framer-motion drag="x")
   • Swipe right → next card
   • GPU accelerated: will-change: transform, translateZ(0) everywhere
   • Safari/iOS: -webkit-backface-visibility hardened
   ════════════════════════════════════════════════════════════════════════ */

import { m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export interface FlashcardWord {
  id: string;
  term: string;
  definition: string;
  partOfSpeech: string;
  example: string;
  ndkExplanation: string | null;
  pronunciation?: string;
  meaningEn?: string;
  meaningVi?: string;
}

interface FlashcardPrismProps {
  word: FlashcardWord;
  onSwipeLeft: () => void;   // previous / still-learning
  onSwipeRight: () => void;  // next / mastered
  animKey?: number;
  onSpeak?: (text: string) => void;
}

const SWIPE_THRESHOLD = 80; // px

export default function FlashcardPrism({
  word,
  onSwipeLeft,
  onSwipeRight,
  animKey = 0,
  onSpeak,
}: FlashcardPrismProps) {
  const [faceIndex, setFaceIndex] = useState(0); // 0 | 1 | 2
  const containerRef = useRef<HTMLDivElement>(null);
  const [apothem, setApothem] = useState(170);

  // Reset to face 0 when word changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFaceIndex(0);
  }, [word.id]);

  // Calculate apothem from container width after mount / resize
  useEffect(() => {
    function recalc() {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        // apothem = w / (2 * tan(60°)) = w / (2 * √3)
        setApothem(Math.round(w / (2 * Math.sqrt(3))));
      }
    }
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  function rotatePrism() {
    setFaceIndex((prev) => (prev + 1) % 3);
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    }
  }

  const rotationDeg = faceIndex * -120;

  // Face base style — shared
  const faceBase: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    willChange: 'transform',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    overflowY: 'auto',
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ perspective: '900px' }}>
      <m.div
        key={animKey}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={handleDragEnd}
        onTap={rotatePrism}
        className="relative cursor-pointer touch-none select-none"
        style={{ minHeight: '320px' }}
        initial={{ y: 24, opacity: 1, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        {/* Prism inner — rotates */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '320px',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotationDeg}deg)`,
            transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {/* ── Face 1: English term + phonetic + Audio ── */}
          <div
            style={{
              ...faceBase,
              transform: `rotateY(0deg) translateZ(${apothem}px)`,
              background: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              boxShadow: '0 8px 32px -4px rgba(0,0,0,0.08)',
            }}
          >
            <span className="text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {word.term}
            </span>
            {word.pronunciation ? (
              <span className="mt-2 text-center text-sm text-muted">
                {word.pronunciation}
              </span>
            ) : null}
            {word.partOfSpeech ? (
              <span className="mt-3 rounded-full bg-surface-hover px-3 py-1 text-xs font-medium italic text-muted">
                {word.partOfSpeech}
              </span>
            ) : null}
            <button
              onClick={(e) => { e.stopPropagation(); onSpeak?.(word.term); }}
              className="mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover text-muted transition-all hover:bg-accent hover:text-white hover:scale-110 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.14a.75.75 0 011.28.53v12.72a.75.75 0 01-1.28.53l-4.72-3.14H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </button>
            <FaceLabel index={0} current={faceIndex} />
          </div>

          {/* ── Face 2: Vietnamese meaning + example ── */}
          <div
            style={{
              ...faceBase,
              transform: `rotateY(120deg) translateZ(${apothem}px)`,
              background: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              boxShadow: '0 8px 32px -4px rgba(0,0,0,0.08)',
            }}
          >
            <span className="text-center text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
              {word.meaningVi || word.definition}
            </span>
            {word.meaningEn ? (
              <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-muted">
                {word.meaningEn}
              </p>
            ) : null}
            {word.example ? (
              <p className="mt-5 max-w-sm text-center text-sm italic leading-relaxed text-muted">
                &ldquo;{word.example}&rdquo;
              </p>
            ) : null}
            <FaceLabel index={1} current={faceIndex} />
          </div>

          {/* ── Face 3: NDK's Explanation ── */}
          <div
            style={{
              ...faceBase,
              transform: `rotateY(240deg) translateZ(${apothem}px)`,
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              boxShadow: '0 8px 32px -4px rgba(245,158,11,0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👨‍🏫</span>
              <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                NDK&apos;s Explanation
              </span>
            </div>
            {word.ndkExplanation ? (
              <p className="text-center text-sm leading-relaxed text-amber-900 font-medium">
                {word.ndkExplanation}
              </p>
            ) : (
              <p className="text-center text-sm italic text-amber-600 opacity-70">
                Đang cập nhật giải thích...
              </p>
            )}
            <FaceLabel index={2} current={faceIndex} />
          </div>
        </div>
      </m.div>

      {/* Face indicator dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setFaceIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              faceIndex === i
                ? i === 2 ? 'w-6 bg-amber-500' : 'w-6 bg-accent'
                : 'w-2 bg-border hover:bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Hint text */}
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted/40">
        Tap để xoay · Vuốt ← Chưa thuộc · Vuốt → Đã thuộc
      </p>
    </div>
  );
}

/* ── Small face label at bottom ── */
function FaceLabel({ index, current }: { index: number; current: number }) {
  const labels = ['Từ tiếng Anh', 'Nghĩa tiếng Việt', "NDK's Explanation"];
  const colors = ['text-muted/40', 'text-muted/40', 'text-amber-500/60'];
  return (
    <p className={`absolute bottom-4 text-[9px] font-bold uppercase tracking-widest ${colors[index]} ${current === index ? 'opacity-100' : 'opacity-0'}`}>
      {labels[index]}
    </p>
  );
}

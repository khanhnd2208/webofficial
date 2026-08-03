"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STORAGE_KEY = "admin_lucky_card_state";
const CARD_BACK_IMG = "/uploads/lucky-card-back.jpg"; // NDK ornate card — shown face-down (mặt úp)
const CARD_FRONT_IMG = "/uploads/lucky-card-front.png"; // Parchment — background when content revealed (mặt lật)
const PAGE_BG_IMG = "/uploads/lucky-card-bg.jpg"; // Cosmic nebula background

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

/* ─── Shared font stacks ──────────────────────────────────
   Inter → Vietnamese-safe UI font (loaded in layout.tsx with vietnamese subset)
   Source Serif 4 → Vietnamese-safe serif for card content
   Cinzel → Latin-only decorative, used ONLY for non-Vietnamese labels like "Lucky Card"
*/
const FONT_UI = 'var(--font-inter), system-ui, sans-serif';
const FONT_CARD = 'var(--font-serif-display), "Source Serif 4", Georgia, serif';
const FONT_DISPLAY = 'var(--font-cinzel), serif'; // Only for pure Latin text

// ─── SVG Icon set — no emojis in UI chrome ───────────────
const Icons = {
  SoundOn: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  SoundOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ),
  Expand: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  ),
  Compress: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  Shuffle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  FlipAll: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="16" height="13" rx="2" />
      <path d="M22 5V4a2 2 0 0 0-2-2H6" />
      <path d="M6 12h8" />
      <path d="M10 16H6" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  Upload: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Pencil: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  File: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
  Spinner: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
};

// ─── Web Audio API Sound Engine ──────────────────────────
class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  playFlipWhoosh() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(2000, now);
      bandpass.frequency.exponentialRampToValueAtTime(400, now + 0.25);
      bandpass.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      noise.connect(bandpass).connect(gain).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.3);
    } catch { /* silent fail */ }
  }

  playRevealChime() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99, 1046.5];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        const gain = ctx.createGain();
        const t = now + i * 0.08;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12 - i * 0.02, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8 - i * 0.1);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.9);
      });
      const shimmer = ctx.createOscillator();
      shimmer.type = "sine";
      shimmer.frequency.setValueAtTime(2093, now + 0.25);
      shimmer.frequency.exponentialRampToValueAtTime(4186, now + 0.6);
      const shimGain = ctx.createGain();
      shimGain.gain.setValueAtTime(0, now + 0.25);
      shimGain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      shimmer.connect(shimGain).connect(ctx.destination);
      shimmer.start(now + 0.25);
      shimmer.stop(now + 0.75);
    } catch { /* silent fail */ }
  }

  playImpact() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch { /* silent fail */ }
  }

  playCardFlipCeremony() {
    this.playFlipWhoosh();
    setTimeout(() => this.playImpact(), 350);
    setTimeout(() => this.playRevealChime(), 500);
  }
}

const soundEngine = typeof window !== "undefined" ? new SoundEngine() : null;

// ─── Per-card flip celebration effects ───────────────────

function CardFlipSparkles({ count = 20 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" style={{ zIndex: 30 }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i + (i * 7) % 15;
        const distance = 70 + (i * 13) % 100;
        const size = 3 + (i * 7) % 6;
        const duration = 0.55 + (i * 0.04) % 0.35;
        const delay = (i * 0.012) % 0.12;
        const colors = ["#FFD700", "#FFA500", "#FF6B35", "#c8973a", "#f0d080", "#e8c878", "#d4a830", "#fff8e0"];
        const color = colors[i % colors.length];
        return (
          <m.div
            key={i}
            className="absolute rounded-full"
            style={{ width: size, height: size, left: "50%", top: "50%", backgroundColor: color, boxShadow: `0 0 ${size * 3}px ${color}` }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              scale: [0, 1.8, 0],
              opacity: [1, 1, 0],
            }}
            transition={{ duration, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

function CardFlipRays() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" style={{ zIndex: 25 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <m.div
          key={i}
          className="absolute"
          style={{
            left: "50%", top: "50%", width: 2, height: 0,
            background: "linear-gradient(to bottom, rgba(212,168,48,0.8), rgba(240,208,128,0.3), transparent)",
            transformOrigin: "top center",
            transform: `rotate(${(360 / 12) * i}deg)`,
          }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: [0, 120, 0], opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function CardFlipRingPulse() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible" style={{ zIndex: 22 }}>
      {[0, 1, 2].map((i) => (
        <m.div
          key={i}
          className="absolute rounded-2xl"
          style={{
            border: `${2 - i * 0.5}px solid rgba(212,168,48,${0.7 - i * 0.2})`,
            boxShadow: `0 0 12px rgba(212,168,48,${0.3 - i * 0.1})`,
          }}
          initial={{ width: "80%", height: "80%", opacity: 1 }}
          animate={{ width: `${140 + i * 40}%`, height: `${140 + i * 40}%`, opacity: 0 }}
          transition={{ duration: 0.65 + i * 0.15, delay: 0.15 + i * 0.08, ease: [0.2, 0.8, 0.4, 1] }}
        />
      ))}
    </div>
  );
}

function CardFlipFlash() {
  return (
    <m.div
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{ background: "radial-gradient(ellipse at center, rgba(255,230,100,0.8) 0%, rgba(212,168,48,0.3) 50%, transparent 80%)", zIndex: 20 }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}

function CardFlipGeoBurst() {
  const shapes = [
    { path: "M8,0 L10,6 L16,6 L11,10 L13,16 L8,12 L3,16 L5,10 L0,6 L6,6 Z", size: 12 },
    { path: "M6,0 L8,4 L12,4 L9,7 L10,12 L6,9 L2,12 L3,7 L0,4 L4,4 Z", size: 10 },
    { path: "M5,0 L6,4 L10,5 L6,6 L5,10 L4,6 L0,5 L4,4 Z", size: 9 },
    { path: "M4,0 L5,3 L8,4 L5,5 L4,8 L3,5 L0,4 L3,3 Z", size: 8 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" style={{ zIndex: 35 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (360 / 10) * i + (i * 13) % 22;
        const distance = 75 + (i * 17) % 55;
        const shape = shapes[i % shapes.length];
        const colors = ["#FFD700", "#f0d080", "#c8973a", "#d4a830", "#fff8e0", "#FFA500"];
        const color = colors[i % colors.length];
        return (
          <m.div
            key={i}
            className="absolute"
            style={{ left: "50%", top: "50%" }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              scale: [0, 1.2, 0],
              opacity: [1, 0.9, 0],
              rotate: (i * 53) % 360,
            }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.18 + (i * 0.018) }}
          >
            <svg width={shape.size} height={shape.size} viewBox={`0 0 ${shape.size + 4} ${shape.size + 4}`}>
              <path d={shape.path} fill={color} filter="drop-shadow(0 0 3px rgba(212,168,48,0.8))" />
            </svg>
          </m.div>
        );
      })}
    </div>
  );
}

// ─── Adaptive text sizing ─────────────────────────────────
function getAdaptiveFontStyle(content: string): {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
} {
  const len = content.length;
  if (len <= 8)  return { fontSize: "clamp(1.8rem, 5vw, 2.6rem)", lineHeight: "1.2", fontWeight: 700, letterSpacing: "0.03em" };
  if (len <= 20) return { fontSize: "clamp(1.4rem, 4vw, 2rem)",   lineHeight: "1.25", fontWeight: 600 };
  if (len <= 40) return { fontSize: "clamp(1.1rem, 3.2vw, 1.5rem)", lineHeight: "1.35", fontWeight: 600 };
  if (len <= 80) return { fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)", lineHeight: "1.45", fontWeight: 500 };
  if (len <= 150) return { fontSize: "clamp(0.8rem, 2vw, 1rem)",  lineHeight: "1.5",  fontWeight: 500 };
  return { fontSize: "clamp(0.7rem, 1.5vw, 0.875rem)", lineHeight: "1.55", fontWeight: 400 };
}


// ─── Lucky Card Item ─────────────────────────────────────
function LuckyCardItem({ card, index, onFlip }: { card: CardData; index: number; onFlip: (id: string) => void }) {
  const [showCeremony, setShowCeremony] = useState(false);
  const [justFlipped, setJustFlipped] = useState(false);
  const prevFlipped = useRef(card.flipped);

  const handleFlip = () => {
    if (card.flipped) return;
    soundEngine?.playCardFlipCeremony();
    setShowCeremony(true);
    setJustFlipped(true);
    onFlip(card.id);
    setTimeout(() => setShowCeremony(false), 1200);
    setTimeout(() => setJustFlipped(false), 1600);
  };

  useEffect(() => {
    if (card.flipped && !prevFlipped.current && !justFlipped) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowCeremony(true);
      setTimeout(() => setShowCeremony(false), 1200);
    }
    prevFlipped.current = card.flipped;
  }, [card.flipped, justFlipped]);

  const fontStyle = useMemo(() => getAdaptiveFontStyle(card.content), [card.content]);

  return (
    <m.div
      className="relative"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      <AnimatePresence>
        {showCeremony && (
          <>
            <CardFlipFlash />
            <CardFlipRingPulse />
            <CardFlipRays />
            <CardFlipSparkles count={22} />
            <CardFlipGeoBurst />
          </>
        )}
      </AnimatePresence>

      {justFlipped && (
        <m.div
          className="absolute -inset-4 rounded-3xl blur-2xl"
          style={{ background: "radial-gradient(ellipse, #d4a830 0%, #c8973a 40%, transparent 70%)" }}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: [0.85, 0.4, 0] }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
      )}

      {/* Persistent card edge glow */}
      <div
        className="absolute -inset-[2px] rounded-2xl pointer-events-none"
        style={{
          background: card.flipped
            ? "linear-gradient(145deg, rgba(212,168,48,0.5), rgba(168,120,32,0.2), rgba(212,168,48,0.4))"
            : "linear-gradient(145deg, rgba(212,168,48,0.35), rgba(168,120,32,0.15), rgba(212,168,48,0.3))",
          boxShadow: card.flipped
            ? "0 0 20px rgba(212,168,48,0.35), 0 0 50px rgba(212,168,48,0.15), inset 0 0 20px rgba(212,168,48,0.1)"
            : "0 0 15px rgba(212,168,48,0.25), 0 0 40px rgba(212,168,48,0.1)",
        }}
      />
      {/* Animated breathing glow */}
      <m.div
        className="absolute -inset-[3px] rounded-2xl pointer-events-none"
        style={{
          boxShadow: "0 0 25px rgba(212,168,48,0.3), 0 0 60px rgba(212,168,48,0.12)",
        }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <button
        type="button"
        onClick={handleFlip}
        disabled={card.flipped}
        aria-label={card.flipped ? `Thẻ đã mở: ${card.content.slice(0, 40)}` : `Lật thẻ ${card.id}`}
        className={`relative block w-full select-none text-left ${card.flipped ? "cursor-default" : "cursor-pointer"}`}
        style={{ perspective: "1400px" }}
      >
        <m.div
          className="relative w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: card.flipped ? 180 : 0 }}
          transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
          whileHover={!card.flipped ? { rotateY: 12, scale: 1.03 } : {}}
        >
          {/* ═══ FACE-DOWN (mặt úp) — NDK ornate card image ═══ */}
          <div
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ backfaceVisibility: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(212,168,48,0.2)" }}
          >
            <div className="relative aspect-[3/4] w-full">
              <img src={CARD_BACK_IMG} alt="Lucky Card" className="absolute inset-0 h-full w-full object-cover rounded-2xl select-none pointer-events-none" draggable={false} />
              {/* Shimmer sweep */}
              <m.div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: "linear-gradient(115deg, transparent 35%, rgba(255,240,160,0.16) 50%, transparent 65%)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              />
              {/* Card number badge */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span
                  className="rounded-full px-3 py-0.5 text-[10px] font-bold tracking-[0.25em]"
                  style={{ background: "rgba(20,12,4,0.65)", color: "#f0d080", backdropFilter: "blur(6px)", border: "1px solid rgba(212,168,48,0.35)", fontFamily: FONT_UI }}
                >
                  {index + 1}
                </span>
              </div>
              {/* Edge darkening vignette */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)" }} />
            </div>
          </div>

          {/* ═══ FACE-UP (mặt lật) — Parchment bg with text content ═══ */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 35px rgba(212,168,48,0.2)" }}
          >
            <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center">
              {/* Parchment background image */}
              <img src={CARD_FRONT_IMG} alt="" className="absolute inset-0 h-full w-full object-cover rounded-2xl select-none pointer-events-none" draggable={false} />

              {/* Warm overlay to blend parchment with gold tones */}
              <div className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(145deg, rgba(253,248,238,0.35) 0%, rgba(248,236,208,0.3) 40%, rgba(240,222,181,0.25) 100%)" }} />

              {/* Gold seal — top right */}
              <m.div
                className="absolute top-[14px] right-[14px] z-20"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.45, type: "spring", stiffness: 280, damping: 16 }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, #d4a830, #a87820)", boxShadow: "0 2px 12px rgba(168,120,32,0.5)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M6,0 L7.5,4.5 L12,6 L7.5,7.5 L6,12 L4.5,7.5 L0,6 L4.5,4.5 Z" fill="rgba(255,248,220,0.9)" />
                  </svg>
                </div>
              </m.div>

              {/* Card number — bottom */}
              <div className="absolute bottom-[14px] left-0 right-0 text-center z-20">
                <span
                  className="text-[10px] tracking-[0.3em] font-bold uppercase"
                  style={{ color: "#7a5c1e", fontFamily: FONT_UI, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
                >
                  {index + 1}
                </span>
              </div>

              {/* MAIN CONTENT — Source Serif 4 (Vietnamese safe) + adaptive size */}
              <m.div
                className="relative z-10 flex items-center justify-center px-5 sm:px-7"
                style={{ maxWidth: "90%", maxHeight: "65%" }}
                initial={{ opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <p
                  className="text-center whitespace-pre-wrap break-words"
                  style={{
                    color: "#1a0e04",
                    fontFamily: FONT_CARD,
                    textShadow: "0 1px 3px rgba(255,255,255,0.6)",
                    fontSize: fontStyle.fontSize,
                    lineHeight: fontStyle.lineHeight,
                    fontWeight: fontStyle.fontWeight,
                    letterSpacing: fontStyle.letterSpacing ?? "0.01em",
                  }}
                >
                  {card.content}
                </p>
              </m.div>

              {/* Soft vignette on parchment edges */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(100,70,20,0.15) 100%)" }} />
            </div>
          </div>
        </m.div>
      </button>
    </m.div>
  );
}

// ─── File parsing utilities ──────────────────────────────

function parseCSVContent(text: string): string[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: string[] = [];
  for (const line of lines) {
    if (results.length === 0 && /^(content|nội dung|card|thẻ|stt|no|#)/i.test(line)) continue;
    const match = line.match(/^"([^"]*)"/) || line.match(/^([^,\t]*)/);
    if (match && match[1].trim()) results.push(match[1].trim());
  }
  return results;
}

async function parseExcelFile(file: File): Promise<string[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const results: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (i === 0 && /^(content|nội dung|card|thẻ|stt|no|#)/i.test(String(row[0]))) continue;
    const val = row.find((cell) => cell != null && String(cell).trim() !== "");
    if (val) results.push(String(val).trim());
  }
  return results;
}

// ─── Setup Modal ─────────────────────────────────────────
function SetupModal({ onSetup, onClose }: { onSetup: (cards: string[], title: string) => void; onClose: () => void }) {
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [manualCount, setManualCount] = useState(5);
  const [manualCards, setManualCards] = useState<string[]>(Array(5).fill(""));
  const [title, setTitle] = useState("Lucky Card");
  const [uploadedCards, setUploadedCards] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualCountChange = (count: number) => {
    const clamped = Math.min(50, Math.max(1, count));
    setManualCount(clamped);
    setManualCards((prev) => {
      if (clamped > prev.length) return [...prev, ...Array(clamped - prev.length).fill("")];
      return prev.slice(0, clamped);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      let contents: string[];
      if (file.name.match(/\.xlsx?$/i)) {
        contents = await parseExcelFile(file);
      } else {
        const text = await file.text();
        contents = parseCSVContent(text);
      }
      if (contents.length === 0) { setError("Không tìm thấy nội dung trong file"); return; }
      setUploadedCards(contents);
    } catch { setError("Lỗi đọc file. Vui lòng thử lại."); }
    finally { setUploading(false); }
  };

  const handleSubmit = () => {
    setError("");
    const cards = mode === "upload" ? uploadedCards : manualCards.filter((c) => c.trim());
    if (cards.length === 0) { setError("Vui lòng nhập nội dung cho ít nhất 1 thẻ"); return; }
    onSetup(cards, title.trim() || "Lucky Card");
  };

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <m.div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#c8973a]/25 p-6 shadow-2xl"
        style={{ background: "linear-gradient(150deg, #1c1509 0%, #201608 50%, #1a1208 100%)", boxShadow: "0 0 60px rgba(200,151,58,0.12), 0 25px 60px rgba(0,0,0,0.7)" }}
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-white/10"
          style={{ color: "#c8a060" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="12" y2="12" />
            <line x1="12" y1="1" x2="1" y2="12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(200,151,58,0.12)", border: "1px solid rgba(200,151,58,0.2)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8973a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold tracking-wide" style={{ color: "#f5e0a0", fontFamily: FONT_DISPLAY }}>Lucky Card</h2>
          </div>
          <p className="text-sm ml-12" style={{ color: "#b8a060", fontFamily: FONT_UI }}>Mỗi thẻ ẩn một nội dung bí mật</p>
        </div>

        {/* Title input */}
        <div className="mb-5">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#b8a060", fontFamily: FONT_UI }}>Tiêu đề</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Bốc thăm may mắn..."
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,151,58,0.25)", color: "#f5e0a0", fontFamily: FONT_UI }}
          />
        </div>

        {/* Mode tabs */}
        <div className="mb-5">
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(0,0,0,0.25)" }}>
            {(["upload", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all"
                style={mode === m
                  ? { background: "linear-gradient(135deg, #c8973a, #a87820)", color: "#1a1208", fontFamily: FONT_UI }
                  : { color: "#b8a060", fontFamily: FONT_UI }
                }
              >
                {m === "upload" ? <><Icons.Upload /> Upload File</> : <><Icons.Pencil /> Nhập tay</>}
              </button>
            ))}
          </div>
        </div>

        {mode === "upload" && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all hover:border-[#c8973a]/50"
              style={{ borderColor: "rgba(200,151,58,0.3)" }}
            >
              <input ref={fileInputRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <div className="flex justify-center mb-3" style={{ color: uploading ? "#c8973a" : uploadedCards.length > 0 ? "#6aad7c" : "#b8a060" }}>
                {uploading
                  ? <m.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Icons.Spinner /></m.div>
                  : uploadedCards.length > 0
                    ? <Icons.Check />
                    : <Icons.File />
                }
              </div>
              <p className="text-sm font-medium" style={{ color: "#f0d080", fontFamily: FONT_UI }}>
                {uploading ? "Đang đọc file..." : uploadedCards.length > 0 ? `${uploadedCards.length} thẻ đã tải` : "Chọn file"}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: "#907848" }}>.csv · .txt · .xlsx · .xls</p>
              <p className="mt-2 text-[10px]" style={{ color: "#907848" }}>
                Chưa có file?{" "}
                <a
                  href="/sample-lucky-card.csv"
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="underline underline-offset-2 transition-colors hover:text-[#d4a830]"
                  style={{ color: "#c8973a", fontFamily: FONT_UI }}
                >
                  Tải file mẫu
                </a>
              </p>
            </div>
            {uploadedCards.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(200,151,58,0.15)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: "#b8a060", fontFamily: FONT_UI }}>Xem trước — {uploadedCards.length} thẻ</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadedCards.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span className="text-[9px] font-bold w-5 shrink-0 tracking-widest" style={{ color: "#d4a830", fontFamily: FONT_UI }}>{i + 1}</span>
                      <span className="truncate text-xs" style={{ color: "#e8c878" }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#b8a060", fontFamily: FONT_UI }}>Số lượng thẻ</label>
              <input
                type="number" min={1} max={50} value={manualCount}
                onChange={(e) => handleManualCountChange(parseInt(e.target.value) || 1)}
                className="w-20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,151,58,0.25)", color: "#f5e0a0" }}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {manualCards.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] font-bold w-7 shrink-0 tracking-widest" style={{ color: "#d4a830", fontFamily: FONT_UI }}>{i + 1}</span>
                  <input
                    type="text" value={val}
                    onChange={(e) => { const next = [...manualCards]; next[i] = e.target.value; setManualCards(next); }}
                    placeholder={`Thẻ ${i + 1}...`}
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,151,58,0.18)", color: "#f5e0a0", fontFamily: FONT_UI }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg px-4 py-2.5 text-sm" style={{ background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.25)", color: "#ff8080", fontFamily: FONT_UI }}>
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold tracking-widest uppercase transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(200,151,58,0.2)", color: "#b8a060", fontFamily: FONT_UI }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold tracking-widest uppercase transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #c8973a, #a87820)", color: "#1a1208", boxShadow: "0 4px 20px rgba(200,151,58,0.25)", fontFamily: FONT_UI }}
          >
            Tạo bộ thẻ
          </button>
        </div>
      </m.div>
    </m.div>
  );
}


export default function LuckyCardPage() {
  const [state, setState] = useState<LuckyCardState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Load state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LuckyCardState;
        if (parsed && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState(parsed);
        }
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  // Save state
  useEffect(() => {
    if (!loaded) return;
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state, loaded]);

  // Sync sound engine mute
  useEffect(() => {
    if (soundEngine) soundEngine.muted = !soundEnabled;
  }, [soundEnabled]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleSetup = useCallback((cards: string[], title: string) => {
    const newState: LuckyCardState = {
      cards: cards.map((content, i) => ({
        id: `card-${Date.now()}-${i}`,
        content,
        flipped: false,
      })),
      title,
      createdAt: new Date().toISOString(),
    };
    setState(newState);
    setShowSetup(false);
  }, []);

  const handleFlip = useCallback((id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, cards: prev.cards.map((c) => c.id === id ? { ...c, flipped: true } : c) };
    });
  }, []);

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
      const unflipped = prev.cards.filter((c) => !c.flipped);
      if (unflipped.length === 0) return prev;
      const updated = [...prev.cards];
      let delay = 0;
      for (const card of unflipped) {
        const idx = updated.findIndex((c) => c.id === card.id);
        if (idx !== -1) {
          setTimeout(() => {
            soundEngine?.playCardFlipCeremony();
            setState((s) => s ? { ...s, cards: s.cards.map((c) => c.id === card.id ? { ...c, flipped: true } : c) } : s);
          }, delay);
          delay += 250;
        }
      }
      return prev;
    });
  }, []);

  const handleReset = useCallback(() => {
    setState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await fullscreenRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch { console.warn("Fullscreen not supported"); }
  }, []);

  const flippedCount = state?.cards.filter((c) => c.flipped).length ?? 0;
  const totalCount = state?.cards.length ?? 0;

  if (!loaded) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundImage: `url(${PAGE_BG_IMG})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(4,3,10,0.6)" }} />
        <m.div
          className="rounded-full relative z-10"
          style={{ width: 48, height: 48, border: "2px solid transparent", borderTopColor: "#c8973a", borderRightColor: "#d4a830" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div
      ref={fullscreenRef}
      className={`min-h-screen relative ${isFullscreen ? "overflow-y-auto" : ""}`}
      style={{
        backgroundImage: `url(${PAGE_BG_IMG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Deep overlay to keep cosmic mood & text readable */}
      <div className="pointer-events-none fixed inset-0" style={{ background: "rgba(4,3,10,0.5)" }} />

      {/* Ambient particles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <m.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 1 + (i * 7) % 3,
              height: 1 + (i * 7) % 3,
              left: `${(i * 9.3 + 5) % 100}%`,
              top: `${(i * 13.7 + 10) % 100}%`,
              background: ["#c8973a", "#d4a830", "#e8c878"][i % 3],
              boxShadow: `0 0 5px ${["#c8973a", "#d4a830", "#e8c878"][i % 3]}`,
            }}
            animate={{ y: [0, -25, 0], opacity: [0.15, 0.6, 0.15], scale: [1, 1.4, 1] }}
            transition={{ duration: 3 + (i * 1.3) % 4, repeat: Infinity, delay: (i * 0.7) % 4, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />

      <div className={`relative z-10 mx-auto max-w-6xl px-4 sm:px-6 ${isFullscreen ? "py-4" : "py-8"}`}>
        <div className={isFullscreen ? "mb-4" : "mb-8"}>

          {/* Breadcrumb */}
          {!isFullscreen && (
            <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#b8a060" }}>
              <Link href="/admin/tools" className="transition-colors hover:text-[#e8c878]" style={{ fontFamily: FONT_UI, letterSpacing: "0.04em" }}>Magical Tools</Link>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ color: "#e8c878", fontFamily: FONT_UI, letterSpacing: "0.04em" }}>Lucky Card</span>
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Title block */}
            <div className="flex items-center gap-3">
              <m.div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(135deg, rgba(200,151,58,0.18), rgba(200,151,58,0.06))", border: "1px solid rgba(200,151,58,0.25)" }}
                animate={{ rotate: [0, 4, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a830" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="3" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </m.div>
              <div>
                <h1
                  className={`font-semibold tracking-wide ${isFullscreen ? "text-lg" : "text-xl"}`}
                  style={{ color: "#f5e0a0", fontFamily: FONT_UI, letterSpacing: "0.04em" }}
                >
                  {state?.title || "Lucky Card"}
                </h1>
                <p className="text-xs mt-0.5" style={{ color: "#b8a060", fontFamily: FONT_UI }}>
                  {state ? `${flippedCount} / ${totalCount} thẻ đã lật` : "Tạo bộ thẻ để bắt đầu"}
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5">
              {state && (
                <>
                  <button
                    onClick={() => setSoundEnabled((p) => !p)}
                    className="flex items-center justify-center rounded-xl transition-all hover:bg-white/10"
                    style={{
                      width: 36, height: 36,
                      border: "1px solid rgba(200,151,58,0.3)",
                      color: soundEnabled ? "#d4a830" : "#8a7040",
                      background: "rgba(200,151,58,0.08)",
                    }}
                    title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                  >
                    {soundEnabled ? <Icons.SoundOn /> : <Icons.SoundOff />}
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center justify-center rounded-xl transition-all hover:bg-white/10"
                    style={{
                      width: 36, height: 36,
                      border: "1px solid rgba(200,151,58,0.3)",
                      color: "#d4a830",
                      background: "rgba(200,151,58,0.08)",
                    }}
                    title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                  >
                    {isFullscreen ? <Icons.Compress /> : <Icons.Expand />}
                  </button>

                  <div className="w-px h-6 mx-0.5" style={{ background: "rgba(200,151,58,0.2)" }} />

                  <button
                    onClick={handleShuffle}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold tracking-widest uppercase transition-all hover:bg-white/10"
                    style={{ border: "1px solid rgba(200,151,58,0.3)", color: "#d4a830", background: "rgba(200,151,58,0.08)", fontFamily: FONT_UI }}
                  >
                    <Icons.Shuffle />
                    <span className="hidden sm:inline">Xáo</span>
                  </button>

                  <button
                    onClick={handleFlipAll}
                    disabled={flippedCount === totalCount}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold tracking-widest uppercase transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ border: "1px solid rgba(200,151,58,0.3)", color: "#d4a830", background: "rgba(200,151,58,0.08)", fontFamily: FONT_UI }}
                  >
                    <Icons.FlipAll />
                    <span className="hidden sm:inline">Lật tất cả</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold tracking-widest uppercase transition-all hover:bg-white/10"
                    style={{ border: "1px solid rgba(160,60,60,0.35)", color: "#e08080", background: "rgba(160,60,60,0.08)", fontFamily: FONT_UI }}
                  >
                    <Icons.Trash />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </>
              )}
              {!state && (
                <button
                  onClick={() => setShowSetup(true)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #c8973a, #a87820)", color: "#1a1208", boxShadow: "0 4px 20px rgba(200,151,58,0.3)", fontFamily: FONT_UI }}
                >
                  <Icons.Plus />
                  Tạo bộ thẻ
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {state && (
            <div className="mt-5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,151,58,0.1)" }}>
              <m.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6b4010, #c8973a, #f0c040)" }}
                initial={{ width: 0 }}
                animate={{ width: `${totalCount > 0 ? (flippedCount / totalCount) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          )}

          {/* Completion banner */}
          <AnimatePresence>
            {state && flippedCount === totalCount && totalCount > 0 && (
              <m.div
                className="mt-3 flex items-center justify-center gap-3 rounded-xl py-2.5 px-4"
                style={{ background: "rgba(212,168,48,0.08)", border: "1px solid rgba(212,168,48,0.22)" }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M7,0 L9,5 L14,7 L9,9 L7,14 L5,9 L0,7 L5,5 Z" fill="#d4a830" opacity="0.8" />
                </svg>
                <span className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: "#f0d080", fontFamily: FONT_UI }}>
                  Tất cả lá bài đã được lật
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M7,0 L9,5 L14,7 L9,9 L7,14 L5,9 L0,7 L5,5 Z" fill="#d4a830" opacity="0.8" />
                </svg>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card Grid */}
        {state && state.cards.length > 0 && (
          <m.div
            className="grid gap-5 sm:gap-6 lg:gap-8"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${
                totalCount <= 3 ? "280px" : totalCount <= 6 ? "240px" : totalCount <= 12 ? "210px" : "180px"
              }, 1fr))`,
            }}
            layout
          >
            {state.cards.map((card, i) => (
              <LuckyCardItem key={card.id} card={card} index={i} onFlip={handleFlip} />
            ))}
          </m.div>
        )}

        {/* Empty state */}
        {!state && (
          <m.div
            className="flex flex-col items-center justify-center py-24"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative mb-10">
              <m.div
                className="absolute -inset-10 rounded-full opacity-15"
                style={{ background: "radial-gradient(circle, #c8973a, transparent 70%)" }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
                transition={{ duration: 3.5, repeat: Infinity }}
              />
              <m.div
                className="relative z-10 flex items-center justify-center rounded-3xl"
                style={{
                  width: 90, height: 90,
                  background: "linear-gradient(135deg, rgba(200,151,58,0.14), rgba(200,151,58,0.05))",
                  border: "1px solid rgba(200,151,58,0.25)",
                }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4a830" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
                  <rect x="2" y="3" width="20" height="18" rx="3" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </m.div>
              {[0, 1, 2].map((i) => (
                <m.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ width: 5, height: 5, background: "#d4a830", boxShadow: "0 0 6px #d4a830", top: "50%", left: "50%" }}
                  animate={{
                    x: Math.cos((i * 120 * Math.PI) / 180) * 52,
                    y: Math.sin((i * 120 * Math.PI) / 180) * 52,
                    opacity: [0.2, 0.8, 0.2],
                  }}
                  transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
                />
              ))}
            </div>

            <h2
              className="text-xl font-semibold mb-2 tracking-wide"
              style={{ color: "#f5e0a0", fontFamily: FONT_DISPLAY, letterSpacing: "0.08em" }}
            >
              Lucky Card
            </h2>
            <p className="text-sm mb-10 text-center max-w-xs leading-relaxed" style={{ color: "#b8a060", fontFamily: FONT_UI }}>
              Tạo bộ thẻ bằng cách nhập nội dung thủ công hoặc upload file Excel / CSV
            </p>

            <div className="flex items-center gap-3 mb-8 w-36">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,151,58,0.35))" }} />
              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4,0 L5,3 L8,4 L5,5 L4,8 L3,5 L0,4 L3,3 Z" fill="#c8973a" opacity="0.6" /></svg>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(200,151,58,0.35), transparent)" }} />
            </div>

            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 rounded-xl px-7 py-3 text-[11px] font-bold tracking-[0.15em] uppercase transition-all hover:brightness-110 hover:-translate-y-1"
              style={{ background: "linear-gradient(135deg, #c8973a, #a87820)", color: "#1a1208", boxShadow: "0 6px 30px rgba(200,151,58,0.35)", fontFamily: FONT_UI }}
            >
              <Icons.Plus />
              Tạo bộ thẻ mới
            </button>
          </m.div>
        )}
      </div>

      <AnimatePresence>{showSetup && <SetupModal onSetup={handleSetup} onClose={() => setShowSetup(false)} />}</AnimatePresence>
    </div>
  );
}

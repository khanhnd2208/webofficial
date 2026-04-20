'use client';

/* ════════════════════════════════════════════════════════════════════════
   /vocabulary/[id]/guess-who/page.tsx — "Guess Who I Am" game
   
   Game Loop:
   1. Show one hint (randomly picked from pool, fixed for this word)
   2. Player types in letter-box inputs — case-insensitive
   3. Submit → correct: score via SCORE_MAP; wrong: lose 1 heart
   4. 9 hearts → game over, reveal answer, show 0 pts, continue
   5. After all eligible words → session summary screen
   
   Sound:   useSoundEffects (HTML5 Audio, graceful silence if missing)
   State:   useGuessWhoSession (session-only, never written to DB)
   ════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useGuessWhoSession, SCORE_MAP, MAX_HEARTS } from '@/lib/vocab/useGuessWhoSession';
import type { GuessWhoWord, WordResult } from '@/lib/vocab/useGuessWhoSession';
import GuessWhoInput from '@/components/vocab/GuessWhoInput';
import { useSoundEffects } from '@/lib/vocab/useSoundEffects';

// ─── Heart icons ──────────────────────────────────────────────────────────────
function HeartIcon({ filled, danger }: { filled: boolean; danger: boolean }) {
  return (
    <svg
      className={`h-6 w-6 transition-all duration-300 ${
        filled
          ? danger
            ? 'text-red-500 scale-110 animate-pulse'
            : 'text-red-400'
          : 'text-border'
      }`}
      fill={filled ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function HeartsBar({ hearts }: { hearts: number }) {
  const danger = hearts <= 3;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <HeartIcon key={i} filled={i < hearts} danger={danger && i < hearts} />
      ))}
    </div>
  );
}

// ─── Session Summary ──────────────────────────────────────────────────────────
function SessionSummary({
  totalScore,
  wordResults,
  setId,
  onReplay,
}: {
  totalScore: number;
  wordResults: WordResult[];
  setId: string;
  onReplay: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <div className="text-5xl mb-4">🏆</div>
      <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
        Kết thúc!
      </h2>
      <p className="mt-2 text-sm text-foreground-secondary">
        Tổng điểm:&nbsp;
        <span className="text-2xl font-black text-accent tabular-nums">{totalScore.toLocaleString()}</span>
      </p>

      <div className="mt-8 divide-y divide-border border border-border text-left">
        {wordResults.map((r, i) => (
          <div key={r.wordId} className="flex items-center gap-4 px-4 py-3">
            <span className="shrink-0 text-xs font-bold text-muted">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{r.term}</p>
              <p className="text-[11px] text-muted">
                {r.trialUsed === 0 ? 'Hết mạng' : `Lần ${r.trialUsed}`}
              </p>
            </div>
            <span className={`text-sm font-black tabular-nums ${r.score === 0 ? 'text-error' : r.score >= 800 ? 'text-success' : 'text-foreground'}`}>
              {r.score === 0 ? '—' : `+${r.score}`}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onReplay}
          className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
        >
          🔄 Chơi lại
        </button>
        <Link
          href={`/vocabulary/${setId}`}
          className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground active:scale-95"
        >
          Về trang bộ từ
        </Link>
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────
function GuessWhoGame({
  words,
  setId,
}: {
  words: GuessWhoWord[];
  setId: string;
}) {
  const session = useGuessWhoSession(words);
  const sounds = useSoundEffects();

  const [inputValues, setInputValues] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | 'game_over' | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  // Reset inputs when word changes
  useEffect(() => {
    if (session.currentWord) {
      setInputValues(Array(session.currentWord.term.length).fill(''));
      setLastResult(null);
      sounds.resetDangerFlag();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentWord?.id]);

  // Trigger danger sound when hearts drop to ≤ 3
  useEffect(() => {
    sounds.playDangerAlert(session.hearts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hearts]);

  const handleSubmit = useCallback(() => {
    if (!session.currentWord || session.gameStatus !== 'playing') return;

    // Build guess from input values
    const termChars = Array.from(session.currentWord.term);
    const guess = termChars.map((ch, i) => {
      const isInput = !/[^a-zA-Z0-9]/.test(ch);
      return isInput ? (inputValues[i] ?? '') : ch;
    }).join('');

    const result = session.submitGuess(guess);
    setLastResult(result);

    if (result === 'correct') {
      sounds.playSuccess();
    } else if (result === 'game_over') {
      sounds.playGameOver();
    } else {
      sounds.playHeartLost();
      // Trigger shake animation
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  }, [session, inputValues, sounds]);

  // Enter key submits
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && session.gameStatus === 'playing') handleSubmit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSubmit, session.gameStatus]);

  // ── Session complete ──
  if (session.gameStatus === 'session_complete') {
    return (
      <SessionSummary
        totalScore={session.totalScore}
        wordResults={session.wordResults}
        setId={setId}
        onReplay={() => setSessionKey((k) => k + 1)}
      />
    );
  }

  if (!session.currentWord) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted">Không có từ nào có gợi ý. Hãy thêm gợi ý trong trang chỉnh sửa.</p>
      </div>
    );
  }

  const { currentWord, currentHint, hearts, trial, gameStatus, totalScore } = session;
  const isPaused = gameStatus === 'word_failed';
  const isGameOver = isPaused && lastResult === 'game_over';
  const isCorrect = isPaused && lastResult === 'correct';
  const danger = hearts <= 3 && !isPaused;
  const trialScore = SCORE_MAP[trial - 1] ?? 0;
  const progress = ((session.wordIndex) / session.eligibleWords.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Progress bar */}
      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          {session.wordIndex + 1} / {session.eligibleWords.length}
        </span>
        <span className="text-sm font-black tabular-nums text-foreground">
          {totalScore.toLocaleString()} điểm
        </span>
      </div>

      {/* Hearts bar */}
      <div className="flex items-center justify-center mb-6">
        <HeartsBar hearts={hearts} />
      </div>

      {/* Hint card */}
      <div className={`rounded-2xl border p-6 mb-8 transition-all duration-300 ${
        danger && !isPaused
          ? 'border-red-400 bg-red-50 dark:bg-red-950/20 animate-[pulse_1.5s_ease-in-out_infinite]'
          : 'border-border bg-surface'
      }`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-1">
          💡 Gợi ý
          {danger && !isPaused && (
            <span className="ml-1 rounded-full bg-red-100 dark:bg-red-900/50 px-2 py-0.5 text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
              Nguy hiểm!
            </span>
          )}
        </p>
        <p className="text-base leading-relaxed text-foreground font-medium">
          {currentHint}
        </p>
      </div>

      {/* Input area */}
      <div className="mb-6">
        {/* Potential score indicator */}
        {!isPaused && (
          <p className="text-center text-xs text-muted mb-3">
            Đúng ngay bây giờ sẽ được{' '}
            <span className="font-black text-accent">{trialScore}</span> điểm
          </p>
        )}

        <GuessWhoInput
          term={currentWord.term}
          values={isPaused ? Array.from(currentWord.term) : inputValues}
          onChange={setInputValues}
          disabled={isPaused}
          reveal={isGameOver}
          shake={shake}
        />
      </div>

      {/* Result overlay */}
      {isPaused && (
        <div className={`rounded-xl border p-4 mb-6 text-center transition-all ${
          isCorrect
            ? 'border-success bg-success-subtle text-success'
            : 'border-error bg-error-subtle text-error'
        }`}>
          {isCorrect ? (
            <>
              <p className="text-lg font-black">🎉 Chính xác!</p>
              <p className="text-sm mt-1">
                +<span className="font-black">{SCORE_MAP[session.wordResults[session.wordResults.length - 1]?.trialUsed - 1] ?? 0}</span> điểm
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-black">💀 Hết mạng!</p>
              <p className="text-sm mt-1 font-medium">
                Đáp án: <span className="font-black">{currentWord.term}</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3">
        {!isPaused ? (
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-8 py-3 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95 disabled:opacity-50"
            disabled={inputValues.filter(v => v).length === 0}
          >
            Xác nhận → Enter
          </button>
        ) : (
          <button
            onClick={session.nextWord}
            className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-transparent hover:text-accent active:scale-95"
          >
            Từ tiếp theo →
          </button>
        )}
      </div>

      {/* Trial info */}
      {!isPaused && (
        <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted/40">
          Lần thử {trial} · {MAX_HEARTS - trial + 1 > 0 ? MAX_HEARTS - trial + 1 : 0} lần còn lại · Enter để xác nhận
        </p>
      )}
    </div>
  );
}

// ─── Page wrapper (fetches data) ──────────────────────────────────────────────
export default function GuessWhoPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [words, setWords] = useState<GuessWhoWord[] | null>(null);
  const [error, setError] = useState('');
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    params.then(async ({ id: paramId }) => {
      setId(paramId);
      const res = await fetch(`/api/vocab-sets/${paramId}`);
      const json = await res.json();
      if (!json.ok) { setError(json.error); return; }
      setWords((json.data.set?.words ?? json.data.words ?? []) as GuessWhoWord[]);
    });
  }, [params]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-error">{error}</p>
      </main>
    );
  }

  if (words === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </main>
    );
  }

  const eligibleCount = words.filter(
    (w) => (w.hintsHard.length + w.hintsMedium.length + w.hintsEasy.length) > 0
  ).length;

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href={`/vocabulary/${id}`}
            className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
          >
            ← Bộ từ
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              🎮 Guess Who I Am
            </span>
            <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold text-muted">
              {eligibleCount} từ
            </span>
          </div>
        </div>
      </div>

      {eligibleCount === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-4xl">🤔</div>
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            Chưa có gợi ý nào
          </h2>
          <p className="max-w-sm text-sm text-foreground-secondary">
            Bộ từ này chưa có gợi ý Guess Who. Admin cần thêm gợi ý trong tab Quản lí cửa hàng.
          </p>
          <Link
            href="/vocabulary/store"
            className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background hover:bg-transparent hover:text-foreground transition-all"
          >
            Đến cửa hàng từ vựng
          </Link>
        </div>
      ) : (
        <GuessWhoGame key={gameKey} words={words} setId={id} />
      )}
    </main>
  );
}

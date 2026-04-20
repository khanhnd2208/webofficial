/* ════════════════════════════════════════════════════════════════════════
   useGuessWhoSession.ts — Session state for "Guess Who I Am" game

   Rules (v2 — timestamp scoring):
   • Only words with at least 1 hint (hard | medium | easy)
   • Each word: show ONE random hint (fixed for this session)
   • Unlimited guesses per word; wrong guess → penaltyMs += 5 000
   • Session score = max(0, 10 000 − effectiveElapsed × 100)
     where effectiveElapsed = (sessionEnd − sessionStart + penaltyMs) / 1 000
   • Hearts/lives system REMOVED
   ════════════════════════════════════════════════════════════════════════ */
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

export interface GuessWhoWord {
  id: string;
  term: string;
  definition: string;
  hintsHard: string[];
  hintsMedium: string[];
  hintsEasy: string[];
}

export type WordResult = {
  wordId: string;
  term: string;
  wrongGuesses: number;
};

export type GameStatus = 'playing' | 'word_done' | 'session_complete';

export interface GuessWhoSessionState {
  eligibleWords: GuessWhoWord[];
  wordIndex: number;
  currentWord: GuessWhoWord | null;
  currentHint: string;
  gameStatus: GameStatus;
  wordResults: WordResult[];
  wrongGuessesThisWord: number;
  sessionStartTime: number;
  penaltyMs: number;
  sessionEndTime: number;
  submitGuess: (guess: string) => 'correct' | 'wrong';
  nextWord: () => void;
}

function pickRandomHint(word: GuessWhoWord): string {
  const pool = [...word.hintsHard, ...word.hintsMedium, ...word.hintsEasy];
  if (pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

function isEligible(w: GuessWhoWord): boolean {
  return (w.hintsHard.length + w.hintsMedium.length + w.hintsEasy.length) > 0;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useGuessWhoSession(words: GuessWhoWord[]): GuessWhoSessionState {
  const eligibleWords = useMemo(
    () => shuffleArray(words.filter(isEligible)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words.map((w) => w.id).join(',')]
  );

  const sessionStartTimeRef = useRef<number>(Date.now());

  const [wordIndex, setWordIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [wrongGuessesThisWord, setWrongGuessesThisWord] = useState(0);
  const [penaltyMs, setPenaltyMs] = useState(0);
  const [sessionEndTime, setSessionEndTime] = useState(0);
  const [currentHint, setCurrentHint] = useState<string>(() => {
    const w = eligibleWords[0];
    return w ? pickRandomHint(w) : '';
  });

  const currentWord = eligibleWords[wordIndex] ?? null;

  const submitGuess = useCallback((guess: string): 'correct' | 'wrong' => {
    if (!currentWord || gameStatus !== 'playing') return 'wrong';

    const isCorrect = guess.trim().toLowerCase() === currentWord.term.toLowerCase();

    if (isCorrect) {
      setWordResults((prev) => [
        ...prev,
        { wordId: currentWord.id, term: currentWord.term, wrongGuesses: wrongGuessesThisWord },
      ]);
      setGameStatus('word_done');
      return 'correct';
    }

    // Wrong guess: +5s penalty
    setPenaltyMs((prev) => prev + 5_000);
    setWrongGuessesThisWord((prev) => prev + 1);
    return 'wrong';
  }, [currentWord, gameStatus, wrongGuessesThisWord]);

  const nextWord = useCallback(() => {
    const nextIndex = wordIndex + 1;
    if (nextIndex >= eligibleWords.length) {
      setSessionEndTime(Date.now());
      setGameStatus('session_complete');
      return;
    }
    const nextWordObj = eligibleWords[nextIndex];
    setWordIndex(nextIndex);
    setWrongGuessesThisWord(0);
    setCurrentHint(pickRandomHint(nextWordObj));
    setGameStatus('playing');
  }, [wordIndex, eligibleWords]);

  return {
    eligibleWords,
    wordIndex,
    currentWord,
    currentHint,
    gameStatus,
    wordResults,
    wrongGuessesThisWord,
    sessionStartTime: sessionStartTimeRef.current,
    penaltyMs,
    sessionEndTime,
    submitGuess,
    nextWord,
  };
}

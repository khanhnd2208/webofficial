/* ════════════════════════════════════════════════════════════════════════
   useGuessWhoSession.ts — Session state for "Guess Who I Am" game
   
   Rules:
   • Only words with (hintsHard + hintsMedium + hintsEasy).length > 0
   • Each word: pick ONE random hint from the full pool (fixed for session)
   • 9 hearts per word; lose 1 per wrong guess
   • Scoring via look-up table: SCORE_MAP[trial - 1]
   • Game over at trial 10 (after 9 wrong) → score = 0
   • NO database writes — session state only
   ════════════════════════════════════════════════════════════════════════ */
'use client';

import { useCallback, useMemo, useState } from 'react';

export const SCORE_MAP = [1000, 900, 800, 600, 500, 400, 200, 100, 50] as const;
export const MAX_HEARTS = 9;

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
  score: number;
  trialUsed: number; // 0 = game over (failed)
};

export type GameStatus = 'playing' | 'word_failed' | 'session_complete';

export interface GuessWhoSessionState {
  /** Words eligible for the game (have at least 1 hint) */
  eligibleWords: GuessWhoWord[];
  /** Index into eligibleWords for the current word */
  wordIndex: number;
  currentWord: GuessWhoWord | null;
  /** The single randomly-selected hint shown for the entire current word */
  currentHint: string;
  /** 1-based trial counter (increments on wrong guess) */
  trial: number;
  /** Hearts remaining (starts at 9, decreases on wrong guess) */
  hearts: number;
  gameStatus: GameStatus;
  /** Session accumulated score */
  totalScore: number;
  wordResults: WordResult[];
  /** Handle a user guess attempt */
  submitGuess: (guess: string) => 'correct' | 'wrong' | 'game_over';
  /** Advance to the next word (called after word_failed or correct) */
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

  const [wordIndex, setWordIndex] = useState(0);
  const [trial, setTrial] = useState(1);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [totalScore, setTotalScore] = useState(0);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [currentHint, setCurrentHint] = useState<string>(() => {
    const w = eligibleWords[0];
    return w ? pickRandomHint(w) : '';
  });

  const currentWord = eligibleWords[wordIndex] ?? null;

  const submitGuess = useCallback((guess: string): 'correct' | 'wrong' | 'game_over' => {
    if (!currentWord || gameStatus !== 'playing') return 'wrong';

    const isCorrect = guess.trim().toLowerCase() === currentWord.term.toLowerCase();

    if (isCorrect) {
      const score = SCORE_MAP[trial - 1] ?? 0;
      setTotalScore((prev) => prev + score);
      setWordResults((prev) => [
        ...prev,
        { wordId: currentWord.id, term: currentWord.term, score, trialUsed: trial },
      ]);
      setGameStatus('word_failed'); // reuse state to pause before nextWord
      return 'correct';
    }

    // Wrong guess
    const newHearts = hearts - 1;
    const newTrial = trial + 1;
    setHearts(newHearts);
    setTrial(newTrial);

    if (newHearts <= 0) {
      // Game over for this word
      setWordResults((prev) => [
        ...prev,
        { wordId: currentWord.id, term: currentWord.term, score: 0, trialUsed: 0 },
      ]);
      setGameStatus('word_failed');
      return 'game_over';
    }

    return 'wrong';
  }, [currentWord, gameStatus, hearts, trial]);

  const nextWord = useCallback(() => {
    const nextIndex = wordIndex + 1;
    if (nextIndex >= eligibleWords.length) {
      setGameStatus('session_complete');
      return;
    }
    const nextWordObj = eligibleWords[nextIndex];
    setWordIndex(nextIndex);
    setTrial(1);
    setHearts(MAX_HEARTS);
    setCurrentHint(pickRandomHint(nextWordObj));
    setGameStatus('playing');
  }, [wordIndex, eligibleWords]);

  return {
    eligibleWords,
    wordIndex,
    currentWord,
    currentHint,
    trial,
    hearts,
    gameStatus,
    totalScore,
    wordResults,
    submitGuess,
    nextWord,
  };
}

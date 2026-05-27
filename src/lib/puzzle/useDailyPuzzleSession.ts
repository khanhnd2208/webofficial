'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DailyPuzzlePublic,
  PuzzleAttemptPublic,
  PuzzleStatsPublic,
  PuzzleSolution,
  PuzzleNotes,
  SubmitResult,
  LeaderboardEntryPublic,
} from '@/types/puzzle';
import { compilePuzzle, getCellMeta } from '@/lib/puzzle/compiler';
import { getCandidates } from '@/lib/puzzle/candidates';
import {
  isAnswerComplete,
  isLegalUserMove,
  describeIllegalUserMove,
  findConflicts,
  sanitizeUserValuesOnly,
  buildDisplayStateFromCompiled,
} from '@/lib/puzzle/validator';
import type { CellMeta, CompiledPuzzle } from '@/lib/puzzle/types';
import { createUndoStack } from '@/lib/puzzle/undoStack';
import { mapStartErrorMessage } from '@/lib/puzzle/startErrorMessage';
import { countEmptyPlayableCells } from '@/lib/puzzle/playableStats';
import { cellKey } from '@/lib/puzzle/cellKey';
import type { SaveStatus } from '@/components/puzzle/SaveStatusBadge';

const DRAFT_KEY_PREFIX = 'thinkgrid-draft-';

export type PuzzlePhase = 'loading' | 'idle' | 'playing' | 'solved' | 'error';

export interface DailyPuzzleSessionState {
  phase: PuzzlePhase;
  puzzle: DailyPuzzlePublic | null;
  compiled: CompiledPuzzle | null;
  attempt: PuzzleAttemptPublic | null;
  stats: PuzzleStatsPublic | null;
  leaderboard: LeaderboardEntryPublic[];
  selectedCell: string | null;
  selectedCellMeta: CellMeta | null;
  entries: PuzzleSolution;
  notes: PuzzleNotes;
  notesMode: boolean;
  mistakes: number;
  conflictCells: Set<string>;
  candidates: number[];
  errorMessage: string | null;
  inputHint: string | null;
  rejectPulse: number;
  selectedCellNotes: number[];
  submitResult: SubmitResult | null;
  elapsedMs: number;
  selectCell: (key: string) => void;
  setValue: (value: number | null) => void;
  pickNumber: (value: number) => void;
  toggleNote: (value: number) => void;
  clearCell: () => void;
  toggleNotesMode: () => void;
  startGame: () => Promise<void>;
  submitAnswer: () => Promise<void>;
  reload: () => Promise<void>;
  undo: () => void;
  canUndo: boolean;
  saveStatus: SaveStatus;
  emptyCellCount: number;
  moveSelection: (dir: 'up' | 'down' | 'left' | 'right') => void;
  trySubmit: () => void;
}

function draftKey(puzzleId: string, dateKey: string): string {
  return `${DRAFT_KEY_PREFIX}${puzzleId}-${dateKey}`;
}

function loadLocalDraft(
  puzzleId: string,
  dateKey: string,
): { entries?: PuzzleSolution; notes?: PuzzleNotes } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(draftKey(puzzleId, dateKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalDraft(
  puzzleId: string,
  dateKey: string,
  userEntries: PuzzleSolution,
  notes: PuzzleNotes,
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    draftKey(puzzleId, dateKey),
    JSON.stringify({ entries: userEntries, notes }),
  );
}

function clearLocalDraft(puzzleId: string, dateKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(draftKey(puzzleId, dateKey));
}

export type PuzzleSessionOptions = {
  /** Selected puzzle from catalog. Takes precedence over dateOverride. */
  puzzleId?: string | null;
  /** Staging only: load puzzle by calendar date when puzzleId omitted. */
  dateOverride?: string | null;
};

function sessionQuery(opts: PuzzleSessionOptions): string {
  const params = new URLSearchParams();
  if (opts.puzzleId) params.set('puzzleId', opts.puzzleId);
  else if (opts.dateOverride) params.set('date', opts.dateOverride);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function useDailyPuzzleSession(
  isLoggedIn: boolean,
  sessionOptions: PuzzleSessionOptions = {},
): DailyPuzzleSessionState {
  const puzzleId = sessionOptions.puzzleId ?? null;
  const dateOverride = sessionOptions.dateOverride ?? null;
  const [phase, setPhase] = useState<PuzzlePhase>('loading');
  const [puzzle, setPuzzle] = useState<DailyPuzzlePublic | null>(null);
  const [attempt, setAttempt] = useState<PuzzleAttemptPublic | null>(null);
  const [stats, setStats] = useState<PuzzleStatsPublic | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryPublic[]>([]);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [userEntries, setUserEntries] = useState<PuzzleSolution>({});
  const [notes, setNotes] = useState<PuzzleNotes>({});
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputHint, setInputHint] = useState<string | null>(null);
  const [rejectPulse, setRejectPulse] = useState(0);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const inputHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const undoStackRef = useRef(createUndoStack());
  const [canUndo, setCanUndo] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const userEntriesRef = useRef<PuzzleSolution>({});
  const notesRef = useRef<PuzzleNotes>({});

  useEffect(() => {
    userEntriesRef.current = userEntries;
    notesRef.current = notes;
  }, [userEntries, notes]);

  const syncCanUndo = useCallback(() => {
    setCanUndo(undoStackRef.current.canUndo);
  }, []);

  const pushUndoSnapshot = useCallback(() => {
    undoStackRef.current.push(userEntriesRef.current, notesRef.current);
    syncCanUndo();
  }, [syncCanUndo]);

  const compiled = useMemo(
    () => (puzzle ? compilePuzzle(puzzle.layout) : null),
    [puzzle],
  );

  const entries = useMemo(() => {
    if (!compiled) return {};
    return buildDisplayStateFromCompiled(userEntries, compiled);
  }, [userEntries, compiled]);

  const conflictCells = useMemo(() => {
    if (!compiled) return new Set<string>();
    return findConflicts(entries, compiled);
  }, [entries, compiled]);

  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCellMeta = useMemo(() => {
    if (!compiled || !selectedCell) return null;
    return getCellMeta(compiled, selectedCell);
  }, [compiled, selectedCell]);

  const candidates = useMemo(() => {
    if (!compiled || !selectedCellMeta) return [];
    return getCandidates(entries, selectedCellMeta, compiled);
  }, [compiled, selectedCellMeta, entries]);

  const selectedCellNotes = useMemo(
    () => (selectedCell ? (notes[selectedCell] ?? []) : []),
    [selectedCell, notes],
  );

  const emptyCellCount = useMemo(() => {
    if (!compiled) return 0;
    return countEmptyPlayableCells(entries, compiled);
  }, [entries, compiled]);

  const findFirstEditableKey = useCallback((): string | null => {
    if (!compiled) return null;
    for (const key of compiled.playableKeys) {
      const meta = getCellMeta(compiled, key);
      if (meta && !meta.isBlocked && !meta.isGiven) return key;
    }
    return null;
  }, [compiled]);

  const showInputHint = useCallback((message: string, durationMs = 1400) => {
    if (inputHintTimerRef.current) clearTimeout(inputHintTimerRef.current);
    setInputHint(message);
    inputHintTimerRef.current = setTimeout(() => setInputHint(null), durationMs);
  }, []);

  const bumpReject = useCallback(() => {
    setRejectPulse((n) => n + 1);
  }, []);

  const fetchLeaderboard = useCallback(
    async (forPuzzle?: { puzzleId: string; dateKey: string }) => {
      const params = new URLSearchParams();
      if (forPuzzle?.puzzleId) params.set('puzzleId', forPuzzle.puzzleId);
      else if (forPuzzle?.dateKey) params.set('date', forPuzzle.dateKey);
      const q = params.toString() ? `?${params}` : '';
      const res = await fetch(`/api/puzzle/leaderboard${q}`);
      const json = await res.json();
      if (json.ok) setLeaderboard(json.data.entries);
    },
    [],
  );

  const reload = useCallback(async () => {
    setPhase('loading');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/puzzle/today${sessionQuery({ puzzleId, dateOverride })}`);
      const json = await res.json();
      if (!json.ok) {
        setErrorMessage(json.error ?? 'Failed to load puzzle');
        setPhase('error');
        return;
      }

      const p = json.data.puzzle as DailyPuzzlePublic;
      setPuzzle(p);
      setAttempt(json.data.attempt);
      setStats(json.data.stats);
      await fetchLeaderboard({ puzzleId: p.id, dateKey: p.dateKey });

      const comp = compilePuzzle(p.layout);
      const local = loadLocalDraft(p.id, p.dateKey);
      const serverProgress = json.data.attempt?.progress as PuzzleSolution | undefined;
      const serverNotes = json.data.attempt?.notes as PuzzleNotes | undefined;

      const mergedUser = sanitizeUserValuesOnly(
        { ...serverProgress, ...local?.entries },
        comp,
      );
      setUserEntries(mergedUser);
      setNotes({ ...local?.notes, ...serverNotes });
      undoStackRef.current.clear();
      syncCanUndo();
      setMistakes(json.data.attempt?.mistakes ?? 0);

      if (json.data.attempt?.status === 'SOLVED') {
        setPhase('solved');
        if (json.data.attempt.durationMs) setElapsedMs(json.data.attempt.durationMs);
      } else if (json.data.attempt?.status === 'IN_PROGRESS' && json.data.attempt.startedAt) {
        startedAtRef.current = new Date(json.data.attempt.startedAt).getTime();
        setPhase('playing');
      } else {
        setPhase('idle');
      }
    } catch {
      setErrorMessage('Network error');
      setPhase('error');
    }
  }, [fetchLeaderboard, puzzleId, dateOverride, syncCanUndo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  useEffect(() => {
    if (phase !== 'playing' || !startedAtRef.current) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - (startedAtRef.current ?? Date.now()));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const persistProgress = useCallback(
    (nextUser: PuzzleSolution, nextNotes: PuzzleNotes) => {
      if (!puzzle || !compiled || !isLoggedIn || phase !== 'playing') return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');
      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/puzzle/attempt/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              puzzleId: puzzle.id,
              values: nextUser,
              notes: nextNotes,
            }),
          });
          if (res.ok) setSaveStatus('saved');
          else {
            saveLocalDraft(puzzle.id, puzzle.dateKey, nextUser, nextNotes);
            setSaveStatus('offline');
          }
        } catch {
          saveLocalDraft(puzzle.id, puzzle.dateKey, nextUser, nextNotes);
          setSaveStatus('offline');
        }
      }, 1500);
    },
    [puzzle, compiled, isLoggedIn, phase],
  );

  useEffect(() => {
    if (puzzle && compiled && phase === 'playing') {
      saveLocalDraft(puzzle.id, puzzle.dateKey, userEntries, notes);
      persistProgress(userEntries, notes);
    }
  }, [userEntries, notes, puzzle, compiled, phase, persistProgress]);

  const selectCell = useCallback(
    (key: string) => {
      if (!compiled) return;
      if (phase === 'idle') {
        showInputHint('Bấm «Bắt đầu chơi» để nhập số và bắt đầu đếm giờ.', 2800);
        return;
      }
      if (phase !== 'playing' && phase !== 'solved') return;
      const meta = getCellMeta(compiled, key);
      if (!meta || meta.isBlocked || meta.isGiven) return;
      setSelectedCell(key);
    },
    [compiled, phase, showInputHint],
  );

  const setValue = useCallback(
    (value: number | null) => {
      if (phase !== 'playing') return;
      if (!selectedCell || !selectedCellMeta || !compiled || selectedCellMeta.isGiven) return;

      // Clear/delete (null) always allowed on editable cells — not gated by isLegalUserMove.
      if (value !== null) {
        if (!isLegalUserMove(entries, selectedCellMeta, value, compiled)) {
          bumpReject();
          showInputHint(
            describeIllegalUserMove(entries, selectedCellMeta, value, compiled),
          );
          return;
        }
      }

      const prevVal = userEntriesRef.current[selectedCell];
      if (value === null && prevVal === undefined) return;
      if (value !== null && prevVal === value) return;

      pushUndoSnapshot();
      setUserEntries((prev) => {
        const next = { ...prev };
        if (value === null) delete next[selectedCell];
        else next[selectedCell] = value;
        return next;
      });
      if (value !== null) {
        setNotes((prev) => {
          if (!prev[selectedCell]) return prev;
          const next = { ...prev };
          delete next[selectedCell];
          return next;
        });
      }
    },
    [
      selectedCell,
      selectedCellMeta,
      compiled,
      entries,
      phase,
      pushUndoSnapshot,
      bumpReject,
      showInputHint,
    ],
  );

  const toggleNote = useCallback(
    (value: number) => {
      if (phase !== 'playing') return;
      if (!selectedCell || selectedCellMeta?.isGiven || selectedCellMeta?.isBlocked) return;
      if (userEntriesRef.current[selectedCell] !== undefined) return;
      if (selectedCellMeta?.maxAllowedValue && value > selectedCellMeta.maxAllowedValue) return;
      pushUndoSnapshot();
      setNotes((prev) => {
        const list = [...(prev[selectedCell] ?? [])];
        const idx = list.indexOf(value);
        if (idx >= 0) list.splice(idx, 1);
        else {
          if (list.length >= 9) return prev;
          list.push(value);
        }
        list.sort((a, b) => a - b);
        if (list.length === 0) {
          const next = { ...prev };
          delete next[selectedCell];
          return next;
        }
        return { ...prev, [selectedCell]: list };
      });
    },
    [selectedCell, selectedCellMeta, phase, pushUndoSnapshot],
  );

  const pickNumber = useCallback(
    (value: number) => {
      if (phase !== 'playing' || !selectedCell || !selectedCellMeta || !compiled) return;
      if (notesMode) {
        if (userEntriesRef.current[selectedCell] !== undefined) {
          showInputHint('Xóa số trong ô trước khi ghi chú.');
          bumpReject();
          return;
        }
        if (
          selectedCellMeta.maxAllowedValue &&
          value > selectedCellMeta.maxAllowedValue
        ) {
          showInputHint(
            `Chỉ ghi chú số từ 1 đến ${selectedCellMeta.maxAllowedValue}.`,
          );
          bumpReject();
          return;
        }
        toggleNote(value);
        return;
      }
      if (!isLegalUserMove(entries, selectedCellMeta, value, compiled)) {
        bumpReject();
        showInputHint(
          describeIllegalUserMove(entries, selectedCellMeta, value, compiled),
        );
        return;
      }
      setValue(value);
    },
    [
      phase,
      selectedCell,
      selectedCellMeta,
      compiled,
      notesMode,
      entries,
      toggleNote,
      setValue,
      bumpReject,
      showInputHint,
    ],
  );

  const clearCell = useCallback(() => {
    if (phase !== 'playing') return;
    if (!selectedCell || selectedCellMeta?.isGiven) return;
    const hadValue = userEntriesRef.current[selectedCell] !== undefined;
    const hadNotes = (notesRef.current[selectedCell]?.length ?? 0) > 0;
    if (!hadValue && !hadNotes) return;

    pushUndoSnapshot();
    setUserEntries((prev) => {
      const next = { ...prev };
      delete next[selectedCell];
      return next;
    });
    setNotes((prev) => {
      const next = { ...prev };
      delete next[selectedCell];
      return next;
    });
  }, [selectedCell, selectedCellMeta, phase, pushUndoSnapshot]);

  const toggleNotesMode = useCallback(() => setNotesMode((v) => !v), []);

  const startGame = useCallback(async () => {
    if (!isLoggedIn) {
      window.location.href = '/login?callbackUrl=/puzzle';
      return;
    }
    setErrorMessage(null);
    const res = await fetch(`/api/puzzle/attempt/start${sessionQuery({ puzzleId, dateOverride })}`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!json.ok) {
      setErrorMessage(mapStartErrorMessage(json.error, res.status));
      return;
    }
    const att = json.data.attempt;
    setAttempt(att);
    if (att.status === 'SOLVED') {
      if (att.durationMs) setElapsedMs(att.durationMs);
      setPhase('solved');
      return;
    }
    startedAtRef.current = new Date(att.startedAt).getTime();
    undoStackRef.current.clear();
    syncCanUndo();
    setPhase('playing');
    setSaveStatus('saved');
    const first = findFirstEditableKey();
    if (first) setSelectedCell(first);
  }, [isLoggedIn, puzzleId, dateOverride, syncCanUndo, findFirstEditableKey]);

  const undo = useCallback(() => {
    if (phase !== 'playing') return;
    const prev = undoStackRef.current.pop();
    if (!prev) {
      showInputHint('Không còn bước để hoàn tác (Ctrl+Z).', 2000);
      syncCanUndo();
      return;
    }
    setUserEntries(prev.userEntries);
    setNotes(prev.notes);
    syncCanUndo();
  }, [phase, syncCanUndo, showInputHint]);

  const submitAnswer = useCallback(async () => {
    if (!puzzle || !compiled || !isLoggedIn) return;
    setErrorMessage(null);

    const res = await fetch('/api/puzzle/attempt/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puzzleId: puzzle.id, answer: entries }),
    });
    const json = await res.json();
    if (!json.ok) {
      setErrorMessage(json.error ?? 'Submit failed');
      return;
    }

    const data = json.data;
    if (data.correct) {
      setPhase('solved');
      setSubmitResult({
        correct: true,
        durationMs: data.durationMs,
        mistakes: data.mistakes,
        streak: data.stats,
        shareText: data.shareText,
      });
      if (data.durationMs) setElapsedMs(data.durationMs);
      if (data.stats) setStats(data.stats);
      if (data.mistakes !== undefined) setMistakes(data.mistakes);
      clearLocalDraft(puzzle.id, puzzle.dateKey);
      await fetchLeaderboard({ puzzleId: puzzle.id, dateKey: puzzle.dateKey });
      const refreshRes = await fetch(
        `/api/puzzle/today${sessionQuery({ puzzleId: puzzle.id, dateOverride })}`,
      );
      const refreshJson = await refreshRes.json();
      if (refreshJson.ok) setAttempt(refreshJson.data.attempt);
    } else {
      if (data.mistakes !== undefined) setMistakes(data.mistakes);
      if (data.incomplete) {
        const empty = countEmptyPlayableCells(entries, compiled);
        showInputHint(`Bạn còn ${empty} ô chưa điền.`, 2800);
        setSubmitResult({ correct: false, incomplete: true });
        return;
      }
      if (data.hasConflict) {
        const n = (data.wrongCells as string[] | undefined)?.length ?? conflictCells.size;
        showInputHint(
          `Có ${n} ô đang mâu thuẫn. Hãy kiểm tra các ô được tô đỏ.`,
          2800,
        );
        setSubmitResult({
          correct: false,
          wrongCells: data.wrongCells,
          hasConflict: true,
        });
        return;
      }
      showInputHint(
        'Bảng chưa đúng. Hãy kiểm tra lại các đoạn ngang và dọc.',
        2800,
      );
      setSubmitResult({ correct: false, wrongCells: data.wrongCells });
    }
  }, [
    puzzle,
    compiled,
    isLoggedIn,
    entries,
    fetchLeaderboard,
    dateOverride,
    conflictCells.size,
    showInputHint,
  ]);

  const trySubmit = useCallback(() => {
    if (!compiled || phase !== 'playing') return;
    if (emptyCellCount > 0) {
      showInputHint(`Bạn còn ${emptyCellCount} ô chưa điền.`, 2500);
      return;
    }
    if (conflictCells.size > 0) {
      showInputHint(
        `Có ${conflictCells.size} ô đang mâu thuẫn. Hãy kiểm tra các ô được tô đỏ.`,
        2800,
      );
      return;
    }
    void submitAnswer();
  }, [compiled, phase, emptyCellCount, conflictCells.size, showInputHint, submitAnswer]);

  const moveSelection = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (phase !== 'playing' || !compiled) return;
      let row = 0;
      let col = 0;
      if (selectedCell) {
        const [r, c] = selectedCell.split(',').map(Number);
        row = r;
        col = c;
      } else {
        const first = findFirstEditableKey();
        if (first) {
          setSelectedCell(first);
          return;
        }
      }
      const size = compiled.layout.size;
      const delta = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
      let nr = row + delta[0];
      let nc = col + delta[1];
      for (let i = 0; i < size * size; i++) {
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
        const key = cellKey(nr, nc);
        const meta = getCellMeta(compiled, key);
        if (meta && !meta.isBlocked && !meta.isGiven) {
          setSelectedCell(key);
          return;
        }
        nr += delta[0];
        nc += delta[1];
      }
    },
    [phase, compiled, selectedCell, findFirstEditableKey],
  );

  return {
    phase,
    puzzle,
    compiled,
    attempt,
    stats,
    leaderboard,
    selectedCell,
    selectedCellMeta,
    entries,
    notes,
    notesMode,
    mistakes,
    conflictCells,
    candidates,
    errorMessage,
    inputHint,
    rejectPulse,
    selectedCellNotes,
    submitResult,
    elapsedMs,
    selectCell,
    setValue,
    pickNumber,
    toggleNote,
    clearCell,
    toggleNotesMode,
    startGame,
    submitAnswer,
    reload,
    undo,
    canUndo,
    saveStatus,
    emptyCellCount,
    moveSelection,
    trySubmit,
  };
}

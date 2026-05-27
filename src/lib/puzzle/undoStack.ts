import type { PuzzleNotes, PuzzleSolution } from '@/types/puzzle';

export interface PuzzleUndoSnapshot {
  userEntries: PuzzleSolution;
  notes: PuzzleNotes;
}

const MAX_UNDO_DEPTH = 80;

function cloneSnapshot(userEntries: PuzzleSolution, notes: PuzzleNotes): PuzzleUndoSnapshot {
  return {
    userEntries: { ...userEntries },
    notes: JSON.parse(JSON.stringify(notes)) as PuzzleNotes,
  };
}

function snapshotsEqual(a: PuzzleUndoSnapshot, b: PuzzleUndoSnapshot): boolean {
  const keysA = Object.keys(a.userEntries).sort();
  const keysB = Object.keys(b.userEntries).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i] || a.userEntries[keysA[i]] !== b.userEntries[keysB[i]]) return false;
  }
  return JSON.stringify(a.notes) === JSON.stringify(b.notes);
}

export function createUndoStack() {
  const stack: PuzzleUndoSnapshot[] = [];

  return {
    clear() {
      stack.length = 0;
    },
    push(userEntries: PuzzleSolution, notes: PuzzleNotes) {
      const snap = cloneSnapshot(userEntries, notes);
      const last = stack[stack.length - 1];
      if (last && snapshotsEqual(last, snap)) return;
      stack.push(snap);
      if (stack.length > MAX_UNDO_DEPTH) stack.shift();
    },
    pop(): PuzzleUndoSnapshot | null {
      return stack.pop() ?? null;
    },
    get canUndo() {
      return stack.length > 0;
    },
    get depth() {
      return stack.length;
    },
  };
}

import { describe, expect, it } from 'vitest';
import { createUndoStack } from '@/lib/puzzle/undoStack';

describe('undoStack', () => {
  it('push pop restores state before last edit (LIFO)', () => {
    const stack = createUndoStack();
    // Same as session: push snapshot *before* each change.
    stack.push({}, {});
    // … user edits to { '0,0': 1 }
    stack.push({ '0,0': 1 }, {});
    // … user edits to { '0,0': 1, '0,1': 2 } with note on 0,1
    const prev = stack.pop();
    expect(prev?.userEntries).toEqual({ '0,0': 1 });
    expect(prev?.notes).toEqual({});
    expect(stack.canUndo).toBe(true);

    const prev2 = stack.pop();
    expect(prev2?.userEntries).toEqual({});
    expect(stack.canUndo).toBe(false);
  });

  it('skips duplicate consecutive snapshots', () => {
    const stack = createUndoStack();
    stack.push({ '0,0': 1 }, {});
    stack.push({ '0,0': 1 }, {});
    expect(stack.depth).toBe(1);
  });
});

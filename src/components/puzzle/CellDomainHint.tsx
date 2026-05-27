'use client';

import type { CellMeta } from '@/lib/puzzle/types';

interface CellDomainHintProps {
  selectedCellMeta: CellMeta | null;
  candidates: number[];
  notesMode: boolean;
}

export function CellDomainHint({
  selectedCellMeta,
  candidates,
  notesMode,
}: CellDomainHintProps) {
  if (!selectedCellMeta || selectedCellMeta.isBlocked || selectedCellMeta.isGiven) {
    return (
      <p className="text-sm text-muted-foreground text-center min-h-[1.25rem]">
        Chọn một ô trống để xem số có thể nhập.
      </p>
    );
  }

  const h = selectedCellMeta.hSegmentLength ?? '—';
  const v = selectedCellMeta.vSegmentLength ?? '—';
  const max = selectedCellMeta.maxAllowedValue ?? '—';

  if (notesMode) {
    return (
      <p className="text-sm text-center min-h-[1.25rem]">
        <span className="text-accent font-semibold">Đang ghi chú</span>
        <span className="text-muted-foreground">
          {' '}
          · Ô {selectedCellMeta.row + 1},{selectedCellMeta.col + 1} · ghi chú 1–{max}
        </span>
      </p>
    );
  }

  const candText =
    candidates.length > 0 ? candidates.join(', ') : '—';

  return (
    <p className="text-sm text-center min-h-[1.25rem]">
      <span className="text-muted-foreground">
        Ô {selectedCellMeta.row + 1},{selectedCellMeta.col + 1}: ngang {h} · dọc {v}
      </span>
      <span className="text-foreground font-semibold"> → Có thể: {candText}</span>
    </p>
  );
}

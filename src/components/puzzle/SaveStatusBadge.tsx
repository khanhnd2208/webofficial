'use client';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline';

interface SaveStatusBadgeProps {
  status: SaveStatus;
}

export function SaveStatusBadge({ status }: SaveStatusBadgeProps) {
  if (status === 'idle') return null;

  const label =
    status === 'saving'
      ? 'Đang lưu…'
      : status === 'saved'
        ? 'Đã lưu'
        : 'Lưu tạm trên thiết bị';

  return (
    <span
      className="text-[10px] uppercase tracking-wider text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {label}
    </span>
  );
}

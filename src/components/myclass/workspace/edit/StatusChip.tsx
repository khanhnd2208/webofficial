import { McBadge } from '@/components/myclass/ui';

const LABEL: Record<string, string> = {
	DRAFT: 'Nháp',
	PUBLISHED: 'Đã xuất bản',
	ARCHIVED: 'Lưu trữ',
};

export default function StatusChip({ status, hasDraft }: { status?: string; hasDraft?: boolean }) {
	if (!status && !hasDraft) return null;
	if (hasDraft && status === 'PUBLISHED') {
		return <McBadge variant="warning">Có bản nháp</McBadge>;
	}
	const variant = status === 'PUBLISHED' ? 'done' : status === 'ARCHIVED' ? 'neutral' : 'warning';
	return <McBadge variant={variant}>{LABEL[status ?? 'DRAFT'] ?? status}</McBadge>;
}

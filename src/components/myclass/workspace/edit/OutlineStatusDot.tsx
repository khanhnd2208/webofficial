const LABEL: Record<string, string> = {
	DRAFT: 'Nháp',
	PUBLISHED: 'Đã xuất bản',
	ARCHIVED: 'Lưu trữ',
};

export default function OutlineStatusDot({
	status,
	hasDraft,
}: {
	status?: string;
	hasDraft?: boolean;
}) {
	const draftPublished = Boolean(hasDraft && status === 'PUBLISHED');
	const isDraft = status === 'DRAFT' || (!status && hasDraft);
	const isArchived = status === 'ARCHIVED';
	if (!draftPublished && !isDraft && !isArchived) return null;

	const label = draftPublished ? 'Có bản nháp' : (LABEL[status ?? 'DRAFT'] ?? status ?? 'Nháp');
	const tone = isArchived ? 'archived' : 'draft';

	return (
		<span
			className="mc-outline-status-dot"
			data-tone={tone}
			title={label}
			aria-label={label}
		/>
	);
}

import { getMessageCounts } from '@/services/feedbackMessageService';
import { getPendingCommentCount } from '@/services/commentService';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	// Fetch pending counts for the sidebar badges
	let pendingCount = 0;
	let pendingCommentCount = 0;
	try {
		const [counts, commentCount] = await Promise.all([
			getMessageCounts(),
			getPendingCommentCount(),
		]);
		pendingCount = counts.pending;
		pendingCommentCount = commentCount;
	} catch {
		/* non-fatal */
	}

	return (
		<div className="flex min-h-screen bg-background">
			<AdminSidebar pendingCount={pendingCount} pendingCommentCount={pendingCommentCount} />
			<div className="flex-1 min-w-0 overflow-auto">
				{children}
			</div>
		</div>
	);
}

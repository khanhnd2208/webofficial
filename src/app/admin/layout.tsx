import { getMessageCounts } from '@/services/feedbackMessageService';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	// Fetch pending message count for the sidebar badge
	let pendingCount = 0;
	try {
		const counts = await getMessageCounts();
		pendingCount = counts.pending;
	} catch {
		/* non-fatal */
	}

	return (
		<div className="flex min-h-screen bg-background">
			<AdminSidebar pendingCount={pendingCount} />
			<div className="flex-1 min-w-0 overflow-auto">
				{children}
			</div>
		</div>
	);
}

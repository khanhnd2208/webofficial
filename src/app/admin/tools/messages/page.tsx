import { redirect } from 'next/navigation';

/**
 * Canonical admin Messages entry.
 * Pages still live under /messages until Phase 4 tool isolation.
 */
export default function AdminToolsMessagesPage() {
	redirect('/messages');
}

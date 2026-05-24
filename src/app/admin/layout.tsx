import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen bg-background">
			<AdminSidebar />
			<div className="flex-1 min-w-0 overflow-auto">
				{children}
			</div>
		</div>
	);
}

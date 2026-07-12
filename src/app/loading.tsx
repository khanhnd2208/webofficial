import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
	return (
		<main className="shell py-16" aria-busy="true" aria-label="Đang tải trang">
			<div className="mx-auto max-w-2xl space-y-6">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-10 w-3/4" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<div className="space-y-3 pt-6">
					<Skeleton className="h-32 w-full rounded-lg" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-4/5" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			</div>
		</main>
	);
}

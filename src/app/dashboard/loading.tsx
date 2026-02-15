export default function DashboardLoading() {
	return (
		<main className="min-h-screen bg-background-secondary">
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
				{/* Header Skeleton */}
				<header>
					<div className="h-7 w-48 animate-pulse rounded-md bg-surface-hover sm:h-8"></div>
					<div className="mt-1 h-4 w-64 animate-pulse rounded-md bg-surface-hover"></div>
				</header>

				{/* Quick Stats Skeleton */}
				<section className="mt-6 grid gap-3 sm:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="rounded-xl border border-border bg-surface p-4">
							<div className="h-7 w-12 animate-pulse rounded-md bg-surface-hover"></div>
							<div className="mt-1 h-4 w-20 animate-pulse rounded-md bg-surface-hover"></div>
						</div>
					))}
				</section>

				{/* Quick Actions Skeleton */}
				<section className="mt-8">
					<div className="h-6 w-32 animate-pulse rounded-md bg-surface-hover"></div>
					<div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="rounded-xl border border-border bg-surface p-4">
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 animate-pulse rounded-lg bg-surface-hover"></div>
									<div className="flex-1">
										<div className="h-5 w-24 animate-pulse rounded-md bg-surface-hover"></div>
										<div className="mt-1 h-3 w-32 animate-pulse rounded-md bg-surface-hover"></div>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* User Info Skeleton */}
				<section className="mt-8">
					<div className="h-6 w-40 animate-pulse rounded-md bg-surface-hover"></div>
					<div className="mt-3 rounded-xl border border-border bg-surface p-4">
						<div className="flex items-center gap-3">
							<div className="h-12 w-12 animate-pulse rounded-full bg-surface-hover"></div>
							<div>
								<div className="h-5 w-32 animate-pulse rounded-md bg-surface-hover"></div>
								<div className="mt-1 h-4 w-48 animate-pulse rounded-md bg-surface-hover"></div>
								<div className="mt-2 h-5 w-20 animate-pulse rounded-full bg-surface-hover"></div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}

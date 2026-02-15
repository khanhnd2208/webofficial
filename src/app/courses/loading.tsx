export default function CoursesLoading() {
	return (
		<main className="min-h-screen bg-background-secondary">
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
				{/* Header Skeleton */}
				<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div className="h-7 w-48 animate-pulse rounded-md bg-surface-hover sm:h-8"></div>
						<div className="mt-1 h-4 w-64 animate-pulse rounded-md bg-surface-hover"></div>
					</div>
					<div className="h-5 w-32 animate-pulse rounded-md bg-surface-hover"></div>
				</header>

				{/* Course Cards Skeleton */}
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div key={i} className="rounded-xl border border-border bg-surface p-4">
							<div className="h-6 w-3/4 animate-pulse rounded-md bg-surface-hover"></div>
							<div className="mt-2 h-4 w-full animate-pulse rounded-md bg-surface-hover"></div>
							<div className="mt-1 h-4 w-2/3 animate-pulse rounded-md bg-surface-hover"></div>
							
							<div className="mt-4 flex items-center gap-4">
								<div className="h-4 w-20 animate-pulse rounded-md bg-surface-hover"></div>
								<div className="h-4 w-24 animate-pulse rounded-md bg-surface-hover"></div>
							</div>
							
							<div className="mt-4 flex gap-2">
								<div className="h-6 w-16 animate-pulse rounded-full bg-surface-hover"></div>
								<div className="h-6 w-20 animate-pulse rounded-full bg-surface-hover"></div>
							</div>
							
							<div className="mt-4 h-0.5 w-full animate-pulse rounded-full bg-surface-hover"></div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}

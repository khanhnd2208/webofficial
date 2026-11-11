export default function DiscoverCoursesLoading() {
	return (
		<main
			className="min-h-svh bg-canvas px-6 pb-16 pt-28 sm:px-10 sm:pt-36"
			aria-busy="true"
			aria-label="Đang tải khóa học"
		>
			<div className="mx-auto max-w-4xl animate-pulse">
				<div className="h-3 w-36 rounded bg-ink/10" />
				<div className="mt-4 h-8 max-w-md rounded bg-ink/10" />
				<div className="mt-3 h-5 max-w-xl rounded bg-ink/10" />
				<div className="mt-8 flex flex-col gap-3">
					<div className="h-28 rounded-2xl border border-hairline bg-paper" />
					<div className="h-28 rounded-2xl border border-hairline bg-paper" />
				</div>
			</div>
		</main>
	);
}

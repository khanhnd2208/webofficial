/** Wait state for the course readers under /my-space/courses (the bare path redirects to /khoa-hoc). */
export default function LearnCatalogLoading() {
	return <main className="min-h-svh bg-canvas" aria-busy="true" aria-label="Đang tải khóa học" />;
}

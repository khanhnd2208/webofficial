'use client';

import Link from 'next/link';
import { useState } from 'react';

type SidebarUnit = {
	unitId: string;
	unitName: string;
	lessons: { id: string; title: string; vocabularyCount: number }[];
};

type Props = {
	courseId: string;
	courseName: string;
	units: SidebarUnit[];
	currentUnitId: string;
	currentLessonId: string;
};

export default function CourseSidebar({
	courseId,
	courseName,
	units,
	currentUnitId,
	currentLessonId,
}: Props) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
		const init: Record<string, boolean> = {};
		for (const u of units) {
			init[u.unitId] = u.unitId !== currentUnitId;
		}
		return init;
	});

	const toggle = (unitId: string) =>
		setCollapsed((prev) => ({ ...prev, [unitId]: !prev[unitId] }));

	const totalLessons = units.reduce((s, u) => s + u.lessons.length, 0);
	const allLessonsFlat = units.flatMap((u) => u.lessons);
	const currentGlobalIdx = allLessonsFlat.findIndex((l) => l.id === currentLessonId);

	const sidebar = (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b border-border px-4 py-4">
				<Link
					href={`/courses/${encodeURIComponent(courseId)}`}
					className="group flex items-center gap-2 text-sm font-semibold transition-colors hover:text-accent"
				>
					<svg
						className="h-4 w-4 text-muted group-hover:text-accent"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					<span className="truncate">{courseName}</span>
				</Link>
				{/* Progress */}
				<div className="mt-3">
					<div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted">
						<span>Tiến độ</span>
						<span>
							{currentGlobalIdx + 1}/{totalLessons}
						</span>
					</div>
					<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-hover">
						<div
							className="h-full rounded-full bg-accent transition-all duration-300"
							style={{
								width: `${totalLessons > 0 ? ((currentGlobalIdx + 1) / totalLessons) * 100 : 0}%`,
							}}
						/>
					</div>
				</div>
			</div>

			{/* Units & Lessons */}
			<nav className="flex-1 overflow-y-auto py-2">
				{units.map((u, unitIdx) => {
					const isCollapsed = collapsed[u.unitId] ?? false;
					const isCurrentUnit = u.unitId === currentUnitId;

					return (
						<div key={u.unitId} className="mb-1">
							{/* Unit header */}
							<button
								onClick={() => toggle(u.unitId)}
								className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors ${
									isCurrentUnit ? 'text-accent' : 'text-muted hover:text-foreground-secondary'
								}`}
							>
								<svg
									className={`h-3 w-3 shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2.5}
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
								</svg>
								<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surface-hover text-[10px] font-bold">
									{unitIdx + 1}
								</span>
								<span className="min-w-0 flex-1 truncate">{u.unitName}</span>
							</button>

							{/* Lessons */}
							{!isCollapsed ? (
								<ul className="space-y-0.5 pb-1">
									{u.lessons.map((l, lIdx) => {
										const isCurrent = l.id === currentLessonId;
										return (
											<li key={l.id}>
												<Link
													href={`/courses/${encodeURIComponent(courseId)}/units/${encodeURIComponent(u.unitId)}/lessons/${encodeURIComponent(l.id)}`}
													onClick={() => setMobileOpen(false)}
													className={`group flex items-center gap-2.5 py-2 pl-13 pr-4 text-sm transition-colors ${
														isCurrent
															? 'bg-accent-subtle font-semibold text-accent'
															: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
													}`}
												>
													<span
														className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
															isCurrent
																? 'bg-accent text-accent-foreground'
																: 'bg-surface-hover text-muted'
														}`}
													>
														{lIdx + 1}
													</span>
													<span className="min-w-0 flex-1 truncate">{l.title}</span>
													{l.vocabularyCount > 0 ? (
														<span className="shrink-0 text-[10px] text-muted">
															{l.vocabularyCount}
														</span>
													) : null}
												</Link>
											</li>
										);
									})}
								</ul>
							) : null}
						</div>
					);
				})}
			</nav>
		</div>
	);

	return (
		<>
			{/* Mobile toggle button */}
			<button
				onClick={() => setMobileOpen(true)}
				className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg lg:hidden"
				aria-label="Mở menu"
			>
				<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>

			{/* Desktop sidebar */}
			<aside className="hidden w-72 shrink-0 border-r border-border bg-surface lg:block">
				<div className="sticky top-0 h-screen overflow-hidden">{sidebar}</div>
			</aside>

			{/* Mobile overlay */}
			{mobileOpen ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div
						className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
						onClick={() => setMobileOpen(false)}
					/>
					<aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-surface shadow-lg">
						<div className="flex h-full flex-col">
							<div className="flex items-center justify-end border-b border-border px-4 py-3">
								<button
									onClick={() => setMobileOpen(false)}
									className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
								>
									<svg
										className="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							<div className="flex-1 overflow-hidden">{sidebar}</div>
						</div>
					</aside>
				</div>
			) : null}
		</>
	);
}

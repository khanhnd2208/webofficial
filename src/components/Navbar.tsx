'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

function initialsFromName(name: string | null | undefined) {
	const text = (name ?? '').trim();
	if (!text) return 'U';
	const parts = text.split(/\s+/).filter(Boolean);
	const first = parts[0]?.[0] ?? 'U';
	const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
	return `${first}${last}`.toUpperCase();
}

export default function Navbar() {
	const { data } = useSession();
	const user = data?.user;

	return (
		<header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/80">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
				{/* Logo */}
				<Link 
					href="/" 
					className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
				>
					<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					<span className="hidden sm:inline">NDK Learning</span>
				</Link>

				{/* Navigation */}
				<nav className="flex items-center gap-1">
					<Link 
						className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white" 
						href="/courses"
					>
						Khóa học
					</Link>
					<Link 
						className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white" 
						href="/blog"
					>
						Blog
					</Link>

					{/* Theme Toggle */}
					<div className="ml-2 hidden sm:block">
						<ThemeToggle />
					</div>

					{/* User Menu */}
					{user ? (
						<details className="group relative ml-2">
							<summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 [&::-webkit-details-marker]:hidden">
								<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
									{user.image ? (
										<img
											src={user.image}
											alt={user.name ?? 'Avatar'}
											className="h-full w-full object-cover"
											referrerPolicy="no-referrer"
										/>
									) : (
										<span className="text-xs font-semibold">{initialsFromName(user.name)}</span>
									)}
								</div>
								<svg className="h-4 w-4 text-neutral-500 transition-transform group-open:rotate-180 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</summary>

							<div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
								<div className="px-3 py-2">
									<div className="text-sm font-medium text-neutral-900 dark:text-white">{user.name ?? 'User'}</div>
									<div className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</div>
								</div>
								<div className="my-1.5 h-px bg-neutral-200 dark:bg-neutral-800" />
								<Link
									className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
									href="/dashboard"
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
									</svg>
									Dashboard
								</Link>

								{user.role === 'admin' ? (
									<Link
										className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
										href="/admin"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										Admin Portal
									</Link>
								) : null}

								<div className="my-1.5 h-px bg-neutral-200 dark:bg-neutral-800" />
								<button
									type="button"
									onClick={() => signOut({ callbackUrl: '/' })}
									className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									Đăng xuất
								</button>
							</div>
						</details>
					) : (
						<Link 
							className="ml-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600" 
							href="/login"
						>
							Đăng nhập
						</Link>
					)}
				</nav>
			</div>
		</header>
	);
}

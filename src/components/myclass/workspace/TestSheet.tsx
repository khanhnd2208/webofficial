'use client';

import { useEffect, useState } from 'react';
import type { MyClassTestForPlay, MyClassTestListItem } from '@/features/my-class/types';
import { McBadge, McButton, McEmpty, McSheet, McSkeleton } from '@/components/myclass/ui';
import TestRunner from '@/components/myclass/TestRunner';

export default function TestSheet({
	open,
	onClose,
	courseSlug,
	test,
	onResult,
	variant = 'overlay',
	preview = false,
}: {
	open: boolean;
	onClose: () => void;
	courseSlug: string;
	test: MyClassTestListItem | null;
	onResult?: (slug: string, result: { score: number; total: number }) => void;
	variant?: 'overlay' | 'inline';
	preview?: boolean;
}) {
	const [result, setResult] = useState<{
		slug: string;
		play: MyClassTestForPlay | null;
		error: string | null;
	}>({ slug: '', play: null, error: null });

	useEffect(() => {
		if (!open || !test) return;
		let cancelled = false;
		const url =
			preview && test.id
				? `/api/admin/my-class/tests/${test.id}/preview`
				: `/api/my-class/tests/${courseSlug}/${test.slug}`;
		void fetch(url)
			.then((response) => response.json())
			.then((json: { ok: boolean; data?: MyClassTestForPlay; error?: string }) => {
				if (cancelled) return;
				if (!json.ok || !json.data) {
					setResult({
						slug: test.slug,
						play: null,
						error: json.error || 'Không tải được bài kiểm tra.',
					});
					return;
				}
				setResult({ slug: test.slug, play: json.data, error: null });
			})
			.catch(() => {
				if (!cancelled) {
					setResult({
						slug: test.slug,
						play: null,
						error: 'Không tải được bài kiểm tra.',
					});
				}
			});
		return () => {
			cancelled = true;
		};
	}, [open, courseSlug, preview, test]);

	const title = test
		? `${test.title.trim() || 'Kiểm tra'} · ${test.questionCount} câu`
		: 'Kiểm tra';
	const currentResult = test && result.slug === test.slug ? result : { play: null, error: null };
	const { play, error } = currentResult;
	const ready = Boolean(play && test && play.slug === test.slug && play.questions.length);

	const body = (
		<>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			{!error && play && test && play.slug === test.slug && !play.questions.length ? (
				<McEmpty
					title="Chưa có câu hỏi"
					description="Thêm câu từ ngân hàng trong studio, rồi mở lại bài này."
				/>
			) : null}
			{!error && !ready && !(play && test && play.slug === test.slug) ? (
				<div className="space-y-3" aria-busy="true">
					<McSkeleton className="h-4 w-1/3" />
					<McSkeleton className="h-16 w-full" />
					<McSkeleton className="h-12 w-full" />
					<McSkeleton className="h-12 w-full" />
				</div>
			) : null}
			{ready && play ? (
				<TestRunner
					test={play}
					embedded
					onDismiss={onClose}
					onResult={(result) => onResult?.(play.slug, result)}
				/>
			) : null}
		</>
	);

	if (variant === 'inline') {
		if (!open || !test) return null;
		return (
			<div className="pb-20 lg:pb-8" data-testid="my-class-test-pane">
				<header className="mb-4 flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<McBadge variant="test">TEST</McBadge>
						<p className="mc-meta mc-num truncate">{test.questionCount} câu</p>
					</div>
					<McButton variant="quiet" onClick={onClose}>
						Đóng
					</McButton>
				</header>
				{body}
			</div>
		);
	}

	return (
		<McSheet open={open && Boolean(test)} onClose={onClose} title={title} side="full">
			{body}
		</McSheet>
	);
}

import SignInWithGoogleButton from './sign-in-with-google-button';

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ from?: string }>;
}) {
	const sp = await searchParams;
	const from = sp?.from ?? '/dashboard';

	return (
		<main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center bg-white px-6 py-12">
			<div className="rounded-xl border border-foreground/10 p-6">
				<h1 className="text-2xl font-semibold">Đăng nhập</h1>
				<p className="mt-2 text-sm text-foreground/70">
					Dùng Google để đăng nhập. Hệ thống sẽ tự phân quyền Admin/Sinh viên theo email.
				</p>

				<div className="mt-5">
					<SignInWithGoogleButton callbackUrl={from} />
				</div>
				<p className="mt-2 text-xs text-foreground/60">
					Nếu nút bị vô hiệu, hãy kiểm tra `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` trong `.env.local`.
				</p>

				<p className="mt-4 text-xs text-foreground/60">
					Sau khi đăng nhập sẽ quay lại: <span className="font-mono">{from}</span>
				</p>
			</div>
		</main>
	);
}

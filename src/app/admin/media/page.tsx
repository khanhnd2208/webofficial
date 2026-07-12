import { AdminComingSoon } from '../AdminComingSoon';

export const metadata = {
	title: 'Thư viện tệp | Admin',
};

export default function AdminMediaPage() {
	return (
		<AdminComingSoon
			title="Thư viện tệp"
			description="Thư viện media Cloudflare R2 sẽ được bổ sung ở giai đoạn Media migration."
		/>
	);
}

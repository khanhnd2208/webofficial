import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

export default async function MessageManageRedirect({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	redirect(routes.admin.messageEdit(slug));
}

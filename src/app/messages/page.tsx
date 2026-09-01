import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

export default function MessagesRedirect() {
	redirect(routes.admin.messages);
}

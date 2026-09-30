import { permanentRedirect } from 'next/navigation';
import { routes } from '@/config/routes';

/** Safety net for client navigation; incoming requests use PUBLIC_REDIRECTS. */
export default function ServicesPage() {
	permanentRedirect(routes.aboutServices);
}

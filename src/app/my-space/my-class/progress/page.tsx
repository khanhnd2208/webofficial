import { redirect } from 'next/navigation';
import { routes } from '@/config/routes';

export default function MyClassProgressRedirect() {
	redirect(routes.myClass);
}

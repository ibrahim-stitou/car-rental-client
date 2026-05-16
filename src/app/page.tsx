import { redirect } from 'next/navigation';
import { paths } from '@/config/paths';

export default function RootPage() {
  redirect(paths.auth.signIn);
}

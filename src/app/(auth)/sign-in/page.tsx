import type { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In | MyFleet-Control',
  description: 'Sign in to the MyFleet-Control Management System.',
};

export default function SignInPage() {
  return <SignInViewPage />;
}

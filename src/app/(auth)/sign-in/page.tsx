import type { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In | Car Rental',
  description: 'Sign in to the Car Rental Management System.',
};

export default function SignInPage() {
  return <SignInViewPage />;
}

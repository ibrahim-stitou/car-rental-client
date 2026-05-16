import type { Metadata } from 'next';
import ForgotPasswordView from '@/features/auth/components/forgot-password-view';
import { IconCar } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Forgot Password | Car Rental',
};

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card/90 px-8 py-10 shadow-2xl backdrop-blur-md">
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <IconCar size={28} />
          </div>
        </div>
        <ForgotPasswordView />
      </div>
    </div>
  );
}
